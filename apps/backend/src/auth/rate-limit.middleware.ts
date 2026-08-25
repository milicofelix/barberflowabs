import { HttpException, Injectable, NestMiddleware } from '@nestjs/common';

type Acesso = {
  total: number;
  resetEm: number;
};

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly janelaMs = 60 * 1000;
  private readonly limite = 20;
  private readonly acessos = new Map<string, Acesso>();

  use(req: any, res: any, next: () => void) {
    const agora = Date.now();
    const chave = `${req.ip ?? req.socket?.remoteAddress ?? 'unknown'}:${req.path}`;
    const acesso = this.acessos.get(chave);

    if (!acesso || acesso.resetEm <= agora) {
      this.acessos.set(chave, { total: 1, resetEm: agora + this.janelaMs });
      next();
      return;
    }

    if (acesso.total >= this.limite) {
      throw new HttpException('Muitas tentativas. Aguarde alguns instantes.', 429);
    }

    acesso.total += 1;
    next();
  }
}
