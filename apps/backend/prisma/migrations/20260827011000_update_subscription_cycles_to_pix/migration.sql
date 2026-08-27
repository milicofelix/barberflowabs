UPDATE `planos_assinatura` antigo
LEFT JOIN `planos_assinatura` novo ON novo.`slug` = 'mensal'
SET
  antigo.`nome` = 'Mensal',
  antigo.`slug` = 'mensal',
  antigo.`descricao` = 'Plano de entrada para validar a operação com baixo compromisso. Cobrança mensal via PIX a partir de R$ 49,90.',
  antigo.`precoMensal` = 49.90,
  antigo.`limiteUsuarios` = 3,
  antigo.`limiteUnidades` = 1,
  antigo.`limiteServicos` = 20,
  antigo.`recursos` = JSON_ARRAY('agenda', 'clientes', 'caixa', 'pix', 'ciclo_mensal'),
  antigo.`ativo` = TRUE
WHERE antigo.`slug` = 'starter' AND novo.`id` IS NULL;

UPDATE `planos_assinatura` antigo
LEFT JOIN `planos_assinatura` novo ON novo.`slug` = 'trimestral'
SET
  antigo.`nome` = 'Trimestral',
  antigo.`slug` = 'trimestral',
  antigo.`descricao` = 'Ideal para manter a barbearia ativa por mais tempo, com desconto em relação ao pagamento mensal e cobrança via PIX a cada 3 meses.',
  antigo.`precoMensal` = 134.70,
  antigo.`limiteUsuarios` = 3,
  antigo.`limiteUnidades` = 1,
  antigo.`limiteServicos` = 20,
  antigo.`recursos` = JSON_ARRAY('agenda', 'clientes', 'caixa', 'pix', 'ciclo_trimestral', 'desconto_10'),
  antigo.`ativo` = TRUE
WHERE antigo.`slug` = 'professional' AND novo.`id` IS NULL;

UPDATE `planos_assinatura` antigo
LEFT JOIN `planos_assinatura` novo ON novo.`slug` = 'anual'
SET
  antigo.`nome` = 'Anual',
  antigo.`slug` = 'anual',
  antigo.`descricao` = 'Melhor custo-benefício para quem já decidiu usar o Barber Flow ABS: maior desconto, previsibilidade anual e pagamento via PIX.',
  antigo.`precoMensal` = 479.04,
  antigo.`limiteUsuarios` = 3,
  antigo.`limiteUnidades` = 1,
  antigo.`limiteServicos` = 20,
  antigo.`recursos` = JSON_ARRAY('agenda', 'clientes', 'caixa', 'pix', 'ciclo_anual', 'desconto_20'),
  antigo.`ativo` = TRUE
WHERE antigo.`slug` = 'scale' AND novo.`id` IS NULL;

INSERT INTO `planos_assinatura`
  (`nome`, `slug`, `descricao`, `precoMensal`, `limiteUsuarios`, `limiteUnidades`, `limiteServicos`, `recursos`, `ativo`)
SELECT
  'Mensal',
  'mensal',
  'Plano de entrada para validar a operação com baixo compromisso. Cobrança mensal via PIX a partir de R$ 49,90.',
  49.90,
  3,
  1,
  20,
  JSON_ARRAY('agenda', 'clientes', 'caixa', 'pix', 'ciclo_mensal'),
  TRUE
WHERE NOT EXISTS (SELECT 1 FROM `planos_assinatura` WHERE `slug` = 'mensal');

INSERT INTO `planos_assinatura`
  (`nome`, `slug`, `descricao`, `precoMensal`, `limiteUsuarios`, `limiteUnidades`, `limiteServicos`, `recursos`, `ativo`)
SELECT
  'Trimestral',
  'trimestral',
  'Ideal para manter a barbearia ativa por mais tempo, com desconto em relação ao pagamento mensal e cobrança via PIX a cada 3 meses.',
  134.70,
  3,
  1,
  20,
  JSON_ARRAY('agenda', 'clientes', 'caixa', 'pix', 'ciclo_trimestral', 'desconto_10'),
  TRUE
WHERE NOT EXISTS (SELECT 1 FROM `planos_assinatura` WHERE `slug` = 'trimestral');

INSERT INTO `planos_assinatura`
  (`nome`, `slug`, `descricao`, `precoMensal`, `limiteUsuarios`, `limiteUnidades`, `limiteServicos`, `recursos`, `ativo`)
SELECT
  'Anual',
  'anual',
  'Melhor custo-benefício para quem já decidiu usar o Barber Flow ABS: maior desconto, previsibilidade anual e pagamento via PIX.',
  479.04,
  3,
  1,
  20,
  JSON_ARRAY('agenda', 'clientes', 'caixa', 'pix', 'ciclo_anual', 'desconto_20'),
  TRUE
WHERE NOT EXISTS (SELECT 1 FROM `planos_assinatura` WHERE `slug` = 'anual');

UPDATE `assinaturas_barbearia` assinatura
JOIN `planos_assinatura` antigo ON antigo.`id` = assinatura.`planoId` AND antigo.`slug` = 'starter'
JOIN `planos_assinatura` novo ON novo.`slug` = 'mensal'
SET assinatura.`planoId` = novo.`id`;

UPDATE `assinaturas_barbearia` assinatura
JOIN `planos_assinatura` antigo ON antigo.`id` = assinatura.`planoId` AND antigo.`slug` = 'professional'
JOIN `planos_assinatura` novo ON novo.`slug` = 'trimestral'
SET assinatura.`planoId` = novo.`id`;

UPDATE `assinaturas_barbearia` assinatura
JOIN `planos_assinatura` antigo ON antigo.`id` = assinatura.`planoId` AND antigo.`slug` = 'scale'
JOIN `planos_assinatura` novo ON novo.`slug` = 'anual'
SET assinatura.`planoId` = novo.`id`;

UPDATE `planos_assinatura`
SET `ativo` = FALSE
WHERE `slug` IN ('starter', 'professional', 'scale');
