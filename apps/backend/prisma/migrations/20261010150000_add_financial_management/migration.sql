CREATE TABLE `configuracoes_comissao` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `estabelecimentoId` INTEGER NOT NULL,
  `profissionalId` INTEGER NULL,
  `servicoId` INTEGER NULL,
  `chave` VARCHAR(191) NOT NULL,
  `percentual` DECIMAL(5, 2) NOT NULL,
  `ativo` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `config_comissao_estabelecimento_chave_key`(`estabelecimentoId`, `chave`),
  INDEX `config_comissao_estabelecimento_ativo_idx`(`estabelecimentoId`, `ativo`),
  INDEX `config_comissao_profissional_idx`(`profissionalId`),
  INDEX `config_comissao_servico_idx`(`servicoId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `formas_pagamento` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `estabelecimentoId` INTEGER NOT NULL,
  `nome` VARCHAR(191) NOT NULL,
  `tipo` VARCHAR(191) NOT NULL,
  `taxaPercentual` DECIMAL(5, 2) NOT NULL DEFAULT 0,
  `taxaFixa` DECIMAL(10, 2) NOT NULL DEFAULT 0,
  `prazoRecebimento` INTEGER NOT NULL DEFAULT 0,
  `ativa` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `formas_pagamento_estabelecimento_nome_key`(`estabelecimentoId`, `nome`),
  INDEX `formas_pagamento_estabelecimento_ativa_idx`(`estabelecimentoId`, `ativa`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `configuracoes_comissao` (`estabelecimentoId`, `chave`, `percentual`, `ativo`, `createdAt`, `updatedAt`)
SELECT `id`, 'PADRAO', 40.00, true, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
FROM `estabelecimentos`;

INSERT INTO `formas_pagamento` (`estabelecimentoId`, `nome`, `tipo`, `taxaPercentual`, `taxaFixa`, `prazoRecebimento`, `ativa`, `createdAt`, `updatedAt`)
SELECT `id`, 'Dinheiro', 'DINHEIRO', 0, 0, 0, true, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3) FROM `estabelecimentos`
UNION ALL SELECT `id`, 'PIX', 'PIX', 0, 0, 0, true, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3) FROM `estabelecimentos`
UNION ALL SELECT `id`, 'Cartão de crédito', 'CREDITO', 0, 0, 30, true, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3) FROM `estabelecimentos`
UNION ALL SELECT `id`, 'Cartão de débito', 'DEBITO', 0, 0, 1, true, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3) FROM `estabelecimentos`
UNION ALL SELECT `id`, 'Transferência', 'TRANSFERENCIA', 0, 0, 0, true, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3) FROM `estabelecimentos`;

CREATE TABLE `contas_financeiras` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `estabelecimentoId` INTEGER NOT NULL,
  `agendamentoId` INTEGER NULL,
  `formaPagamentoId` INTEGER NULL,
  `tipo` VARCHAR(191) NOT NULL,
  `categoria` VARCHAR(191) NULL,
  `descricao` VARCHAR(191) NOT NULL,
  `documento` VARCHAR(191) NULL,
  `valorOriginal` DECIMAL(10, 2) NOT NULL,
  `valorPago` DECIMAL(10, 2) NOT NULL DEFAULT 0,
  `status` VARCHAR(191) NOT NULL DEFAULT 'PENDENTE',
  `competencia` DATETIME(3) NOT NULL,
  `vencimento` DATETIME(3) NOT NULL,
  `pagoEm` DATETIME(3) NULL,
  `observacoes` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `contas_agendamento_key`(`agendamentoId`),
  INDEX `contas_estabelecimento_tipo_status_vencimento_idx`(`estabelecimentoId`, `tipo`, `status`, `vencimento`),
  INDEX `contas_forma_pagamento_idx`(`formaPagamentoId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `fechamentos_caixa` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `estabelecimentoId` INTEGER NOT NULL,
  `abertoPorId` INTEGER NOT NULL,
  `fechadoPorId` INTEGER NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'ABERTO',
  `chaveAberto` VARCHAR(191) NULL,
  `abertoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `fechadoEm` DATETIME(3) NULL,
  `saldoInicial` DECIMAL(10, 2) NOT NULL DEFAULT 0,
  `totalReceitas` DECIMAL(10, 2) NOT NULL DEFAULT 0,
  `totalDespesas` DECIMAL(10, 2) NOT NULL DEFAULT 0,
  `saldoEsperado` DECIMAL(10, 2) NOT NULL DEFAULT 0,
  `saldoInformado` DECIMAL(10, 2) NULL,
  `diferenca` DECIMAL(10, 2) NULL,
  `observacoes` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `caixa_chave_aberto_key`(`chaveAberto`),
  INDEX `caixa_estabelecimento_status_abertura_idx`(`estabelecimentoId`, `status`, `abertoEm`),
  INDEX `caixa_aberto_por_idx`(`abertoPorId`),
  INDEX `caixa_fechado_por_idx`(`fechadoPorId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `repasses_financeiros` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `estabelecimentoId` INTEGER NOT NULL,
  `profissionalId` INTEGER NOT NULL,
  `periodoInicio` DATETIME(3) NOT NULL,
  `periodoFim` DATETIME(3) NOT NULL,
  `receitaBruta` DECIMAL(10, 2) NOT NULL,
  `percentualMedio` DECIMAL(5, 2) NOT NULL,
  `valorComissao` DECIMAL(10, 2) NOT NULL,
  `ajustes` DECIMAL(10, 2) NOT NULL DEFAULT 0,
  `valorLiquido` DECIMAL(10, 2) NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'PENDENTE',
  `pagoEm` DATETIME(3) NULL,
  `observacoes` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `repasse_estabelecimento_profissional_periodo_key`(`estabelecimentoId`, `profissionalId`, `periodoInicio`, `periodoFim`),
  INDEX `repasse_estabelecimento_status_periodo_idx`(`estabelecimentoId`, `status`, `periodoFim`),
  INDEX `repasse_profissional_idx`(`profissionalId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `cobrancas_assinaturas` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `assinaturaId` INTEGER NOT NULL,
  `provedor` VARCHAR(191) NOT NULL DEFAULT 'MANUAL',
  `referenciaExterna` VARCHAR(191) NULL,
  `valor` DECIMAL(10, 2) NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'PENDENTE',
  `vencimento` DATETIME(3) NOT NULL,
  `pagoEm` DATETIME(3) NULL,
  `tentativas` INTEGER NOT NULL DEFAULT 0,
  `linkPagamento` TEXT NULL,
  `codigoPix` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `cobrancas_assinaturas_referencia_externa_key`(`referenciaExterna`),
  INDEX `cobranca_assinatura_status_vencimento_idx`(`assinaturaId`, `status`, `vencimento`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `eventos_gateway_pagamento` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `estabelecimentoId` INTEGER NULL,
  `provedor` VARCHAR(191) NOT NULL,
  `eventoExternoId` VARCHAR(191) NOT NULL,
  `tipo` VARCHAR(191) NOT NULL,
  `payload` JSON NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'PENDENTE',
  `processadoEm` DATETIME(3) NULL,
  `erro` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `evento_gateway_provedor_evento_key`(`provedor`, `eventoExternoId`),
  INDEX `evento_gateway_estabelecimento_data_idx`(`estabelecimentoId`, `createdAt`),
  INDEX `evento_gateway_status_data_idx`(`status`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `conciliacoes_financeiras` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `estabelecimentoId` INTEGER NOT NULL,
  `contaFinanceiraId` INTEGER NULL,
  `provedor` VARCHAR(191) NOT NULL,
  `transacaoExternaId` VARCHAR(191) NOT NULL,
  `valorEsperado` DECIMAL(10, 2) NOT NULL,
  `valorRecebido` DECIMAL(10, 2) NOT NULL,
  `diferenca` DECIMAL(10, 2) NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'PENDENTE',
  `conciliadoEm` DATETIME(3) NULL,
  `observacoes` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `conciliacao_estabelecimento_provedor_transacao_key`(`estabelecimentoId`, `provedor`, `transacaoExternaId`),
  INDEX `conciliacao_estabelecimento_status_data_idx`(`estabelecimentoId`, `status`, `createdAt`),
  INDEX `conciliacao_conta_idx`(`contaFinanceiraId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `configuracoes_comissao` ADD CONSTRAINT `config_comissao_estabelecimento_fkey` FOREIGN KEY (`estabelecimentoId`) REFERENCES `estabelecimentos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `configuracoes_comissao` ADD CONSTRAINT `config_comissao_profissional_fkey` FOREIGN KEY (`profissionalId`) REFERENCES `profissionais`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `configuracoes_comissao` ADD CONSTRAINT `config_comissao_servico_fkey` FOREIGN KEY (`servicoId`) REFERENCES `servicos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `formas_pagamento` ADD CONSTRAINT `forma_pagamento_estabelecimento_fkey` FOREIGN KEY (`estabelecimentoId`) REFERENCES `estabelecimentos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `contas_financeiras` ADD CONSTRAINT `conta_estabelecimento_fkey` FOREIGN KEY (`estabelecimentoId`) REFERENCES `estabelecimentos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `contas_financeiras` ADD CONSTRAINT `conta_agendamento_fkey` FOREIGN KEY (`agendamentoId`) REFERENCES `agendamentos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `contas_financeiras` ADD CONSTRAINT `conta_forma_pagamento_fkey` FOREIGN KEY (`formaPagamentoId`) REFERENCES `formas_pagamento`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `fechamentos_caixa` ADD CONSTRAINT `caixa_estabelecimento_fkey` FOREIGN KEY (`estabelecimentoId`) REFERENCES `estabelecimentos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `fechamentos_caixa` ADD CONSTRAINT `caixa_aberto_por_fkey` FOREIGN KEY (`abertoPorId`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `fechamentos_caixa` ADD CONSTRAINT `caixa_fechado_por_fkey` FOREIGN KEY (`fechadoPorId`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `repasses_financeiros` ADD CONSTRAINT `repasse_estabelecimento_fkey` FOREIGN KEY (`estabelecimentoId`) REFERENCES `estabelecimentos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `repasses_financeiros` ADD CONSTRAINT `repasse_profissional_fkey` FOREIGN KEY (`profissionalId`) REFERENCES `profissionais`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cobrancas_assinaturas` ADD CONSTRAINT `cobranca_assinatura_fkey` FOREIGN KEY (`assinaturaId`) REFERENCES `assinaturas_estabelecimentos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `eventos_gateway_pagamento` ADD CONSTRAINT `evento_gateway_estabelecimento_fkey` FOREIGN KEY (`estabelecimentoId`) REFERENCES `estabelecimentos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `conciliacoes_financeiras` ADD CONSTRAINT `conciliacao_estabelecimento_fkey` FOREIGN KEY (`estabelecimentoId`) REFERENCES `estabelecimentos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `conciliacoes_financeiras` ADD CONSTRAINT `conciliacao_conta_fkey` FOREIGN KEY (`contaFinanceiraId`) REFERENCES `contas_financeiras`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
