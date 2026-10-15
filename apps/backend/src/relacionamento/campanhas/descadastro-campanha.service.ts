import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHmac } from 'crypto';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from 'src/db/prisma.service';
import { CANAIS_COMUNICACAO } from '../relacionamento.constants';

@Injectable()
export class DescadastroCampanhaService {
  constructor(private readonly prisma: PrismaService) {}
  private segredo() {
    const segredo = process.env.AGENDAMENTO_ACAO_SECRET || process.env.JWT_SECRET;
    if (!segredo) throw new Error('Segredo de descadastro não configurado');
    return createHmac('sha256', segredo).update('UNIFLOW_CAMPANHA_DESCADASTRO_V1').digest('hex');
  }
  url(estabelecimentoId: number, usuarioId: number, canal: string) {
    const token = jwt.sign({ scope: 'CAMPANHA_DESCADASTRO', estabelecimentoId, usuarioId, canal }, this.segredo(), { algorithm: 'HS256', expiresIn: '180d' });
    const base = (process.env.PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
    return `${base}/comunicacoes/descadastro?token=${encodeURIComponent(token)}`;
  }
  consultar(token: string) {
    try {
      if (typeof token !== 'string' || token.length > 2000) throw new Error();
      const dados = jwt.verify(token, this.segredo(), { algorithms: ['HS256'] }) as any;
      if (dados.scope !== 'CAMPANHA_DESCADASTRO' || !Number.isSafeInteger(dados.estabelecimentoId) || dados.estabelecimentoId <= 0 || !Number.isSafeInteger(dados.usuarioId) || dados.usuarioId <= 0 || !CANAIS_COMUNICACAO.includes(dados.canal)) throw new Error();
      return { estabelecimentoId: dados.estabelecimentoId as number, usuarioId: dados.usuarioId as number, canal: dados.canal as string };
    } catch { throw new UnauthorizedException('Link inválido ou expirado; solicite um novo link ou altere suas preferências autenticado'); }
  }
  async confirmar(token: string) {
    const dados = this.consultar(token);
    return this.prisma.$transaction(async (tx: any) => {
      const usuario = await tx.usuario.findUnique({ where: { id: dados.usuarioId }, select: { id: true } });
      if (!usuario) throw new UnauthorizedException('Link indisponível');
      await tx.$queryRaw`SELECT id FROM clientes_estabelecimentos WHERE estabelecimentoId = ${dados.estabelecimentoId} AND usuarioId = ${dados.usuarioId} FOR UPDATE`;
      const preferencia = await tx.preferenciaComunicacao.findUnique({ where: { estabelecimentoId_usuarioId_canal: dados } });
      const supressao = await tx.supressaoComunicacao.findUnique({ where: { estabelecimentoId_usuarioId_canal: dados } });
      await tx.preferenciaComunicacao.upsert({ where: { estabelecimentoId_usuarioId_canal: dados }, create: { ...dados, consentido: false, origem: 'USUARIO', revogadoEm: new Date() }, update: { consentido: false, revogadoEm: new Date(), origem: 'USUARIO' } });
      await tx.supressaoComunicacao.upsert({ where: { estabelecimentoId_usuarioId_canal: dados }, create: { ...dados, ativa: true, motivo: 'DESCADASTRO_PELO_CLIENTE' }, update: { ativa: true, motivo: 'DESCADASTRO_PELO_CLIENTE' } });
      await tx.envioComunicacao.updateMany({ where: { ...dados, campanhaId: { not: null }, status: { in: ['AGENDADO', 'RETENTATIVA'] } }, data: { status: 'CANCELADO', erro: 'DESCADASTRO_PELO_CLIENTE' } });
      if (preferencia?.consentido || !supressao?.ativa) await tx.logAuditoria.create({ data: { estabelecimentoId: dados.estabelecimentoId, usuarioId: dados.usuarioId, acao: 'CAMPANHA_DESCADASTRO', entidade: 'PreferenciaComunicacao', detalhes: { canal: dados.canal } } });
      return { descadastrado: true, canal: dados.canal };
    });
  }
}
