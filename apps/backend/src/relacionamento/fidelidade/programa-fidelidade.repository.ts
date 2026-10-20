import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { CupomDto, ProgramaDto, RecompensaDto, validarCupom, validarPrograma, validarRecompensa } from './fidelidade.dto';
import { auditarFidelidade, bloquearTenantFidelidade } from './carteira-fidelidade.repository';

@Injectable()
export class ProgramaFidelidadeRepository {
  constructor(private readonly prisma: PrismaService) {}
  private get db(): any { return this.prisma; }

  async obter(estabelecimentoId: number) {
    const programa = await this.db.programaFidelidade.findUnique({ where: { estabelecimentoId }, include: { recompensas: { orderBy: { id: 'asc' }, take: 100 }, cupons: { orderBy: { id: 'desc' }, take: 100 } } });
    return programa ?? { estabelecimentoId, ativo: false, centavosPorPonto: 100, validadeDias: 365, bonusIndicacao: 0, minimoIndicacaoCentavos: 0, niveis: [{ nome: 'Inicial', pontos: 0 }], recompensas: [], cupons: [] };
  }

  salvar(estabelecimentoId: number, usuarioId: number, dados: ProgramaDto) {
    const config = validarPrograma(dados);
    return this.prisma.$transaction(async (tx: any) => {
      await bloquearTenantFidelidade(tx, estabelecimentoId);
      const programa = await tx.programaFidelidade.upsert({ where: { estabelecimentoId }, create: { estabelecimentoId, ...config }, update: config });
      await auditarFidelidade(tx, estabelecimentoId, usuarioId, 'FIDELIDADE_PROGRAMA_SALVO', estabelecimentoId, config);
      return programa;
    }, { isolationLevel: 'ReadCommitted' });
  }

  async salvarRecompensa(estabelecimentoId: number, usuarioId: number, dados: RecompensaDto, id?: number) {
    const config = validarRecompensa(dados);
    return this.prisma.$transaction(async (tx: any) => {
      await this.bloquearPrograma(tx, estabelecimentoId);
      if (id && !await tx.recompensaFidelidade.findFirst({ where: { id, estabelecimentoId } })) throw new NotFoundException('Recompensa não encontrada');
      const recompensa = id ? await tx.recompensaFidelidade.update({ where: { id }, data: config }) : await tx.recompensaFidelidade.create({ data: { estabelecimentoId, ...config } });
      await auditarFidelidade(tx, estabelecimentoId, usuarioId, 'FIDELIDADE_RECOMPENSA_SALVA', recompensa.id, config);
      return recompensa;
    }, { isolationLevel: 'ReadCommitted' });
  }

  async salvarCupom(estabelecimentoId: number, usuarioId: number, dados: CupomDto, id?: number) {
    const config = validarCupom(dados);
    try { return await this.prisma.$transaction(async (tx: any) => {
      await this.bloquearPrograma(tx, estabelecimentoId);
      if (id && !await tx.cupomFidelidade.findFirst({ where: { id, estabelecimentoId } })) throw new NotFoundException('Cupom não encontrado');
      if (config.elegibilidade.servicoIds?.length && await tx.servico.count({ where: { estabelecimentoId, id: { in: config.elegibilidade.servicoIds } } }) !== config.elegibilidade.servicoIds.length) throw new NotFoundException('Serviço não pertence ao estabelecimento');
      const cupom = id ? await tx.cupomFidelidade.update({ where: { id }, data: config }) : await tx.cupomFidelidade.create({ data: { estabelecimentoId, ...config } });
      await auditarFidelidade(tx, estabelecimentoId, usuarioId, 'FIDELIDADE_CUPOM_SALVO', cupom.id, { ...config, inicio: config.inicio.toISOString(), fim: config.fim.toISOString() });
      return cupom;
    }, { isolationLevel: 'ReadCommitted' }); } catch (e: any) { if (e.code === 'P2002') throw new ConflictException('Código de cupom já cadastrado'); throw e; }
  }

  async bloquearPrograma(tx: any, estabelecimentoId: number) {
    await bloquearTenantFidelidade(tx, estabelecimentoId);
    const linhas = await tx.$queryRaw`SELECT estabelecimentoId FROM programas_fidelidade WHERE estabelecimentoId = ${estabelecimentoId} FOR UPDATE`;
    if (!linhas.length) throw new ConflictException('Configure o programa de fidelidade primeiro');
    return tx.programaFidelidade.findUnique({ where: { estabelecimentoId } });
  }
}
