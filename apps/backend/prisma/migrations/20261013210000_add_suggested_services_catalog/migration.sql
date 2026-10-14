CREATE TABLE `servicos_sugeridos` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `segmentoId` INTEGER NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `nome` VARCHAR(191) NOT NULL,
  `descricao` TEXT NOT NULL,
  `imagemURL` VARCHAR(191) NOT NULL,
  `modeloAtendimento` VARCHAR(191) NOT NULL DEFAULT 'PRESENCIAL',
  `duracaoMinutos` INTEGER NOT NULL DEFAULT 30,
  `preparoAntesMinutos` INTEGER NOT NULL DEFAULT 0,
  `preparoDepoisMinutos` INTEGER NOT NULL DEFAULT 0,
  `deslocamentoMinutos` INTEGER NOT NULL DEFAULT 0,
  `ordem` INTEGER NOT NULL DEFAULT 0,
  `ativo` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `servicos_sugeridos_segmentoId_slug_key`(`segmentoId`, `slug`),
  INDEX `servicos_sugeridos_segmentoId_ativo_ordem_idx`(`segmentoId`, `ativo`, `ordem`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `servicos_sugeridos_especialidades` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `servicoSugeridoId` INTEGER NOT NULL,
  `especialidadeId` INTEGER NOT NULL,
  UNIQUE INDEX `servico_sugerido_especialidade_uq`(`servicoSugeridoId`, `especialidadeId`),
  INDEX `servicos_sugeridos_especialidades_especialidadeId_idx`(`especialidadeId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `servicos_sugeridos`
  ADD CONSTRAINT `servicos_sugeridos_segmentoId_fkey`
  FOREIGN KEY (`segmentoId`) REFERENCES `segmentos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `servicos_sugeridos_especialidades`
  ADD CONSTRAINT `servicos_sugeridos_especialidades_servicoSugeridoId_fkey`
  FOREIGN KEY (`servicoSugeridoId`) REFERENCES `servicos_sugeridos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `servicos_sugeridos_especialidades_especialidadeId_fkey`
  FOREIGN KEY (`especialidadeId`) REFERENCES `especialidades`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
