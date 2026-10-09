import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { CatalogoPolicy } from './catalogo.policy';

describe('CatalogoPolicy', () => {
  const policy = new CatalogoPolicy();

  it('permite configuracao coerente de estabelecimento hibrido', () => {
    expect(() =>
      policy.validarEstabelecimento({
        tipoEstabelecimento: 'SALAO_BELEZA',
        modeloAtendimento: 'HIBRIDO',
        segmentoIds: [1],
        especialidadeIds: [2, 3],
      }),
    ).not.toThrow();
  });

  it('rejeita especialidade principal fora da selecao do profissional', () => {
    expect(() =>
      policy.validarProfissional({ especialidadeIds: [2], especialidadePrincipalId: 3 }),
    ).toThrow(BadRequestException);
  });

  it('impede modalidade de servico nao oferecida pelo estabelecimento', () => {
    expect(() => policy.validarCompatibilidadeModelo('PRESENCIAL', 'DOMICILIAR')).toThrow(
      BadRequestException,
    );
    expect(() => policy.validarCompatibilidadeModelo('HIBRIDO', 'DOMICILIAR')).not.toThrow();
  });

  it('restringe alteracoes a gestores vinculados a um tenant', () => {
    expect(() => policy.validarGestor({ papel: 'CUSTOMER', barbeariaId: 1 })).toThrow(
      ForbiddenException,
    );
    expect(() => policy.validarGestor({ papel: 'BARBERSHOP_OWNER', barbeariaId: 4 })).not.toThrow();
  });
});
