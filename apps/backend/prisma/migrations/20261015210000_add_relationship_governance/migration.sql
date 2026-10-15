ALTER TABLE `clientes_estabelecimentos` ADD COLUMN `privacidadeRestritaEm` DATETIME(3) NULL;
ALTER TABLE `envios_comunicacao` ADD COLUMN `dadosExpurgadosEm` DATETIME(3) NULL;
CREATE INDEX `envios_retencao_idx` ON `envios_comunicacao` (`estabelecimentoId`, `dadosExpurgadosEm`, `createdAt`);
CREATE INDEX `callbacks_metricas_idx` ON `callbacks_envios_comunicacao` (`envioId`, `tipo`, `recebidoEm`);
CREATE TABLE `politicas_retencao_relacionamento` (
 `estabelecimentoId` INTEGER NOT NULL, `ativa` BOOLEAN NOT NULL DEFAULT false, `conteudoDias` INTEGER NOT NULL DEFAULT 90,
 `fundamento` VARCHAR(500) NOT NULL, `aprovadaPorId` INTEGER NOT NULL, `updatedAt` DATETIME(3) NOT NULL,
 PRIMARY KEY (`estabelecimentoId`),
 CONSTRAINT `politicas_retencao_estabelecimento_fkey` FOREIGN KEY (`estabelecimentoId`) REFERENCES `estabelecimentos` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `solicitacoes_privacidade` (
 `id` INTEGER NOT NULL AUTO_INCREMENT, `estabelecimentoId` INTEGER NOT NULL, `clienteId` INTEGER NOT NULL,
 `tipo` VARCHAR(191) NOT NULL, `status` VARCHAR(191) NOT NULL DEFAULT 'ABERTA', `chave` VARCHAR(100) NOT NULL,
 `solicitadoPorId` INTEGER NOT NULL, `validadoPorId` INTEGER NULL, `identidadeValidadaEm` DATETIME(3) NULL,
 `referenciaVerificacao` VARCHAR(150) NULL, `motivoConservacao` VARCHAR(500) NULL, `resultado` JSON NULL,
 `concluidaEm` DATETIME(3) NULL, `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 PRIMARY KEY (`id`), UNIQUE INDEX `solicitacoes_privacidade_estabelecimentoId_chave_key` (`estabelecimentoId`,`chave`),
 INDEX `solicitacoes_privacidade_estabelecimentoId_status_id_idx` (`estabelecimentoId`,`status`,`id`),
 CONSTRAINT `solicitacoes_privacidade_estabelecimentoId_fkey` FOREIGN KEY (`estabelecimentoId`) REFERENCES `estabelecimentos` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
 CONSTRAINT `solicitacoes_privacidade_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `clientes_estabelecimentos` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
