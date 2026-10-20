ALTER TABLE `transicoes_agendamentos`
    ADD COLUMN `proximaTentativaEm` DATETIME(3) NULL AFTER `tentativas`;

CREATE INDEX `transicoes_agendamentos_status_proximaTentativaEm_idx`
    ON `transicoes_agendamentos`(`status`, `proximaTentativaEm`);
