import { BadRequestException } from '@nestjs/common';
import { validarEmail, validarTextoObrigatorio } from 'src/shared/validacao';

export function validarDenunciaPerfilPublico(dados: any) {
  validarTextoObrigatorio(dados?.motivo, 'Motivo');
  validarTextoObrigatorio(dados?.mensagem, 'Mensagem');

  if (dados.email) validarEmail(dados.email, 'E-mail');
  if (dados.mensagem.trim().length < 10) {
    throw new BadRequestException('Mensagem deve ter pelo menos 10 caracteres');
  }
}
