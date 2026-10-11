ALTER TABLE `clientes_estabelecimentos`
  ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'ATIVO',
  ADD COLUMN `tags` JSON NULL,
  ADD COLUMN `observacoes` TEXT NULL,
  ADD COLUMN `ultimaInteracaoEm` DATETIME(3) NULL;

CREATE TABLE `preferencias_comunicacao` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `estabelecimentoId` INTEGER NOT NULL,
  `usuarioId` INTEGER NOT NULL,
  `canal` VARCHAR(191) NOT NULL,
  `consentido` BOOLEAN NOT NULL DEFAULT false,
  `origem` VARCHAR(191) NOT NULL DEFAULT 'USUARIO',
  `versaoTermos` VARCHAR(191) NULL,
  `consentidoEm` DATETIME(3) NULL,
  `revogadoEm` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `preferencias_comunicacao_estabelecimentoId_usuarioId_canal_key` (`estabelecimentoId`, `usuarioId`, `canal`),
  INDEX `preferencias_comunicacao_estabelecimentoId_canal_consentido_idx` (`estabelecimentoId`, `canal`, `consentido`),
  INDEX `preferencias_comunicacao_usuarioId_idx` (`usuarioId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `templates_comunicacao` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `estabelecimentoId` INTEGER NOT NULL,
  `nome` VARCHAR(191) NOT NULL,
  `evento` VARCHAR(191) NOT NULL,
  `canal` VARCHAR(191) NOT NULL,
  `assunto` VARCHAR(191) NULL,
  `conteudo` TEXT NOT NULL,
  `ativo` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `templates_comunicacao_estabelecimentoId_nome_canal_key` (`estabelecimentoId`, `nome`, `canal`),
  INDEX `templates_comunicacao_estabelecimentoId_evento_canal_ativo_idx` (`estabelecimentoId`, `evento`, `canal`, `ativo`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `envios_comunicacao` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `estabelecimentoId` INTEGER NOT NULL,
  `usuarioId` INTEGER NULL,
  `agendamentoId` INTEGER NULL,
  `templateId` INTEGER NULL,
  `canal` VARCHAR(191) NOT NULL,
  `tipo` VARCHAR(191) NOT NULL,
  `destinatario` VARCHAR(191) NOT NULL,
  `assunto` VARCHAR(191) NULL,
  `conteudo` TEXT NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'AGENDADO',
  `agendadoPara` DATETIME(3) NOT NULL,
  `proximaTentativaEm` DATETIME(3) NULL,
  `tentativasRealizadas` INTEGER NOT NULL DEFAULT 0,
  `maximoTentativas` INTEGER NOT NULL DEFAULT 3,
  `enviadoEm` DATETIME(3) NULL,
  `erro` TEXT NULL,
  `metadados` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `envios_comunicacao_estabelecimentoId_status_agendadoPara_idx` (`estabelecimentoId`, `status`, `agendadoPara`),
  INDEX `envios_comunicacao_usuarioId_createdAt_idx` (`usuarioId`, `createdAt`),
  INDEX `envios_comunicacao_agendamentoId_idx` (`agendamentoId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `tentativas_envios_comunicacao` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `envioId` INTEGER NOT NULL,
  `numero` INTEGER NOT NULL,
  `status` VARCHAR(191) NOT NULL,
  `provedor` VARCHAR(191) NULL,
  `referenciaExterna` VARCHAR(191) NULL,
  `resposta` JSON NULL,
  `erro` TEXT NULL,
  `iniciadaEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `finalizadaEm` DATETIME(3) NULL,
  UNIQUE INDEX `tentativas_envios_comunicacao_envioId_numero_key` (`envioId`, `numero`),
  INDEX `tentativas_envios_comunicacao_status_iniciadaEm_idx` (`status`, `iniciadaEm`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `preferencias_comunicacao` ADD CONSTRAINT `preferencias_comunicacao_estabelecimentoId_fkey` FOREIGN KEY (`estabelecimentoId`) REFERENCES `estabelecimentos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `preferencias_comunicacao` ADD CONSTRAINT `preferencias_comunicacao_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `templates_comunicacao` ADD CONSTRAINT `templates_comunicacao_estabelecimentoId_fkey` FOREIGN KEY (`estabelecimentoId`) REFERENCES `estabelecimentos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `envios_comunicacao` ADD CONSTRAINT `envios_comunicacao_estabelecimentoId_fkey` FOREIGN KEY (`estabelecimentoId`) REFERENCES `estabelecimentos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `envios_comunicacao` ADD CONSTRAINT `envios_comunicacao_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `envios_comunicacao` ADD CONSTRAINT `envios_comunicacao_agendamentoId_fkey` FOREIGN KEY (`agendamentoId`) REFERENCES `agendamentos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `envios_comunicacao` ADD CONSTRAINT `envios_comunicacao_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `templates_comunicacao`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `tentativas_envios_comunicacao` ADD CONSTRAINT `tentativas_envios_comunicacao_envioId_fkey` FOREIGN KEY (`envioId`) REFERENCES `envios_comunicacao`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
