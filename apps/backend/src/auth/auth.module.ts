import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { DbModule } from 'src/db/db.module';
import { UsuarioPrisma } from './usuario.prisma';
import { BcryptProvider } from './bcrypt.provider';
import { AuthMiddleware } from './auth.middleware';
import { TenantService } from 'src/shared/tenant.service';

@Module({
  imports: [DbModule],
  controllers: [AuthController],
  providers: [UsuarioPrisma, BcryptProvider, AuthMiddleware, TenantService],
  exports: [AuthMiddleware, UsuarioPrisma],
})
export class AuthModule {}
