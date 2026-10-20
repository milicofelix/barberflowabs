ALTER TABLE `estabelecimentos`
  ADD COLUMN `fluxoAtendimentoAutomaticoAtivo` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `inicioAtendimentoAutomaticoAtivo` BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN `finalizacaoAtendimentoAutomaticaAtiva` BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN `avisoAtendimentoAntecedenciaMinutos` INTEGER NOT NULL DEFAULT 10;

ALTER TABLE `agendamentos`
  ADD COLUMN `automacaoAtendimentoAtiva` BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN `controleManualEm` DATETIME(3) NULL,
  ADD COLUMN `controleManualPorId` INTEGER NULL,
  ADD COLUMN `iniciadoEm` DATETIME(3) NULL,
  ADD COLUMN `finalizadoEm` DATETIME(3) NULL,
  ADD COLUMN `revisaoFluxo` INTEGER NOT NULL DEFAULT 1,
  ADD INDEX `agendamentos_controleManualPorId_idx` (`controleManualPorId`),
  ADD CONSTRAINT `agendamentos_controleManualPorId_fkey`
    FOREIGN KEY (`controleManualPorId`) REFERENCES `usuarios` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE `transicoes_agendamentos` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `agendamentoId` INTEGER NOT NULL,
  `estabelecimentoId` INTEGER NOT NULL,
  `destinatarioUsuarioId` INTEGER NULL,
  `revisaoFluxo` INTEGER NOT NULL,
  `tipo` VARCHAR(191) NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'AGENDADA',
  `chaveIdempotencia` VARCHAR(191) NOT NULL,
  `dataPrevista` DATETIME(3) NOT NULL,
  `processadoEm` DATETIME(3) NULL,
  `tentativas` INTEGER NOT NULL DEFAULT 0,
  `bloqueadoEm` DATETIME(3) NULL,
  `bloqueadoPor` VARCHAR(191) NULL,
  `erro` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `transicoes_agendamentos_chaveIdempotencia_key` (`chaveIdempotencia`),
  INDEX `transicoes_agendamentos_status_dataPrevista_idx` (`status`, `dataPrevista`),
  INDEX `transicoes_agendamentos_estab_status_data_idx` (`estabelecimentoId`, `status`, `dataPrevista`),
  INDEX `transicoes_agendamentos_agendamento_revisao_idx` (`agendamentoId`, `revisaoFluxo`),
  INDEX `transicoes_agendamentos_destinatario_idx` (`destinatarioUsuarioId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `transicoes_agendamentos`
  ADD CONSTRAINT `transicoes_agendamentos_agendamento_fkey`
    FOREIGN KEY (`agendamentoId`) REFERENCES `agendamentos` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `transicoes_agendamentos_estabelecimento_fkey`
    FOREIGN KEY (`estabelecimentoId`) REFERENCES `estabelecimentos` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `transicoes_agendamentos_destinatario_fkey`
    FOREIGN KEY (`destinatarioUsuarioId`) REFERENCES `usuarios` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;
