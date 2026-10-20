-- Corrige somente as fotos demonstrativas conhecidas e silhuetas padrão.
-- Fotos enviadas por usuários e a classificação de sexo são preservadas.
START TRANSACTION;

UPDATE `profissionais` AS p
LEFT JOIN `midias` AS m
  ON m.`escopo` = 'GLOBAL'
  AND m.`finalidade` = 'PROFISSIONAL'
  AND m.`chaveCatalogo` IN ('profissional-1', 'profissional-2', 'profissional-3', 'profissional-4', 'profissional-5', 'profissional-6')
  AND p.`imagemURL` = JSON_UNQUOTE(JSON_EXTRACT(m.`versoes`, '$.principal.url'))
SET p.`imagemURL` = CASE
  WHEN p.`sexo` = 'FEMININO' THEN '/profissionais/avatar-feminino.png'
  ELSE '/profissionais/avatar-masculino.png'
END
WHERE m.`id` IS NOT NULL
  OR p.`imagemURL` IN (
    '/profissionais/profissional-1.jpg', '/profissionais/profissional-2.jpg',
    '/profissionais/profissional-3.jpg', '/profissionais/profissional-4.jpg',
    '/profissionais/profissional-5.jpg', '/profissionais/profissional-6.jpg'
  )
  OR (p.`sexo` IN ('MASCULINO', 'FEMININO') AND p.`imagemURL` IN (
    '/profissionais/avatar-masculino.png', '/profissionais/avatar-feminino.png'
  ));

DELETE v FROM `midias_vinculos` AS v
INNER JOIN `midias` AS m ON m.`id` = v.`midiaId`
WHERE v.`entidade` = 'PROFISSIONAL'
  AND m.`escopo` = 'GLOBAL'
  AND m.`finalidade` = 'PROFISSIONAL'
  AND m.`chaveCatalogo` IN ('profissional-1', 'profissional-2', 'profissional-3', 'profissional-4', 'profissional-5', 'profissional-6');

UPDATE `midias`
SET `ativo` = false, `updatedAt` = CURRENT_TIMESTAMP(3)
WHERE `escopo` = 'GLOBAL' AND `finalidade` = 'PROFISSIONAL'
  AND `chaveCatalogo` IN ('profissional-1', 'profissional-2', 'profissional-3', 'profissional-4', 'profissional-5', 'profissional-6');

COMMIT;
