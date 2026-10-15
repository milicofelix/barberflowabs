import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { auditarFidelidade, CarteiraFidelidadeRepository } from './carteira-fidelidade.repository';
import { ProgramaFidelidadeRepository } from './programa-fidelidade.repository';

export function validarIdentidadesIndicacao(indicador: any, indicado: any) {
  const telefone = (u: any) => {
    const n = (u.telefone ?? '').replace(/\D/g, '').replace(/^00/, '');
    const completo = n.length === 10 || n.length === 11 ? `55${n}` : n;
    return /^55[1-9]\d{9,10}$/.test(completo) ? completo : '';
  };
  const a = indicador.usuario; const b = indicado.usuario;
  const emailsIguais = a.email?.trim().toLowerCase() && a.email.trim().toLowerCase() === b.email?.trim().toLowerCase();
  if (a.id === b.id || emailsIguais || !telefone(a) || !telefone(b) || telefone(a) === telefone(b) || a.papel !== 'CUSTOMER' || b.papel !== 'CUSTOMER') throw new ConflictException('Indicação exige clientes distintos, telefones diferentes e revisão de identidade');
}

@Injectable()
export class IndicacaoFidelidadeRepository {
  constructor(private readonly prisma: PrismaService, private readonly carteiras: CarteiraFidelidadeRepository, private readonly programas: ProgramaFidelidadeRepository) {}

  listar(estabelecimentoId: number, pagina: number) {
    return (this.prisma as any).indicacaoFidelidade.findMany({ where: { indicado: { cliente: { estabelecimentoId } } }, orderBy: { id: 'desc' }, skip: (pagina - 1) * 50, take: 50 });
  }

  async registrar(estabelecimentoId: number, usuarioId: number, indicadorId: number, indicadoId: number) {
    return this.prisma.$transaction(async (tx: any) => {
      const programa = await this.programas.bloquearPrograma(tx, estabelecimentoId);
      if (!programa.ativo) throw new ConflictException('Programa desativado');
      const indicador = await this.carteiras.cliente(tx, estabelecimentoId, indicadorId);
      const indicado = await this.carteiras.cliente(tx, estabelecimentoId, indicadoId);
      validarIdentidadesIndicacao(indicador, indicado);
      for (const id of [indicadorId, indicadoId].sort((a, b) => a - b)) await this.carteiras.bloquear(tx, id);
      const existente = await tx.indicacaoFidelidade.findUnique({ where: { indicadoId } });
      if (existente) {
        if (existente.indicadorId !== indicadorId) throw new ConflictException('Indicação já atribuída a outro cliente');
        return existente;
      }
      if (await tx.agendamento.count({ where: { estabelecimentoId, usuarioId: indicado.usuarioId, status: 'CONCLUIDO' } })) throw new ConflictException('Atribua a indicação antes do primeiro atendimento concluído');
      // Evita ciclos de indicação direta ou indireta; máximo explícito de 100 elos.
      let ancestral = indicadorId;
      for (let i = 0; i < 100; i++) {
        if (ancestral === indicadoId) throw new ConflictException('Ciclo de indicações não permitido');
        const anterior = await tx.indicacaoFidelidade.findUnique({ where: { indicadoId: ancestral } });
        if (!anterior) { ancestral = 0; break; }
        ancestral = anterior.indicadorId;
      }
      if (ancestral) throw new ConflictException('Cadeia de indicações excede limite de revisão');
      const indicacao = await tx.indicacaoFidelidade.create({ data: { indicadorId, indicadoId } });
      await auditarFidelidade(tx, estabelecimentoId, usuarioId, 'FIDELIDADE_INDICACAO_ATRIBUIDA', indicacao.id, { indicadorId, indicadoId });
      return indicacao;
    }, { isolationLevel: 'ReadCommitted' });
  }

  async aprovar(estabelecimentoId: number, usuarioId: number, id: number) {
    return this.prisma.$transaction(async (tx: any) => {
      const programa = await this.programas.bloquearPrograma(tx, estabelecimentoId);
      if (!programa.ativo) throw new ConflictException('Programa desativado');
      const indicacao = await tx.indicacaoFidelidade.findFirst({ where: { id, indicado: { cliente: { estabelecimentoId } } } });
      if (!indicacao) throw new NotFoundException('Indicação não encontrada');
      if (indicacao.status !== 'PENDENTE') return indicacao;
      const indicador = await this.carteiras.cliente(tx, estabelecimentoId, indicacao.indicadorId);
      const indicado = await this.carteiras.cliente(tx, estabelecimentoId, indicacao.indicadoId);
      validarIdentidadesIndicacao(indicador, indicado);
      if (await tx.agendamento.count({ where: { estabelecimentoId, usuarioId: indicado.usuarioId, status: 'CONCLUIDO' } })) throw new ConflictException('A revisão precisa ocorrer antes do primeiro atendimento concluído');
      const atualizada = await tx.indicacaoFidelidade.update({ where: { id }, data: { status: 'APROVADA', aprovadoPorId: usuarioId, bonusPontos: programa.bonusIndicacao } });
      await auditarFidelidade(tx, estabelecimentoId, usuarioId, 'FIDELIDADE_INDICACAO_APROVADA', id, { bonusPontos: programa.bonusIndicacao });
      return atualizada;
    }, { isolationLevel: 'ReadCommitted' });
  }
}
