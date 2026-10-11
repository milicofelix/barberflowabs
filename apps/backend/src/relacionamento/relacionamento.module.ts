import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AuthMiddleware } from 'src/auth/auth.middleware';
import { AuthModule } from 'src/auth/auth.module';
import { DbModule } from 'src/db/db.module';
import { EquipeModule } from 'src/equipe/equipe.module';
import { RelacionamentoController } from './relacionamento.controller';
import { RelacionamentoRepository } from './relacionamento.repository';
import { RelacionamentoService } from './relacionamento.service';

@Module({
  imports: [AuthModule, DbModule, EquipeModule],
  controllers: [RelacionamentoController],
  providers: [RelacionamentoRepository, RelacionamentoService],
  exports: [RelacionamentoService],
})
export class RelacionamentoModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes(RelacionamentoController);
  }
}
