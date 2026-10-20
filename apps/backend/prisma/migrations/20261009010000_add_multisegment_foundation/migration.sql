ALTER TABLE `barbearias`
  ADD COLUMN `tipoEstabelecimento` VARCHAR(191) NOT NULL DEFAULT 'BARBEARIA',
  ADD COLUMN `modeloAtendimento` VARCHAR(191) NOT NULL DEFAULT 'PRESENCIAL';

CREATE TABLE `segmentos` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `slug` VARCHAR(191) NOT NULL,
  `nome` VARCHAR(191) NOT NULL,
  `descricao` TEXT NULL,
  `ativo` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `segmentos_slug_key` (`slug`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `especialidades` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `segmentoId` INTEGER NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `nome` VARCHAR(191) NOT NULL,
  `descricao` TEXT NULL,
  `ativo` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `especialidades_segmentoId_ativo_idx` (`segmentoId`, `ativo`),
  UNIQUE INDEX `especialidades_segmentoId_slug_key` (`segmentoId`, `slug`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `estabelecimentos_segmentos` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `barbeariaId` INTEGER NOT NULL,
  `segmentoId` INTEGER NOT NULL,
  `principal` BOOLEAN NOT NULL DEFAULT false,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `estabelecimentos_segmentos_segmentoId_idx` (`segmentoId`),
  UNIQUE INDEX `estabelecimentos_segmentos_b_id_s_id_key` (`barbeariaId`, `segmentoId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `estabelecimentos_especialidades` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `barbeariaId` INTEGER NOT NULL,
  `especialidadeId` INTEGER NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `estabelecimentos_especialidades_e_id_idx` (`especialidadeId`),
  UNIQUE INDEX `estabelecimentos_especialidades_b_id_e_id_key` (`barbeariaId`, `especialidadeId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `requisitos` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `slug` VARCHAR(191) NOT NULL,
  `nome` VARCHAR(191) NOT NULL,
  `descricao` TEXT NULL,
  `tipo` VARCHAR(191) NOT NULL DEFAULT 'INFORMATIVO',
  `ativo` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `requisitos_slug_key` (`slug`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `servicos_requisitos` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `servicoId` INTEGER NOT NULL,
  `requisitoId` INTEGER NOT NULL,
  `obrigatorio` BOOLEAN NOT NULL DEFAULT true,
  `observacao` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `servicos_requisitos_requisitoId_idx` (`requisitoId`),
  UNIQUE INDEX `servicos_requisitos_servicoId_requisitoId_key` (`servicoId`, `requisitoId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `especialidades`
  ADD CONSTRAINT `especialidades_segmentoId_fkey`
  FOREIGN KEY (`segmentoId`) REFERENCES `segmentos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `estabelecimentos_segmentos`
  ADD CONSTRAINT `estabelecimentos_segmentos_b_id_fkey`
  FOREIGN KEY (`barbeariaId`) REFERENCES `barbearias`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `estabelecimentos_segmentos_s_id_fkey`
  FOREIGN KEY (`segmentoId`) REFERENCES `segmentos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `estabelecimentos_especialidades`
  ADD CONSTRAINT `estabelecimentos_especialidades_b_id_fkey`
  FOREIGN KEY (`barbeariaId`) REFERENCES `barbearias`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `estabelecimentos_especialidades_e_id_fkey`
  FOREIGN KEY (`especialidadeId`) REFERENCES `especialidades`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `servicos_requisitos`
  ADD CONSTRAINT `servicos_requisitos_servicoId_fkey`
  FOREIGN KEY (`servicoId`) REFERENCES `servicos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `servicos_requisitos_requisitoId_fkey`
  FOREIGN KEY (`requisitoId`) REFERENCES `requisitos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO `segmentos` (`slug`, `nome`, `descricao`, `ativo`, `updatedAt`)
VALUES ('barbearia', 'Barbearia', 'Segmento legado preservado durante a transicao multissegmento.', true, CURRENT_TIMESTAMP(3));

INSERT INTO `estabelecimentos_segmentos` (`barbeariaId`, `segmentoId`, `principal`, `updatedAt`)
SELECT `barbearias`.`id`, `segmentos`.`id`, true, CURRENT_TIMESTAMP(3)
FROM `barbearias`
JOIN `segmentos` ON `segmentos`.`slug` = 'barbearia';
