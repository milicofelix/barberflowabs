import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuthMiddleware } from 'src/auth/auth.middleware';
import { AuthModule } from 'src/auth/auth.module';
import { DbModule } from 'src/db/db.module';
import { EquipeController } from './equipe.controller';
import { EquipePolicy } from './equipe.policy';
import { EquipePrisma } from './equipe.prisma';
import { CriarContaMembroService } from './criar-conta-membro.service';

@Module({
  imports: [AuthModule, DbModule],
  controllers: [EquipeController],
  providers: [EquipePrisma, EquipePolicy, CriarContaMembroService],
  exports: [EquipePolicy],
})
export class EquipeModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes(EquipeController);
  }
}

