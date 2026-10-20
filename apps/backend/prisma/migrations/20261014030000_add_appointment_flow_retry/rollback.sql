DROP INDEX `transicoes_agendamentos_status_proximaTentativaEm_idx`
    ON `transicoes_agendamentos`;

ALTER TABLE `transicoes_agendamentos`
    DROP COLUMN `proximaTentativaEm`;
