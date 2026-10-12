ALTER TABLE `solicitacoes_estabelecimentos`
    ADD COLUMN `estabelecimentoGeradoId` INTEGER NULL,
    ADD COLUMN `chaveAtiva` VARCHAR(191) NULL;

UPDATE `solicitacoes_estabelecimentos` s
JOIN (
    SELECT id, ROW_NUMBER() OVER (
        PARTITION BY usuarioId
        ORDER BY CASE status WHEN 'PENDING_REVIEW' THEN 0 WHEN 'CORRECTION_REQUESTED' THEN 1 ELSE 2 END,
                 updatedAt DESC, id DESC
    ) AS posicao
    FROM `solicitacoes_estabelecimentos`
    WHERE status IN ('RASCUNHO', 'CORRECTION_REQUESTED', 'PENDING_REVIEW')
) repetidas ON repetidas.id = s.id
SET s.status = 'CANCELED',
    s.motivoRevisao = COALESCE(s.motivoRevisao, 'Rascunho duplicado consolidado automaticamente.'),
    s.revisadoEm = NOW(),
    s.versao = s.versao + 1
WHERE repetidas.posicao > 1;

UPDATE `solicitacoes_estabelecimentos`
SET `chaveAtiva` = CONCAT('usuario:', `usuarioId`)
WHERE status IN ('RASCUNHO', 'CORRECTION_REQUESTED', 'PENDING_REVIEW');

CREATE UNIQUE INDEX `solicitacoes_estabelecimentos_chaveAtiva_key`
    ON `solicitacoes_estabelecimentos`(`chaveAtiva`);
CREATE UNIQUE INDEX `solicitacoes_estabelecimentos_estabelecimentoGeradoId_key`
    ON `solicitacoes_estabelecimentos`(`estabelecimentoGeradoId`);
ALTER TABLE `solicitacoes_estabelecimentos`
    ADD CONSTRAINT `solicitacoes_estabelecimentos_estabelecimentoGeradoId_fkey`
    FOREIGN KEY (`estabelecimentoGeradoId`) REFERENCES `estabelecimentos`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;
