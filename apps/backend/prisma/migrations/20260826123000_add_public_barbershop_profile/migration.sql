ALTER TABLE `barbearias`
  ADD COLUMN `nomePublico` VARCHAR(191) NULL,
  ADD COLUMN `descricaoPublica` TEXT NULL,
  ADD COLUMN `imagemCapaURL` VARCHAR(191) NULL,
  ADD COLUMN `endereco` VARCHAR(191) NULL,
  ADD COLUMN `bairro` VARCHAR(191) NULL,
  ADD COLUMN `cidade` VARCHAR(191) NULL,
  ADD COLUMN `estado` VARCHAR(191) NULL,
  ADD COLUMN `latitude` DOUBLE NULL,
  ADD COLUMN `longitude` DOUBLE NULL,
  ADD COLUMN `aceitaAgendamentoOnline` BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN `destaque` BOOLEAN NOT NULL DEFAULT false;

UPDATE `barbearias`
SET `nomePublico` = COALESCE(`nomePublico`, `nome`),
    `descricaoPublica` = COALESCE(`descricaoPublica`, 'Agendamento online, profissionais e servicos da barbearia.'),
    `imagemCapaURL` = COALESCE(`imagemCapaURL`, '/banner.png'),
    `endereco` = COALESCE(`endereco`, 'Rua Principal, 100'),
    `bairro` = COALESCE(`bairro`, 'Centro'),
    `cidade` = COALESCE(`cidade`, 'Sao Paulo'),
    `estado` = COALESCE(`estado`, 'SP')
WHERE `slug` = 'barber-flow-abs';
