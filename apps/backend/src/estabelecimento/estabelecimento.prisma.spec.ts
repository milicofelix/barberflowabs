import { EstabelecimentoPrisma } from './estabelecimento.prisma';

describe('Perfil público do estabelecimento', () => {
  it('registra a revisão da capa com entidadeId compatível com o Prisma', async () => {
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

    expect(resultado.reviewStatus).toBe('PENDING_REVIEW');
    expect(prisma.logAuditoria.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        estabelecimentoId: 9,
        usuarioId: 7,
        entidade: 'Estabelecimento',
        entidadeId: '9',
      }),
    });
  });
});
