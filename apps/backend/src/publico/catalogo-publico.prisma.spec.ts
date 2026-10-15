import { BadRequestException } from '@nestjs/common';
import { CatalogoPublicoPrisma, filtrosCatalogoPublico } from './catalogo-publico.prisma';

describe('Catálogo público limitado', () => {
  it('varia os candidatos por consulta sem duplicar nem ultrapassar seis itens', async () => {
    const registros = Array.from({ length: 8 }, (_, i) => ({ id: i + 1, preco: 50, estabelecimento: { id: 1, slug: 'unidade', nome: 'Unidade' } }));
    const prisma: any = {
      estabelecimento: { count: jest.fn().mockResolvedValue(1), findMany: jest.fn().mockResolvedValue([{ id: 1 }]) },
      servico: { count: jest.fn().mockResolvedValue(8), findMany: jest.fn(async ({ skip = 0, take }) => registros.slice(skip, skip + take)) },
    };
    const catalogo = new CatalogoPublicoPrisma(prisma, { criteriosPublicacao: () => ({ reviewStatus: 'APPROVED' }) } as any);
    const primeira = await catalogo.listar('servicos', { vitrine: 'true' }, () => 0);
    const segunda = await catalogo.listar('servicos', { vitrine: 'true' }, (maximo) => maximo - 1);
    expect(primeira.itens.map((item) => item.id)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(segunda.itens.map((item) => item.id)).toEqual([8, 1, 2, 3, 4, 5]);
    expect(new Set(segunda.itens.map((item) => item.id)).size).toBe(6);
    expect(prisma.servico.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 7, take: 6 }));
  });
  it.each([{ limite: '25' }, { pagina: '0' }, { q: 'x'.repeat(121) }, { segmento: ['barbearia'] }, { vitrine: 'qualquer' }])('recusa parâmetros inválidos: %o', (query) => {
    expect(() => filtrosCatalogoPublico(query)).toThrow(BadRequestException);
  });
  it('pagina no banco e reaproveita a política de publicação', async () => {
    const prisma: any = { servico: { findMany: jest.fn().mockResolvedValue([]), count: jest.fn().mockResolvedValue(30) } };
    const publico: any = { criteriosPublicacao: jest.fn().mockReturnValue({ reviewStatus: 'APPROVED' }) };
    const catalogo = new CatalogoPublicoPrisma(prisma, publico);
    const resposta = await catalogo.listar('servicos', { pagina: '2', limite: '12', segmento: 'barbearia' });
    expect(prisma.servico.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 12, take: 12, where: expect.objectContaining({ profissionaisHabilitados: { some: { ativo: true } }, estabelecimento: { AND: [{ reviewStatus: 'APPROVED' }, { segmentos: { some: { segmento: { slug: 'barbearia', ativo: true } } } }] } }) }));
    expect(resposta.paginacao).toEqual({ pagina: 2, limite: 12, total: 30, paginas: 3 });
  });
  it('intercala unidades e limita candidatos, sem buscar todo o catálogo', async () => {
    const prisma: any = {
      estabelecimento: { count: jest.fn().mockResolvedValue(2), findMany: jest.fn().mockResolvedValue([{ id: 1 }, { id: 2 }]) },
      servico: { count: jest.fn().mockResolvedValue(6), findMany: jest.fn(async ({ where }) => Array.from({ length: 6 }, (_, i) => ({ id: where.estabelecimentoId * 10 + i, nome: `Serviço ${i}`, preco: '50.00', estabelecimento: { id: where.estabelecimentoId, slug: `unidade-${where.estabelecimentoId}`, nome: 'Unidade', nomePublico: null } }))) },
    };
    const catalogo = new CatalogoPublicoPrisma(prisma, { criteriosPublicacao: () => ({ reviewStatus: 'APPROVED' }) } as any);
    const resposta = await catalogo.listar('servicos', { vitrine: 'true', limite: '24' }, () => 0);
    expect(resposta.itens.map((item) => item.id)).toEqual([10, 20, 11, 21, 12, 22]);
    expect(resposta.itens[0].preco).toBe(50);
    expect(prisma.servico.findMany).toHaveBeenCalledTimes(2);
    expect(prisma.servico.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 6 }));
    expect(resposta.paginacao.limite).toBe(6);
  });
});
