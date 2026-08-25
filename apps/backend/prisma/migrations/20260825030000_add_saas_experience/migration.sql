ALTER TABLE `usuarios`
  ADD COLUMN `papel` VARCHAR(191) NOT NULL DEFAULT 'CUSTOMER';

UPDATE `usuarios`
SET `papel` = CASE WHEN `barbeiro` = TRUE THEN 'BARBER' ELSE 'CUSTOMER' END
WHERE `papel` = 'CUSTOMER';

ALTER TABLE `barbearias`
  ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'TRIAL',
  ADD COLUMN `trialEndsAt` DATETIME(3) NULL;

CREATE TABLE `planos_assinatura` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(191) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `descricao` TEXT NOT NULL,
  `precoMensal` DECIMAL(10, 2) NOT NULL,
  `limiteUsuarios` INTEGER NOT NULL,
  `limiteUnidades` INTEGER NOT NULL,
  `limiteServicos` INTEGER NOT NULL,
  `recursos` JSON NOT NULL,
  `ativo` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `planos_assinatura_nome_key`(`nome`),
  UNIQUE INDEX `planos_assinatura_slug_key`(`slug`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `assinaturas_barbearia` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `barbeariaId` INTEGER NOT NULL,
  `planoId` INTEGER NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'TRIAL',
  `trialEndsAt` DATETIME(3) NULL,
  `currentPeriodEnd` DATETIME(3) NULL,
  `cancelAtPeriodEnd` BOOLEAN NOT NULL DEFAULT false,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `assinaturas_barbearia_barbeariaId_key`(`barbeariaId`),
  INDEX `assinaturas_barbearia_planoId_idx`(`planoId`),
  INDEX `assinaturas_barbearia_status_idx`(`status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `logs_auditoria` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `barbeariaId` INTEGER NULL,
  `usuarioId` INTEGER NULL,
  `acao` VARCHAR(191) NOT NULL,
  `entidade` VARCHAR(191) NOT NULL,
  `entidadeId` VARCHAR(191) NULL,
  `detalhes` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `logs_auditoria_barbeariaId_createdAt_idx`(`barbeariaId`, `createdAt`),
  INDEX `logs_auditoria_usuarioId_createdAt_idx`(`usuarioId`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `planos_assinatura`
  (`nome`, `slug`, `descricao`, `precoMensal`, `limiteUsuarios`, `limiteUnidades`, `limiteServicos`, `recursos`)
VALUES
  ('Starter', 'starter', 'Agenda e gestao basica para uma barbearia pequena.', 49.90, 3, 1, 20, JSON_ARRAY('agenda', 'clientes', 'caixa')),
  ('Professional', 'professional', 'Operacao completa com relatorios e multiplos profissionais.', 99.90, 10, 2, 80, JSON_ARRAY('agenda', 'clientes', 'caixa', 'relatorios', 'comissoes')),
  ('Scale', 'scale', 'Plano para operacoes com varias unidades e equipe maior.', 199.90, 30, 5, 200, JSON_ARRAY('agenda', 'clientes', 'caixa', 'relatorios', 'comissoes', 'multi_unidade'));

UPDATE `barbearias`
SET `trialEndsAt` = DATE_ADD(CURRENT_TIMESTAMP(3), INTERVAL 14 DAY)
WHERE `trialEndsAt` IS NULL;

INSERT INTO `assinaturas_barbearia` (`barbeariaId`, `planoId`, `status`, `trialEndsAt`)
SELECT b.`id`, p.`id`, b.`status`, b.`trialEndsAt`
FROM `barbearias` b
JOIN `planos_assinatura` p ON p.`slug` = 'professional'
WHERE NOT EXISTS (
  SELECT 1 FROM `assinaturas_barbearia` a WHERE a.`barbeariaId` = b.`id`
);

ALTER TABLE `assinaturas_barbearia`
  ADD CONSTRAINT `assinaturas_barbearia_barbeariaId_fkey`
  FOREIGN KEY (`barbeariaId`) REFERENCES `barbearias`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `assinaturas_barbearia`
  ADD CONSTRAINT `assinaturas_barbearia_planoId_fkey`
  FOREIGN KEY (`planoId`) REFERENCES `planos_assinatura`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `logs_auditoria`
  ADD CONSTRAINT `logs_auditoria_barbeariaId_fkey`
  FOREIGN KEY (`barbeariaId`) REFERENCES `barbearias`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `logs_auditoria`
  ADD CONSTRAINT `logs_auditoria_usuarioId_fkey`
  FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
