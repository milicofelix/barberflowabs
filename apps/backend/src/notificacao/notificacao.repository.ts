import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';

@Injectable()
export class NotificacaoRepository {
  constructor(private readonly prisma: PrismaService) {}

  listar(usuarioId: number) {
    return (this.prisma as any).notificacaoUsuario.findMany({
      where: { usuarioId, OR: [{ expiraEm: null }, { expiraEm: { gt: new Date() } }] },
      orderBy: [{ lidaEm: 'asc' }, { createdAt: 'desc' }], take: 50,
    });
  }
  contarNaoLidas(usuarioId: number) {
    return (this.prisma as any).notificacaoUsuario.count({
      where: { usuarioId, lidaEm: null, OR: [{ expiraEm: null }, { expiraEm: { gt: new Date() } }] },
    });
  }
  marcarComoLida(id: number, usuarioId: number) {
    return (this.prisma as any).notificacaoUsuario.updateMany({ where: { id, usuarioId }, data: { lidaEm: new Date() } });
  }
  marcarTodasComoLidas(usuarioId: number) {
    return (this.prisma as any).notificacaoUsuario.updateMany({ where: { usuarioId, lidaEm: null }, data: { lidaEm: new Date() } });
  }
}
