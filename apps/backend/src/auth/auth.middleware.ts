import { HttpException, Injectable, NestMiddleware } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { UsuarioPrisma } from './usuario.prisma';
import { AuthTokenPayload } from './auth.dto';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly repo: UsuarioPrisma) {}

  async use(req: any, res: any, next: () => void) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        throw new HttpException('Token não informado', 401);
      }

      const payload = jwt.verify(
        token,
        process.env.JWT_SECRET!,
      ) as unknown as AuthTokenPayload;

      if (!payload?.email) {
        throw new HttpException('Token inválido', 401);
      }

      const usuario = await this.repo.buscarPorEmail(payload.email);

      if (!usuario) {
        throw new HttpException('Usuário não encontrado', 401);
      }

      delete usuario.senha;
      req.usuario = usuario;
      next();
    } catch (error) {
      throw new HttpException('Token inválido', 401);
    }
  }
}
