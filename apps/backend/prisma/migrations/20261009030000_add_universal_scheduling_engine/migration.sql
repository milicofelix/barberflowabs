ALTER TABLE `servicos`
  ADD COLUMN `duracaoMinutos` INTEGER NOT NULL DEFAULT 15,
  ADD COLUMN `preparoAntesMinutos` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `preparoDepoisMinutos` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `deslocamentoMinutos` INTEGER NOT NULL DEFAULT 0;

UPDATE `servicos`
SET `duracaoMinutos` = GREATEST(15, `qtdeSlots` * 15);

ALTER TABLE `agendamentos`
  ADD COLUMN `dataFim` DATETIME(3) NULL,
  ADD COLUMN `inicioOcupacao` DATETIME(3) NULL,
  ADD COLUMN `fimOcupacao` DATETIME(3) NULL,
  ADD COLUMN `unidadeId` INTEGER NULL,
  ADD COLUMN `modeloAtendimento` VARCHAR(191) NOT NULL DEFAULT 'PRESENCIAL',
  ADD COLUMN `enderecoAtendimento` TEXT NULL,
  ADD COLUMN `deslocamentoMinutos` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `reagendadoEm` DATETIME(3) NULL;

CREATE INDEX `agendamentos_profissionalId_ocupacao_idx`
  ON `agendamentos`(`profissionalId`, `inicioOcupacao`, `fimOcupacao`);
CREATE INDEX `agendamentos_unidadeId_ocupacao_idx`
  ON `agendamentos`(`unidadeId`, `inicioOcupacao`, `fimOcupacao`);

ALTER TABLE `agendamentos`
  ADD CONSTRAINT `agendamentos_unidadeId_fkey`
  FOREIGN KEY (`unidadeId`) REFERENCES `unidades`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE `profissionais_servicos` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `barbeariaId` INTEGER NOT NULL,
  `profissionalId` INTEGER NOT NULL,
  `servicoId` INTEGER NOT NULL,
  `ativo` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `profissionais_servicos_profissionalId_servicoId_key` (`profissionalId`, `servicoId`),
  INDEX `profissionais_servicos_barbeariaId_ativo_idx` (`barbeariaId`, `ativo`),
  INDEX `profissionais_servicos_servicoId_idx` (`servicoId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `recursos` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `barbeariaId` INTEGER NOT NULL,
  `unidadeId` INTEGER NULL,
  `nome` VARCHAR(191) NOT NULL,
  `tipo` VARCHAR(191) NOT NULL,
  `capacidade` INTEGER NOT NULL DEFAULT 1,
  `ativo` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `recursos_barbeariaId_nome_key` (`barbeariaId`, `nome`),
  INDEX `recursos_barbeariaId_tipo_ativo_idx` (`barbeariaId`, `tipo`, `ativo`),
  INDEX `recursos_unidadeId_tipo_ativo_idx` (`unidadeId`, `tipo`, `ativo`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `servicos_recursos` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `servicoId` INTEGER NOT NULL,
  `tipoRecurso` VARCHAR(191) NOT NULL,
  `quantidade` INTEGER NOT NULL DEFAULT 1,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `servicos_recursos_servicoId_tipoRecurso_key` (`servicoId`, `tipoRecurso`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `agendamentos_servicos` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `agendamentoId` INTEGER NOT NULL,
  `servicoId` INTEGER NOT NULL,
  `ordem` INTEGER NOT NULL,
  `duracaoMinutos` INTEGER NOT NULL,
  `preparoAntesMinutos` INTEGER NOT NULL DEFAULT 0,
  `preparoDepoisMinutos` INTEGER NOT NULL DEFAULT 0,
  `preco` DECIMAL(10, 2) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `agendamentos_servicos_agendamentoId_ordem_key` (`agendamentoId`, `ordem`),
  INDEX `agendamentos_servicos_servicoId_idx` (`servicoId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `agendamentos_recursos` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `agendamentoId` INTEGER NOT NULL,
  `recursoId` INTEGER NOT NULL,
  `inicio` DATETIME(3) NOT NULL,
  `fim` DATETIME(3) NOT NULL,
  `quantidade` INTEGER NOT NULL DEFAULT 1,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `agendamentos_recursos_agendamentoId_recursoId_key` (`agendamentoId`, `recursoId`),
  INDEX `agendamentos_recursos_recursoId_inicio_fim_idx` (`recursoId`, `inicio`, `fim`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `historico_reagendamentos` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `agendamentoId` INTEGER NOT NULL,
  `alteradoPorId` INTEGER NOT NULL,
  `dataAnterior` DATETIME(3) NOT NULL,
  `dataFimAnterior` DATETIME(3) NULL,
  `unidadeIdAnterior` INTEGER NULL,
  `dataNova` DATETIME(3) NOT NULL,
  `dataFimNova` DATETIME(3) NOT NULL,
  `unidadeIdNova` INTEGER NULL,
  `motivo` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `historico_reagendamentos_agendamentoId_createdAt_idx` (`agendamentoId`, `createdAt`),
  INDEX `historico_reagendamentos_alteradoPorId_idx` (`alteradoPorId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `profissionais_servicos`
  ADD CONSTRAINT `profissionais_servicos_barbeariaId_fkey`
  FOREIGN KEY (`barbeariaId`) REFERENCES `barbearias`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `profissionais_servicos_profissionalId_fkey`
  FOREIGN KEY (`profissionalId`) REFERENCES `profissionais`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `profissionais_servicos_servicoId_fkey`
  FOREIGN KEY (`servicoId`) REFERENCES `servicos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `recursos`
  ADD CONSTRAINT `recursos_barbeariaId_fkey`
  FOREIGN KEY (`barbeariaId`) REFERENCES `barbearias`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `recursos_unidadeId_fkey`
  FOREIGN KEY (`unidadeId`) REFERENCES `unidades`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `servicos_recursos`
  ADD CONSTRAINT `servicos_recursos_servicoId_fkey`
  FOREIGN KEY (`servicoId`) REFERENCES `servicos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `agendamentos_servicos`
  ADD CONSTRAINT `agendamentos_servicos_agendamentoId_fkey`
  FOREIGN KEY (`agendamentoId`) REFERENCES `agendamentos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `agendamentos_servicos_servicoId_fkey`
  FOREIGN KEY (`servicoId`) REFERENCES `servicos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `agendamentos_recursos`
  ADD CONSTRAINT `agendamentos_recursos_agendamentoId_fkey`
  FOREIGN KEY (`agendamentoId`) REFERENCES `agendamentos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `agendamentos_recursos_recursoId_fkey`
  FOREIGN KEY (`recursoId`) REFERENCES `recursos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `historico_reagendamentos`
  ADD CONSTRAINT `historico_reagendamentos_agendamentoId_fkey`
  FOREIGN KEY (`agendamentoId`) REFERENCES `agendamentos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `historico_reagendamentos_alteradoPorId_fkey`
  FOREIGN KEY (`alteradoPorId`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO `profissionais_servicos`
  (`barbeariaId`, `profissionalId`, `servicoId`, `ativo`, `updatedAt`)
SELECT `profissionais`.`barbeariaId`, `profissionais`.`id`, `servicos`.`id`, true, CURRENT_TIMESTAMP(3)
FROM `profissionais`
JOIN `servicos` ON `servicos`.`barbeariaId` = `profissionais`.`barbeariaId`;

INSERT INTO `agendamentos_servicos`
  (`agendamentoId`, `servicoId`, `ordem`, `duracaoMinutos`, `preparoAntesMinutos`, `preparoDepoisMinutos`, `preco`)
SELECT
  `relacao`.`A`,
  `servicos`.`id`,
  ROW_NUMBER() OVER (PARTITION BY `relacao`.`A` ORDER BY `servicos`.`id`),
  `servicos`.`duracaoMinutos`,
  `servicos`.`preparoAntesMinutos`,
  `servicos`.`preparoDepoisMinutos`,
  `servicos`.`preco`
FROM `_AgendamentoToServico` AS `relacao`
JOIN `servicos` ON `servicos`.`id` = `relacao`.`B`;

UPDATE `agendamentos` AS `agendamento`
LEFT JOIN (
  SELECT
    `item`.`agendamentoId`,
    SUM(`item`.`duracaoMinutos`) AS `duracao`,
    MAX(`item`.`preparoAntesMinutos`) AS `preparoAntes`,
    MAX(`item`.`preparoDepoisMinutos`) AS `preparoDepois`
  FROM `agendamentos_servicos` AS `item`
  GROUP BY `item`.`agendamentoId`
) AS `resumo` ON `resumo`.`agendamentoId` = `agendamento`.`id`
SET
  `agendamento`.`dataFim` = DATE_ADD(`agendamento`.`data`, INTERVAL COALESCE(`resumo`.`duracao`, 15) MINUTE),
  `agendamento`.`inicioOcupacao` = DATE_SUB(`agendamento`.`data`, INTERVAL COALESCE(`resumo`.`preparoAntes`, 0) MINUTE),
  `agendamento`.`fimOcupacao` = DATE_ADD(
    `agendamento`.`data`,
    INTERVAL (COALESCE(`resumo`.`duracao`, 15) + COALESCE(`resumo`.`preparoDepois`, 0)) MINUTE
  );
