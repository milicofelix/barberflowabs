import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { AuthMiddleware } from 'src/auth/auth.middleware';
import { DbModule } from 'src/db/db.module';
import { EquipeModule } from 'src/equipe/equipe.module';
import { FidelidadeController } from './fidelidade.controller';
import { ProgramaFidelidadeRepository } from './programa-fidelidade.repository';
import { CarteiraFidelidadeRepository } from './carteira-fidelidade.repository';
import { BeneficioFidelidadeRepository } from './beneficio-fidelidade.repository';
import { IndicacaoFidelidadeRepository } from './indicacao-fidelidade.repository';
import { LiquidacaoFidelidadeService } from './liquidacao-fidelidade.service';

@Module({
  imports: [DbModule, AuthModule, EquipeModule], controllers: [FidelidadeController],
  providers: [ProgramaFidelidadeRepository, CarteiraFidelidadeRepository, BeneficioFidelidadeRepository, IndicacaoFidelidadeRepository, LiquidacaoFidelidadeService],
  exports: [LiquidacaoFidelidadeService],
})
export class FidelidadeModule {
  configure(consumer: MiddlewareConsumer) { consumer.apply(AuthMiddleware).forRoutes(FidelidadeController); }
}
