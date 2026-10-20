import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { CANAIS_COMUNICACAO } from '../relacionamento.constants';
import { inteiroCampanha } from './campanha.dto';
@Injectable()
export class SupressaoCampanhaRepository {
  constructor(private readonly prisma: PrismaService) {}
  async salvar(estabelecimentoId: number, usuarioId: number, dados: { clienteId: number; canal: string; motivo: string; ativa: boolean }) {
    inteiroCampanha(dados?.clienteId, 1, 2147483647);
    if (!CANAIS_COMUNICACAO.includes(dados.canal as any) || typeof dados.ativa !== 'boolean' || typeof dados.motivo !== 'string' || !dados.motivo.trim() || dados.motivo.length > 300) throw new BadRequestException('Canal, motivo e estado da supressão são obrigatórios');
    return this.prisma.$transaction(async (tx: any) => {
      const cliente = await tx.clienteEstabelecimento.findFirst({ where: { id: dados.clienteId, estabelecimentoId } });
      if (!cliente) throw new NotFoundException('Cliente não encontrado nesta unidade');
      await tx.$queryRaw`SELECT id FROM clientes_estabelecimentos WHERE id = ${cliente.id} AND estabelecimentoId = ${estabelecimentoId} FOR UPDATE`;
      const chave = { estabelecimentoId, usuarioId: cliente.usuarioId, canal: dados.canal };
      const supressao = await tx.supressaoComunicacao.upsert({ where: { estabelecimentoId_usuarioId_canal: chave }, create: { ...chave, motivo: dados.motivo.trim(), ativa: dados.ativa }, update: { motivo: dados.motivo.trim(), ativa: dados.ativa } });
      if (dados.ativa) await tx.envioComunicacao.updateMany({ where: { ...chave, campanhaId: { not: null }, status: { in: ['AGENDADO', 'RETENTATIVA'] } }, data: { status: 'CANCELADO', erro: 'SUPRESSAO_ATIVA' } });
      await tx.logAuditoria.create({ data: { estabelecimentoId, usuarioId, acao: 'CAMPANHA_SUPRESSAO_ALTERADA', entidade: 'SupressaoComunicacao', entidadeId: String(supressao.id), detalhes: { canal: dados.canal, ativa: dados.ativa } } });
      return supressao;
    });
  }
}
