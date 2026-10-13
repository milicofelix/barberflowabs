ALTER TABLE `estabelecimentos`
  ADD COLUMN `fusoHorario` VARCHAR(191) NOT NULL DEFAULT 'America/Sao_Paulo';

CREATE INDEX `agendamentos_estabelecimentoId_inicioOcupacao_fimOcupacao_idx`
  ON `agendamentos`(`estabelecimentoId`, `inicioOcupacao`, `fimOcupacao`);

CREATE INDEX `agendamentos_estabelecimentoId_status_data_idx`
  ON `agendamentos`(`estabelecimentoId`, `status`, `data`);
