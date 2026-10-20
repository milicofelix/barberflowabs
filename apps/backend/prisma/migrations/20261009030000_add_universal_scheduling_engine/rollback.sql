-- Execucao manual e destrutiva. Exige backup e confirmacao explicita.
DROP TABLE `historico_reagendamentos`;
DROP TABLE `agendamentos_recursos`;
DROP TABLE `agendamentos_servicos`;
DROP TABLE `servicos_recursos`;
DROP TABLE `recursos`;
DROP TABLE `profissionais_servicos`;

ALTER TABLE `agendamentos`
  DROP FOREIGN KEY `agendamentos_unidadeId_fkey`,
  DROP INDEX `agendamentos_profissionalId_ocupacao_idx`,
  DROP INDEX `agendamentos_unidadeId_ocupacao_idx`,
  DROP COLUMN `reagendadoEm`,
  DROP COLUMN `deslocamentoMinutos`,
  DROP COLUMN `enderecoAtendimento`,
  DROP COLUMN `modeloAtendimento`,
  DROP COLUMN `unidadeId`,
  DROP COLUMN `fimOcupacao`,
  DROP COLUMN `inicioOcupacao`,
  DROP COLUMN `dataFim`;

ALTER TABLE `servicos`
  DROP COLUMN `deslocamentoMinutos`,
  DROP COLUMN `preparoDepoisMinutos`,
  DROP COLUMN `preparoAntesMinutos`,
  DROP COLUMN `duracaoMinutos`;
