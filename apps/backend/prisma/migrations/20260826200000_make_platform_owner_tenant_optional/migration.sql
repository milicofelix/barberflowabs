ALTER TABLE `usuarios`
  MODIFY `barbeariaId` INTEGER NULL;

UPDATE `usuarios`
SET `barbeariaId` = NULL,
    `barbeiro` = false,
    `papel` = 'SUPER_ADMIN'
WHERE `papel` = 'SUPER_ADMIN'
   OR `email` = 'marcao@barberflowabs.app';
