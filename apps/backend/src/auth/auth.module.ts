import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { DbModule } from 'src/db/db.module';
import { UsuarioPrisma } from './usuario.prisma';
import { BcryptProvider } from './bcrypt.provider';
import { AuthMiddleware } from './auth.middleware';
import { RateLimitMiddleware } from './rate-limit.middleware';

@Module({
  imports: [DbModule],
  controllers: [AuthController],
  providers: [
    UsuarioPrisma,
    BcryptProvider,
    AuthMiddleware,
    RateLimitMiddleware,
  ],
  exports: [AuthMiddleware, UsuarioPrisma, BcryptProvider],
})
export class AuthModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RateLimitMiddleware).forRoutes('auth/login', 'auth/registrar', 'auth/refresh');
  }
}
