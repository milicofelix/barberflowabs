RENAME TABLE `barbearias` TO `estabelecimentos`;
RENAME TABLE `clientes_barbearias` TO `clientes_estabelecimentos`;
RENAME TABLE `assinaturas_barbearia` TO `assinaturas_estabelecimentos`;

ALTER TABLE `usuarios` RENAME COLUMN `barbeariaId` TO `estabelecimentoId`, RENAME COLUMN `barbeiro` TO `membroEstabelecimento`;
ALTER TABLE `profissionais` RENAME COLUMN `barbeariaId` TO `estabelecimentoId`;
ALTER TABLE `servicos` RENAME COLUMN `barbeariaId` TO `estabelecimentoId`;
ALTER TABLE `agendamentos` RENAME COLUMN `barbeariaId` TO `estabelecimentoId`;
ALTER TABLE `estabelecimentos_segmentos` RENAME COLUMN `barbeariaId` TO `estabelecimentoId`;
ALTER TABLE `estabelecimentos_especialidades` RENAME COLUMN `barbeariaId` TO `estabelecimentoId`;
ALTER TABLE `profissionais_especialidades` RENAME COLUMN `barbeariaId` TO `estabelecimentoId`;
ALTER TABLE `servicos_especialidades` RENAME COLUMN `barbeariaId` TO `estabelecimentoId`;
ALTER TABLE `profissionais_servicos` RENAME COLUMN `barbeariaId` TO `estabelecimentoId`;
ALTER TABLE `recursos` RENAME COLUMN `barbeariaId` TO `estabelecimentoId`;
ALTER TABLE `membros_equipe` RENAME COLUMN `barbeariaId` TO `estabelecimentoId`;
ALTER TABLE `escalas_profissionais` RENAME COLUMN `barbeariaId` TO `estabelecimentoId`;
ALTER TABLE `indisponibilidades_recursos` RENAME COLUMN `barbeariaId` TO `estabelecimentoId`;
ALTER TABLE `clientes_estabelecimentos` RENAME COLUMN `barbeariaId` TO `estabelecimentoId`;
ALTER TABLE `unidades` RENAME COLUMN `barbeariaId` TO `estabelecimentoId`;
ALTER TABLE `horarios_funcionamento` RENAME COLUMN `barbeariaId` TO `estabelecimentoId`;
ALTER TABLE `bloqueios_agenda` RENAME COLUMN `barbeariaId` TO `estabelecimentoId`;
ALTER TABLE `lancamentos_financeiros` RENAME COLUMN `barbeariaId` TO `estabelecimentoId`;
ALTER TABLE `assinaturas_estabelecimentos` RENAME COLUMN `barbeariaId` TO `estabelecimentoId`;
ALTER TABLE `logs_auditoria` RENAME COLUMN `barbeariaId` TO `estabelecimentoId`;
ALTER TABLE `lembretes_relacionamento` RENAME COLUMN `barbeariaId` TO `estabelecimentoId`;
ALTER TABLE `avaliacoes` RENAME COLUMN `barbeariaId` TO `estabelecimentoId`;
ALTER TABLE `denuncias_perfil_publico` RENAME COLUMN `barbeariaId` TO `estabelecimentoId`;

UPDATE `usuarios` SET `papel` = 'ESTABLISHMENT_OWNER' WHERE `papel` = 'BARBERSHOP_OWNER';
UPDATE `usuarios` SET `papel` = 'ESTABLISHMENT_MEMBER' WHERE `papel` = 'BARBER';

