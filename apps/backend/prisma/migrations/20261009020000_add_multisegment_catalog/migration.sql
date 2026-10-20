ALTER TABLE `servicos`
  ADD COLUMN `observacoes` TEXT NULL,
  ADD COLUMN `modeloAtendimento` VARCHAR(191) NOT NULL DEFAULT 'PRESENCIAL';

CREATE TABLE `profissionais_especialidades` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `barbeariaId` INTEGER NOT NULL,
  `profissionalId` INTEGER NOT NULL,
  `especialidadeId` INTEGER NOT NULL,
  `principal` BOOLEAN NOT NULL DEFAULT false,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `profissionais_especialidades_b_id_p_id_idx` (`barbeariaId`, `profissionalId`),
  INDEX `profissionais_especialidades_e_id_idx` (`especialidadeId`),
  UNIQUE INDEX `profissionais_especialidades_p_id_e_id_key` (`profissionalId`, `especialidadeId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `servicos_especialidades` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `barbeariaId` INTEGER NOT NULL,
  `servicoId` INTEGER NOT NULL,
  `especialidadeId` INTEGER NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `servicos_especialidades_b_id_s_id_idx` (`barbeariaId`, `servicoId`),
  INDEX `servicos_especialidades_e_id_idx` (`especialidadeId`),
  UNIQUE INDEX `servicos_especialidades_s_id_e_id_key` (`servicoId`, `especialidadeId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `profissionais_especialidades`
  ADD CONSTRAINT `profissionais_especialidades_b_id_fkey`
  FOREIGN KEY (`barbeariaId`) REFERENCES `barbearias`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `profissionais_especialidades_p_id_fkey`
  FOREIGN KEY (`profissionalId`) REFERENCES `profissionais`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `profissionais_especialidades_e_id_fkey`
  FOREIGN KEY (`especialidadeId`) REFERENCES `especialidades`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `servicos_especialidades`
  ADD CONSTRAINT `servicos_especialidades_b_id_fkey`
  FOREIGN KEY (`barbeariaId`) REFERENCES `barbearias`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `servicos_especialidades_s_id_fkey`
  FOREIGN KEY (`servicoId`) REFERENCES `servicos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `servicos_especialidades_e_id_fkey`
  FOREIGN KEY (`especialidadeId`) REFERENCES `especialidades`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO `especialidades` (`segmentoId`, `slug`, `nome`, `descricao`, `ativo`, `updatedAt`)
SELECT `id`, 'cabelo', 'Cabelo', 'Cortes, tratamentos e cuidados com o cabelo.', true, CURRENT_TIMESTAMP(3)
FROM `segmentos` WHERE `slug` = 'barbearia';

INSERT INTO `especialidades` (`segmentoId`, `slug`, `nome`, `descricao`, `ativo`, `updatedAt`)
SELECT `id`, 'barba', 'Barba', 'Modelagem, corte e cuidados com a barba.', true, CURRENT_TIMESTAMP(3)
FROM `segmentos` WHERE `slug` = 'barbearia';

INSERT INTO `requisitos` (`slug`, `nome`, `descricao`, `tipo`, `ativo`, `updatedAt`) VALUES
  ('informar-alergias', 'Informar alergias', 'O cliente deve informar alergias antes do atendimento.', 'SAUDE', true, CURRENT_TIMESTAMP(3)),
  ('teste-de-sensibilidade', 'Teste de sensibilidade', 'Pode ser necessario realizar teste antes do procedimento.', 'PREPARO', true, CURRENT_TIMESTAMP(3)),
  ('preparo-previo', 'Preparo previo', 'Consulte as orientacoes de preparo antes do atendimento.', 'PREPARO', true, CURRENT_TIMESTAMP(3));

INSERT INTO `estabelecimentos_especialidades` (`barbeariaId`, `especialidadeId`, `updatedAt`)
SELECT `barbearias`.`id`, `especialidades`.`id`, CURRENT_TIMESTAMP(3)
FROM `barbearias`
JOIN `especialidades` ON `especialidades`.`slug` IN ('cabelo', 'barba');
