import { BadRequestException } from '@nestjs/common';

export function validarTextoObrigatorio(valor: unknown, campo: string) {
  if (typeof valor !== 'string' || valor.trim().length === 0) {
    throw new BadRequestException(`${campo} é obrigatório`);
  }
}

export function validarEmail(valor: unknown, campo = 'E-mail') {
  validarTextoObrigatorio(valor, campo);

  const email = String(valor).trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new BadRequestException(`${campo} inválido`);
  }
}

export function validarSenha(valor: unknown, tamanhoMinimo = 6) {
  validarTextoObrigatorio(valor, 'Senha');

  if (String(valor).length < tamanhoMinimo) {
    throw new BadRequestException(`Senha deve ter pelo menos ${tamanhoMinimo} caracteres`);
  }
}

export function validarData(valor: unknown, campo = 'Data') {
  validarTextoObrigatorio(valor, campo);

  const data = new Date(String(valor));
  if (Number.isNaN(data.getTime())) {
    throw new BadRequestException(`${campo} inválida`);
  }
}

export function validarNumeroInteiroPositivo(valor: unknown, campo: string) {
  const numero = Number(valor);

  if (!Number.isInteger(numero) || numero <= 0) {
    throw new BadRequestException(`${campo} inválido`);
  }
}
