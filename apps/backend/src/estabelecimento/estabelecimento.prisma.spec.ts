import { EstabelecimentoPrisma } from './estabelecimento.prisma';

describe('Perfil público do estabelecimento', () => {
  it('mantém a aprovação administrativa ao trocar somente a imagem de capa', async () => {
    const atual = {
      id: 9,
      nome: 'Clínica',
      slug: 'clinica',
      nomePublico: 'Clínica',
      descricaoPublica: null,
      imagemCapaURL: '/capas/anterior.webp',
      telefone: null,
      email: null,
      endereco: null,
      bairro: null,
      cidade: null,
      estado: null,
      latitude: null,
      longitude: null,
      aceitaAgendamentoOnline: true,
      reviewStatus: 'APPROVED',
      segmentos: [],
    };
    const prisma = {
      estabelecimento: {
        findUnique: jest.fn().mockResolvedValue(atual),
        update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ ...atual, ...data })),
      },
      logAuditoria: { create: jest.fn().mockResolvedValue({ id: 1 }) },
    };

    const resultado = await new EstabelecimentoPrisma(prisma as any).atualizarPerfilPublico(9, 7, {
      nomePublico: 'Clínica',
      imagemCapaURL: '/midias/arquivos/capa/principal',
      aceitaAgendamentoOnline: true,
    });

    expect(resultado.reviewStatus).toBe('APPROVED');
    expect(prisma.logAuditoria.create).not.toHaveBeenCalled();
  });
});
