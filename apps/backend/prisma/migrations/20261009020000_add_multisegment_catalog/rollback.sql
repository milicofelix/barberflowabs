-- Execucao manual e deliberada. Nao e consumido automaticamente pelo Prisma.
DELETE FROM `estabelecimentos_especialidades`
WHERE `especialidadeId` IN (
  SELECT `id` FROM `especialidades` WHERE `slug` IN ('cabelo', 'barba')
);

DELETE FROM `requisitos`
WHERE `slug` IN ('informar-alergias', 'teste-de-sensibilidade', 'preparo-previo');

DELETE FROM `especialidades` WHERE `slug` IN ('cabelo', 'barba');

DROP TABLE `servicos_especialidades`;
DROP TABLE `profissionais_especialidades`;

ALTER TABLE `servicos`
  DROP COLUMN `modeloAtendimento`,
  DROP COLUMN `observacoes`;
