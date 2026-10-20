DROP TABLE IF EXISTS `transicoes_agendamentos`;

ALTER TABLE `agendamentos`
  DROP FOREIGN KEY `agendamentos_controleManualPorId_fkey`,
  DROP INDEX `agendamentos_controleManualPorId_idx`,
  DROP COLUMN `revisaoFluxo`,
  DROP COLUMN `finalizadoEm`,
  DROP COLUMN `iniciadoEm`,
  DROP COLUMN `controleManualPorId`,
  DROP COLUMN `controleManualEm`,
  DROP COLUMN `automacaoAtendimentoAtiva`;

ALTER TABLE `estabelecimentos`
  DROP COLUMN `avisoAtendimentoAntecedenciaMinutos`,
  DROP COLUMN `finalizacaoAtendimentoAutomaticaAtiva`,
  DROP COLUMN `inicioAtendimentoAutomaticoAtivo`,
  DROP COLUMN `fluxoAtendimentoAutomaticoAtivo`;
