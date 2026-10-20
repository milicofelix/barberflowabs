import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { AplicarBeneficioDto, brutoCentavos, inteiro, texto } from './fidelidade.dto';
import { auditarFidelidade, bloquearTenantFidelidade, CarteiraFidelidadeRepository } from './carteira-fidelidade.repository';
import { ProgramaFidelidadeRepository } from './programa-fidelidade.repository';

@Injectable()
export class BeneficioFidelidadeRepository {
  constructor(private readonly prisma: PrismaService, private readonly carteiras: CarteiraFidelidadeRepository, private readonly programas: ProgramaFidelidadeRepository) {}

  async obter(estabelecimentoId: number, agendamentoId: number) {
    const a = await (this.prisma as any).agendamento.findFirst({ where: { id: agendamentoId, estabelecimentoId }, include: { itens: { select: { preco: true } }, servicos: { select: { preco: true } }, beneficiosFidelidade: { orderBy: { id: 'desc' } }, liquidacaoFidelidade: true } });
    if (!a) throw new NotFoundException('Agendamento não encontrado');
    const ativo = a.beneficiosFidelidade.find((b: any) => b.status !== 'CANCELADO');
    return { agendamentoId, brutoCentavos: brutoCentavos(a), descontoCentavos: ativo?.descontoCentavos ?? 0, liquidoCentavos: Math.max(0, brutoCentavos(a) - (ativo?.descontoCentavos ?? 0)), beneficios: a.beneficiosFidelidade, liquidacao: a.liquidacaoFidelidade };
  }

  async aplicar(estabelecimentoId: number, usuarioId: number, agendamentoId: number, dados: AplicarBeneficioDto) {
    const chave = `${estabelecimentoId}:${texto(dados?.chaveIdempotencia, 100)}`;
    if ((dados.recompensaId !== undefined) === (dados.codigoCupom !== undefined)) throw new BadRequestException('Selecione uma recompensa OU um cupom');
    const recompensaId = dados.recompensaId === undefined ? null : inteiro(dados.recompensaId);
    const codigo = dados.codigoCupom === undefined ? null : texto(dados.codigoCupom, 40).toUpperCase();
    return this.prisma.$transaction(async (tx: any) => {
      const a = await this.bloquearAgendamento(tx, estabelecimentoId, agendamentoId);
      const programa = await this.programas.bloquearPrograma(tx, estabelecimentoId);
      const repetido = await tx.beneficioFidelidade.findUnique({ where: { chave } });
      if (repetido) {
        if (repetido.agendamentoId !== agendamentoId || repetido.recompensaId !== recompensaId || repetido.snapshot.codigoCupom !== codigo) throw new ConflictException('Chave já utilizada com outros dados');
        return repetido;
      }
      this.validarAgendamento(a);
      if (!programa.ativo) throw new ConflictException('Programa de fidelidade desativado');
      const cliente = await tx.clienteEstabelecimento.findUnique({ where: { estabelecimentoId_usuarioId: { estabelecimentoId, usuarioId: a.usuarioId } } });
      if (!cliente || cliente.status !== 'ATIVO') throw new ConflictException('Cliente sem vínculo ativo');
      await this.carteiras.bloquear(tx, cliente.id);
      if (await tx.beneficioFidelidade.findFirst({ where: { agendamentoId, status: { in: ['APLICADO', 'CONSUMIDO'] } } })) throw new ConflictException('O agendamento já possui benefício');
      const oferta = recompensaId
        ? await tx.recompensaFidelidade.findFirst({ where: { id: recompensaId, estabelecimentoId, ativo: true } })
        : await tx.cupomFidelidade.findFirst({ where: { estabelecimentoId, codigo, ativo: true } });
      if (!oferta) throw new NotFoundException('Benefício não encontrado ou desativado');
      const agora = new Date();
      if (!recompensaId) await this.validarCupom(tx, oferta, cliente, a, agora);
      const descontoCentavos = Math.min(brutoCentavos(a), oferta.descontoCentavos);
      if (descontoCentavos <= 0) throw new ConflictException('Agendamento sem valor para desconto');
      const beneficio = await tx.beneficioFidelidade.create({ data: {
        chave, agendamentoId, clienteId: cliente.id, recompensaId, cupomId: recompensaId ? null : oferta.id,
        chaveAtiva: `agendamento:${agendamentoId}`, descontoCentavos, pontos: recompensaId ? oferta.pontos : 0,
        snapshot: { nome: oferta.nome ?? oferta.codigo, codigoCupom: codigo, descontoOfertadoCentavos: oferta.descontoCentavos, elegibilidade: oferta.elegibilidade ?? {}, operadorId: usuarioId },
      } });
      if (recompensaId) await this.carteiras.debitar(tx, cliente.id, oferta.pontos, beneficio.id, agora);
      await auditarFidelidade(tx, estabelecimentoId, usuarioId, 'FIDELIDADE_BENEFICIO_APLICADO', beneficio.id, { agendamentoId, descontoCentavos, pontos: beneficio.pontos });
      return beneficio;
    }, { isolationLevel: 'ReadCommitted' });
  }

  async cancelar(estabelecimentoId: number, usuarioId: number, agendamentoId: number) {
    return this.prisma.$transaction(async (tx: any) => {
      const a = await this.bloquearAgendamento(tx, estabelecimentoId, agendamentoId);
      this.validarAgendamento(a);
      await this.programas.bloquearPrograma(tx, estabelecimentoId);
      await this.cancelarNaTransacao(tx, a, usuarioId);
      return { cancelado: true };
    }, { isolationLevel: 'ReadCommitted' });
  }

  async cancelarNaTransacao(tx: any, a: any, usuarioId: number | null) {
    const beneficio = await tx.beneficioFidelidade.findFirst({ where: { agendamentoId: a.id, status: 'APLICADO' } });
    if (!beneficio) return;
    await this.carteiras.bloquear(tx, beneficio.clienteId);
    await this.carteiras.estornar(tx, beneficio);
    await tx.beneficioFidelidade.update({ where: { id: beneficio.id }, data: { status: 'CANCELADO', chaveAtiva: null } });
    await auditarFidelidade(tx, a.estabelecimentoId, usuarioId, 'FIDELIDADE_BENEFICIO_CANCELADO', beneficio.id, { agendamentoId: a.id });
  }

  private async bloquearAgendamento(tx: any, estabelecimentoId: number, id: number) {
    await bloquearTenantFidelidade(tx, estabelecimentoId);
    await tx.$queryRaw`SELECT id FROM agendamentos WHERE id = ${id} AND estabelecimentoId = ${estabelecimentoId} FOR UPDATE`;
    const a = await tx.agendamento.findFirst({ where: { id, estabelecimentoId }, include: { itens: { select: { preco: true } }, servicos: { select: { id: true, preco: true } }, contasFinanceiras: { select: { id: true } } } });
    if (!a) throw new NotFoundException('Agendamento não encontrado');
    return a;
  }
  private validarAgendamento(a: any) {
    if (!['AGENDADO', 'CONFIRMADO', 'ATRASADO'].includes(a.status) || a.contasFinanceiras.length) throw new ConflictException('Altere benefícios antes do atendimento e da geração financeira');
  }
  private async validarCupom(tx: any, cupom: any, cliente: any, a: any, agora: Date) {
    if (agora < cupom.inicio || agora >= cupom.fim || brutoCentavos(a) < cupom.minimoCentavos) throw new ConflictException('Cupom fora do período ou do valor mínimo');
    const e = cupom.elegibilidade;
    if (e.tags?.length && !e.tags.some((t: string) => Array.isArray(cliente.tags) && cliente.tags.includes(t))) throw new ConflictException('Cliente não elegível às tags do cupom');
    if (e.servicoIds?.length && !a.servicos.some((s: any) => e.servicoIds.includes(s.id))) throw new ConflictException('Serviço não elegível');
    if (e.primeiraVisita && await tx.agendamento.count({ where: { estabelecimentoId: a.estabelecimentoId, usuarioId: a.usuarioId, status: 'CONCLUIDO' } })) throw new ConflictException('Cupom exclusivo para primeira visita');
    if (e.primeiraVisita && await tx.beneficioFidelidade.count({ where: { clienteId: cliente.id, status: 'APLICADO', snapshot: { path: '$.elegibilidade.primeiraVisita', equals: true } } })) throw new ConflictException('Cliente já possui cupom de primeira visita reservado');
    const where = { cupomId: cupom.id, status: { in: ['APLICADO', 'CONSUMIDO'] } };
    const total = await tx.beneficioFidelidade.count({ where });
    const pessoal = await tx.beneficioFidelidade.count({ where: { ...where, clienteId: cliente.id } });
    if (total >= cupom.limiteTotal || pessoal >= cupom.limitePorCliente) throw new ConflictException('Limite de uso do cupom atingido');
  }
}
