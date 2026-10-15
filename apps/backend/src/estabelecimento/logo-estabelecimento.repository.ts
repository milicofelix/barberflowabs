import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';

@Injectable()
export class LogoEstabelecimentoRepository {
  constructor(private readonly prisma: PrismaService) {}
  obter(estabelecimentoId: number) { return (this.prisma as any).estabelecimento.findUnique({ where: { id: estabelecimentoId }, select: { id: true, nome: true, nomePublico: true, logoModo: true, logoURL: true } }); }

  salvar(estabelecimentoId: number, usuarioId: number, d: { logoModo: string; midiaId?: string }) {
    if (!['PADRAO', 'PERSONALIZADO', 'OCULTO'].includes(d?.logoModo)) throw new BadRequestException('Selecione logo padrão, personalizado ou nenhum logo');
    if (d.midiaId !== undefined && (typeof d.midiaId !== 'string' || !/^[a-f0-9-]{36}$/.test(d.midiaId))) throw new BadRequestException('Selecione uma imagem enviada');
    return this.prisma.$transaction(async (tx: any) => {
      await tx.$queryRaw`SELECT id FROM estabelecimentos WHERE id=${estabelecimentoId} FOR UPDATE`;
      const atual = await tx.estabelecimento.findUnique({ where: { id: estabelecimentoId } });
      if (!atual) throw new NotFoundException('Estabelecimento não encontrado');
      let logoURL = atual.logoURL;
      if (d.midiaId) {
        await tx.$queryRaw`SELECT id FROM midias WHERE id=${d.midiaId} FOR UPDATE`;
        const midia = await tx.midia.findFirst({ where: { id: d.midiaId, estabelecimentoId, escopo: 'ESTABELECIMENTO', finalidade: 'LOGO', ativo: true, status: 'DISPONIVEL' } });
        if (!midia?.versoes?.principal?.url) throw new BadRequestException('Logo indisponível ou pertencente a outra unidade');
        logoURL = midia.versoes.principal.url;
        await tx.midiaVinculo.deleteMany({ where: { entidade: 'ESTABELECIMENTO_LOGO', entidadeId: estabelecimentoId } });
        await tx.midiaVinculo.create({ data: { entidade: 'ESTABELECIMENTO_LOGO', entidadeId: estabelecimentoId, midiaId: midia.id } });
      }
      if (d.logoModo === 'PERSONALIZADO' && !logoURL) throw new BadRequestException('Envie o logo antes de selecionar a opção personalizada');
      const salvo = await tx.estabelecimento.update({ where: { id: estabelecimentoId }, data: { logoModo: d.logoModo, logoURL }, select: { id: true, nome: true, nomePublico: true, logoModo: true, logoURL: true } });
      await tx.logAuditoria.create({ data: { estabelecimentoId, usuarioId, acao: 'ESTABELECIMENTO_LOGO_ALTERADO', entidade: 'Estabelecimento', entidadeId: String(estabelecimentoId), detalhes: { anterior: atual.logoModo, novo: d.logoModo, midiaId: d.midiaId ?? null } } });
      return salvo;
    });
  }
}
