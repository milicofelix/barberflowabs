import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AuthMiddleware } from 'src/auth/auth.middleware';
import { AuthModule } from 'src/auth/auth.module';
import { DbModule } from 'src/db/db.module';
import { EquipeModule } from 'src/equipe/equipe.module';
import { RelacionamentoController } from './relacionamento.controller';
import { RelacionamentoRepository } from './relacionamento.repository';
import { RelacionamentoService } from './relacionamento.service';
import { ComunicacaoCallbackController } from './comunicacao-callback.controller';
import { ComunicacaoWorker } from './comunicacao.worker';
import { ComunicacaoProviderRegistry, EmailSimuladoProvider, PushSimuladoProvider, WhatsappSimuladoProvider } from './comunicacao.provider';
import { JornadaAgendamentoService } from './jornada-agendamento.service';
import { AtendimentoModule } from 'src/atendimento/atendimento.module';
import { CampanhaController } from './campanhas/campanha.controller';
import { CampanhaRepository } from './campanhas/campanha.repository';
import { AudienciaCampanhaRepository } from './campanhas/audiencia-campanha.repository';
import { CampanhaExecucaoRepository } from './campanhas/campanha-execucao.repository';
import { CampanhaWorker } from './campanhas/campanha.worker';
import { DescadastroCampanhaController } from './campanhas/descadastro-campanha.controller';
import { DescadastroCampanhaService } from './campanhas/descadastro-campanha.service';
import { SupressaoCampanhaRepository } from './campanhas/supressao-campanha.repository';
import { GovernancaController } from './governanca/governanca.controller';
import { MetricasRelacionamentoRepository } from './governanca/metricas-relacionamento.repository';
import { RetencaoRelacionamentoRepository } from './governanca/retencao-relacionamento.repository';
import { PrivacidadeSolicitacaoRepository } from './governanca/privacidade-solicitacao.repository';
import { PrivacidadeExclusaoRepository } from './governanca/privacidade-exclusao.repository';
import { PrivacidadeExportacaoRepository } from './governanca/privacidade-exportacao.repository';
import { AuditoriaRelacionamentoRepository } from './governanca/auditoria-relacionamento.repository';

@Module({
  imports: [AuthModule, DbModule, EquipeModule, AtendimentoModule],
  controllers: [RelacionamentoController, ComunicacaoCallbackController, CampanhaController, DescadastroCampanhaController, GovernancaController],
  providers: [
    RelacionamentoRepository, RelacionamentoService, ComunicacaoWorker,
    ComunicacaoProviderRegistry, PushSimuladoProvider, EmailSimuladoProvider, WhatsappSimuladoProvider,
    JornadaAgendamentoService,
    CampanhaRepository, AudienciaCampanhaRepository, CampanhaExecucaoRepository, CampanhaWorker, DescadastroCampanhaService, SupressaoCampanhaRepository,
    MetricasRelacionamentoRepository, RetencaoRelacionamentoRepository, PrivacidadeSolicitacaoRepository,
    PrivacidadeExclusaoRepository, PrivacidadeExportacaoRepository, AuditoriaRelacionamentoRepository,
  ],
  exports: [RelacionamentoService, JornadaAgendamentoService],
})
export class RelacionamentoModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes(RelacionamentoController, CampanhaController, GovernancaController);
  }
}
