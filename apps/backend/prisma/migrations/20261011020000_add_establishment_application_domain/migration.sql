CREATE TABLE `solicitacoes_estabelecimentos` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `usuarioId` INTEGER NOT NULL,
  `revisorId` INTEGER NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'RASCUNHO',
  `nomePublico` VARCHAR(191) NULL,
  `emailComercial` VARCHAR(191) NULL,
  `telefoneComercial` VARCHAR(191) NULL,
  `tipoEstabelecimento` VARCHAR(191) NULL,
  `modeloAtendimento` VARCHAR(191) NULL,
  `planoSlug` VARCHAR(191) NULL,
  `cep` VARCHAR(8) NULL,
  `logradouro` VARCHAR(191) NULL,
  `numero` VARCHAR(191) NULL,
  `complemento` VARCHAR(191) NULL,
  `pontoReferencia` VARCHAR(191) NULL,
  `bairro` VARCHAR(191) NULL,
  `cidade` VARCHAR(191) NULL,
  `estado` VARCHAR(2) NULL,
  `termosVersao` VARCHAR(191) NULL,
  `termosAceitosEm` DATETIME(3) NULL,
  `enviadoEm` DATETIME(3) NULL,
  `revisadoEm` DATETIME(3) NULL,
  `motivoRevisao` TEXT NULL,
  `versao` INTEGER NOT NULL DEFAULT 1,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `solicitacoes_estabelecimentos_usuarioId_status_updatedAt_idx` (`usuarioId`, `status`, `updatedAt`),
  INDEX `solicitacoes_estabelecimentos_status_enviadoEm_idx` (`status`, `enviadoEm`),
  INDEX `solicitacoes_estabelecimentos_revisorId_idx` (`revisorId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `solicitacoes_estabelecimentos_segmentos` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `solicitacaoId` INTEGER NOT NULL,
  `segmentoId` INTEGER NOT NULL,
  `principal` BOOLEAN NOT NULL DEFAULT false,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `solicitacao_segmento_unica` (`solicitacaoId`, `segmentoId`),
  INDEX `solicitacao_segmento_segmento_idx` (`segmentoId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `solicitacoes_estabelecimentos_especialidades` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `solicitacaoId` INTEGER NOT NULL,
  `especialidadeId` INTEGER NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `solicitacao_especialidade_unica` (`solicitacaoId`, `especialidadeId`),
  INDEX `solicitacao_especialidade_idx` (`especialidadeId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `notificacoes_usuarios` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `usuarioId` INTEGER NOT NULL,
  `estabelecimentoId` INTEGER NULL,
  `solicitacaoId` INTEGER NULL,
  `tipo` VARCHAR(191) NOT NULL,
  `titulo` VARCHAR(191) NOT NULL,
  `mensagem` TEXT NOT NULL,
  `prioridade` VARCHAR(191) NOT NULL DEFAULT 'NORMAL',
  `acaoUrl` VARCHAR(191) NULL,
  `metadados` JSON NULL,
  `lidaEm` DATETIME(3) NULL,
  `expiraEm` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `notificacoes_usuarios_usuarioId_lidaEm_createdAt_idx` (`usuarioId`, `lidaEm`, `createdAt`),
  INDEX `notificacoes_usuarios_estabelecimentoId_createdAt_idx` (`estabelecimentoId`, `createdAt`),
  INDEX `notificacoes_usuarios_solicitacaoId_idx` (`solicitacaoId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `solicitacoes_estabelecimentos` ADD CONSTRAINT `solicitacoes_estabelecimentos_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `solicitacoes_estabelecimentos` ADD CONSTRAINT `solicitacoes_estabelecimentos_revisorId_fkey` FOREIGN KEY (`revisorId`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `solicitacoes_estabelecimentos_segmentos` ADD CONSTRAINT `solicitacao_segmento_solicitacao_fkey` FOREIGN KEY (`solicitacaoId`) REFERENCES `solicitacoes_estabelecimentos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `solicitacoes_estabelecimentos_segmentos` ADD CONSTRAINT `solicitacao_segmento_segmento_fkey` FOREIGN KEY (`segmentoId`) REFERENCES `segmentos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `solicitacoes_estabelecimentos_especialidades` ADD CONSTRAINT `solicitacao_especialidade_solicitacao_fkey` FOREIGN KEY (`solicitacaoId`) REFERENCES `solicitacoes_estabelecimentos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `solicitacoes_estabelecimentos_especialidades` ADD CONSTRAINT `solicitacao_especialidade_especialidade_fkey` FOREIGN KEY (`especialidadeId`) REFERENCES `especialidades`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `notificacoes_usuarios` ADD CONSTRAINT `notificacoes_usuarios_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `notificacoes_usuarios` ADD CONSTRAINT `notificacoes_usuarios_estabelecimentoId_fkey` FOREIGN KEY (`estabelecimentoId`) REFERENCES `estabelecimentos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `notificacoes_usuarios` ADD CONSTRAINT `notificacoes_usuarios_solicitacaoId_fkey` FOREIGN KEY (`solicitacaoId`) REFERENCES `solicitacoes_estabelecimentos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
