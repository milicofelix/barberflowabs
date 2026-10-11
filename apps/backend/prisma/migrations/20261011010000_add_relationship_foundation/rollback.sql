DROP TABLE IF EXISTS `tentativas_envios_comunicacao`;
DROP TABLE IF EXISTS `envios_comunicacao`;
DROP TABLE IF EXISTS `templates_comunicacao`;
DROP TABLE IF EXISTS `preferencias_comunicacao`;

ALTER TABLE `clientes_estabelecimentos`
  DROP COLUMN `ultimaInteracaoEm`,
  DROP COLUMN `observacoes`,
  DROP COLUMN `tags`,
  DROP COLUMN `status`;
