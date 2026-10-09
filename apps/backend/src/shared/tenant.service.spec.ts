import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TenantService } from './tenant.service';

describe('TenantService', () => {
  const findUnique = jest.fn();
  const service = new TenantService({ barbearia: { findUnique } } as any);

  beforeEach(() => findUnique.mockReset());

  it('resolve somente o tenant identificado pelo id solicitado', async () => {
    findUnique.mockResolvedValue({ id: 7 });

    await expect(service.resolverBarbeariaId({ headers: { 'x-barbearia-id': '7' } })).resolves.toBe(7);
    expect(findUnique).toHaveBeenCalledWith({ where: { id: 7 }, select: { id: true } });
  });

  it('nao troca silenciosamente para outro tenant quando o id nao existe', async () => {
    findUnique.mockResolvedValue(null);

    await expect(service.resolverBarbeariaId({ headers: { 'x-barbearia-id': '999' } })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejeita identificadores de tenant invalidos antes de consultar o banco', async () => {
    await expect(service.resolverBarbeariaId({ headers: { 'x-barbearia-id': '-1' } })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(findUnique).not.toHaveBeenCalled();
  });
});
