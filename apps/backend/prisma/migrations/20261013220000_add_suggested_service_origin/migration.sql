ALTER TABLE `servicos`
  ADD COLUMN `servicoSugeridoId` INTEGER NULL;

CREATE UNIQUE INDEX `servicos_estabelecimentoId_servicoSugeridoId_key`
  ON `servicos`(`estabelecimentoId`, `servicoSugeridoId`);

ALTER TABLE `servicos`
  ADD CONSTRAINT `servicos_servicoSugeridoId_fkey`
  FOREIGN KEY (`servicoSugeridoId`) REFERENCES `servicos_sugeridos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
