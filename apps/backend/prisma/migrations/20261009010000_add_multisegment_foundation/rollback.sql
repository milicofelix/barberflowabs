-- Execucao manual e deliberada. Nao e consumido automaticamente pelo Prisma.
DROP TABLE `servicos_requisitos`;
DROP TABLE `requisitos`;
DROP TABLE `estabelecimentos_especialidades`;
DROP TABLE `estabelecimentos_segmentos`;
DROP TABLE `especialidades`;
DROP TABLE `segmentos`;

ALTER TABLE `barbearias`
  DROP COLUMN `modeloAtendimento`,
  DROP COLUMN `tipoEstabelecimento`;
