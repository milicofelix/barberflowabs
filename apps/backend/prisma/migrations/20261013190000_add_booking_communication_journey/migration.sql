ALTER TABLE `estabelecimentos`
  ADD COLUMN `lembreteAgendamentoAtivo` BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN `lembreteAntecedenciaMinutos` INTEGER NOT NULL DEFAULT 1440,
  ADD COLUMN `janelaSilenciosaInicio` VARCHAR(5) NOT NULL DEFAULT '22:00',
  ADD COLUMN `janelaSilenciosaFim` VARCHAR(5) NOT NULL DEFAULT '08:00';
