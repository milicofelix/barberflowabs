import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CatalogoIntegridadePrisma } from './catalogo-integridade.prisma';

describe('CatalogoIntegridadePrisma - isolamento de tenant', () => {
  it('nao altera profissional que nao pertence ao estabelecimento informado', async () => {
    const findFirst = jest.fn().mockResolvedValue(null);
    const integridade = new CatalogoIntegridadePrisma({ profissional: { findFirst } } as any);

    await expect(
      integridade.validarEntidadeTenant('profissional', 15, 8),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(findFirst).toHaveBeenCalledWith({
      where: { id: 15, barbeariaId: 8 },
      select: { id: true },
    });
  });

  it('nao altera servico que nao pertence ao estabelecimento informado', async () => {
    const findFirst = jest.fn().mockResolvedValue(null);
    const integridade = new CatalogoIntegridadePrisma({ servico: { findFirst } } as any);

    await expect(integridade.validarEntidadeTenant('servico', 21, 8)).rejects.toBeInstanceOf(NotFoundException);

    expect(findFirst).toHaveBeenCalledWith({
      where: { id: 21, barbeariaId: 8 },
      select: { id: true },
    });
  });

  it('nao restringe o estabelecimento enquanto houver servicos de outra modalidade', async () => {
    const integridade = new CatalogoIntegridadePrisma({
      servico: { count: jest.fn().mockResolvedValue(1) },
    } as any);

    await expect(integridade.validarServicosCompativeis(8, 'PRESENCIAL')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
