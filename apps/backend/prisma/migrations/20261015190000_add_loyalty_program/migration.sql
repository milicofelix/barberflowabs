CREATE TABLE `programas_fidelidade` (
 `estabelecimentoId` INTEGER NOT NULL, `ativo` BOOLEAN NOT NULL DEFAULT false,
 `centavosPorPonto` INTEGER NOT NULL DEFAULT 100, `validadeDias` INTEGER NOT NULL DEFAULT 365,
 `bonusIndicacao` INTEGER NOT NULL DEFAULT 0, `minimoIndicacaoCentavos` INTEGER NOT NULL DEFAULT 0,
 `niveis` JSON NOT NULL, `updatedAt` DATETIME(3) NOT NULL,
 PRIMARY KEY (`estabelecimentoId`),
 CONSTRAINT `programas_fidelidade_estabelecimentoId_fkey` FOREIGN KEY (`estabelecimentoId`) REFERENCES `estabelecimentos` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `carteiras_fidelidade` (
 `clienteId` INTEGER NOT NULL, `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), PRIMARY KEY (`clienteId`),
 CONSTRAINT `carteiras_fidelidade_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `clientes_estabelecimentos` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `recompensas_fidelidade` (
 `id` INTEGER NOT NULL AUTO_INCREMENT, `estabelecimentoId` INTEGER NOT NULL, `nome` VARCHAR(120) NOT NULL,
 `pontos` INTEGER NOT NULL, `descontoCentavos` INTEGER NOT NULL, `ativo` BOOLEAN NOT NULL DEFAULT true,
 PRIMARY KEY (`id`), INDEX `recompensas_fidelidade_estabelecimentoId_ativo_idx` (`estabelecimentoId`,`ativo`),
 CONSTRAINT `recompensas_fidelidade_estabelecimentoId_fkey` FOREIGN KEY (`estabelecimentoId`) REFERENCES `programas_fidelidade` (`estabelecimentoId`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `cupons_fidelidade` (
 `id` INTEGER NOT NULL AUTO_INCREMENT, `estabelecimentoId` INTEGER NOT NULL, `codigo` VARCHAR(40) NOT NULL,
 `descontoCentavos` INTEGER NOT NULL, `inicio` DATETIME(3) NOT NULL, `fim` DATETIME(3) NOT NULL,
 `limiteTotal` INTEGER NOT NULL, `limitePorCliente` INTEGER NOT NULL DEFAULT 1, `minimoCentavos` INTEGER NOT NULL DEFAULT 0,
 `elegibilidade` JSON NOT NULL, `ativo` BOOLEAN NOT NULL DEFAULT true,
 PRIMARY KEY (`id`), UNIQUE INDEX `cupons_fidelidade_estabelecimentoId_codigo_key` (`estabelecimentoId`,`codigo`),
 CONSTRAINT `cupons_fidelidade_estabelecimentoId_fkey` FOREIGN KEY (`estabelecimentoId`) REFERENCES `programas_fidelidade` (`estabelecimentoId`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `beneficios_fidelidade` (
 `id` INTEGER NOT NULL AUTO_INCREMENT, `agendamentoId` INTEGER NOT NULL, `clienteId` INTEGER NOT NULL,
 `recompensaId` INTEGER NULL, `cupomId` INTEGER NULL, `chaveAtiva` VARCHAR(191) NULL, `chave` VARCHAR(191) NOT NULL,
 `status` VARCHAR(191) NOT NULL DEFAULT 'APLICADO', `descontoCentavos` INTEGER NOT NULL, `pontos` INTEGER NOT NULL DEFAULT 0,
 `snapshot` JSON NOT NULL, `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), PRIMARY KEY (`id`),
 UNIQUE INDEX `beneficios_fidelidade_chaveAtiva_key` (`chaveAtiva`), UNIQUE INDEX `beneficios_fidelidade_chave_key` (`chave`),
 INDEX `beneficios_fidelidade_agendamentoId_status_idx` (`agendamentoId`,`status`),
 INDEX `beneficios_fidelidade_cupomId_status_clienteId_idx` (`cupomId`,`status`,`clienteId`),
 CONSTRAINT `beneficios_fidelidade_agendamentoId_fkey` FOREIGN KEY (`agendamentoId`) REFERENCES `agendamentos` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
 CONSTRAINT `beneficios_fidelidade_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `carteiras_fidelidade` (`clienteId`) ON DELETE RESTRICT ON UPDATE CASCADE,
 CONSTRAINT `beneficios_fidelidade_recompensaId_fkey` FOREIGN KEY (`recompensaId`) REFERENCES `recompensas_fidelidade` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
 CONSTRAINT `beneficios_fidelidade_cupomId_fkey` FOREIGN KEY (`cupomId`) REFERENCES `cupons_fidelidade` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `movimentos_fidelidade` (
 `id` INTEGER NOT NULL AUTO_INCREMENT, `clienteId` INTEGER NOT NULL, `chave` VARCHAR(191) NOT NULL,
 `tipo` VARCHAR(191) NOT NULL, `pontos` INTEGER NOT NULL, `creditoId` INTEGER NULL, `beneficioId` INTEGER NULL,
 `expiraEm` DATETIME(3) NULL, `detalhes` JSON NOT NULL, `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 PRIMARY KEY (`id`), UNIQUE INDEX `movimentos_fidelidade_chave_key` (`chave`),
 INDEX `movimentos_fidelidade_clienteId_creditoId_expiraEm_idx` (`clienteId`,`creditoId`,`expiraEm`),
 CONSTRAINT `movimentos_fidelidade_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `carteiras_fidelidade` (`clienteId`) ON DELETE RESTRICT ON UPDATE CASCADE,
 CONSTRAINT `movimentos_fidelidade_creditoId_fkey` FOREIGN KEY (`creditoId`) REFERENCES `movimentos_fidelidade` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
 CONSTRAINT `movimentos_fidelidade_beneficioId_fkey` FOREIGN KEY (`beneficioId`) REFERENCES `beneficios_fidelidade` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `indicacoes_fidelidade` (
 `id` INTEGER NOT NULL AUTO_INCREMENT, `indicadorId` INTEGER NOT NULL, `indicadoId` INTEGER NOT NULL,
 `status` VARCHAR(191) NOT NULL DEFAULT 'PENDENTE', `aprovadoPorId` INTEGER NULL, `bonusPontos` INTEGER NOT NULL DEFAULT 0,
 `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), PRIMARY KEY (`id`),
 UNIQUE INDEX `indicacoes_fidelidade_indicadoId_key` (`indicadoId`), INDEX `indicacoes_fidelidade_indicadorId_status_idx` (`indicadorId`,`status`),
 CONSTRAINT `indicacoes_fidelidade_indicadorId_fkey` FOREIGN KEY (`indicadorId`) REFERENCES `carteiras_fidelidade` (`clienteId`) ON DELETE RESTRICT ON UPDATE CASCADE,
 CONSTRAINT `indicacoes_fidelidade_indicadoId_fkey` FOREIGN KEY (`indicadoId`) REFERENCES `carteiras_fidelidade` (`clienteId`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `liquidacoes_fidelidade` (
 `agendamentoId` INTEGER NOT NULL, `liquidoCentavos` DECIMAL(12,0) NOT NULL, `pontos` INTEGER NOT NULL,
 `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), PRIMARY KEY (`agendamentoId`),
 CONSTRAINT `liquidacoes_fidelidade_agendamentoId_fkey` FOREIGN KEY (`agendamentoId`) REFERENCES `agendamentos` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
