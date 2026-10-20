import { OrquestradorAtendimentoService } from './orquestrador-atendimento.service';

describe('OrquestradorAtendimentoService', () => {
  const inicio = new Date('2026-10-14T16:00:00.000Z');
  const fim = new Date('2026-10-14T17:30:00.000Z');
  let prisma: any;
  let service: OrquestradorAtendimentoService;

  beforeEach(() => {
    prisma = {
      agendamento: {
        findUnique: jest.fn().mockResolvedValue({
          id: 41,
          estabelecimentoId: 7,
          profissionalId: 9,
          status: 'AGENDADO',
          data: inicio,
          dataFim: fim,
          revisaoFluxo: 2,
          automacaoAtendimentoAtiva: true,
          controleManualEm: null,
          estabelecimento: {
            id: 7,
            fluxoAtendimentoAutomaticoAtivo: true,
            inicioAtendimentoAutomaticoAtivo: true,
            finalizacaoAtendimentoAutomaticaAtiva: true,
            avisoAtendimentoAntecedenciaMinutos: 10,
          },
        }),
      },
      transicaoAgendamento: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        createMany: jest.fn().mockResolvedValue({ count: 3 }),
      },
      membroEquipe: {
        findFirst: jest.fn().mockResolvedValue({ usuarioId: 88 }),
        findMany: jest.fn(),
      },
      usuario: { findFirst: jest.fn() },
    };
    service = new OrquestradorAtendimentoService(prisma);
  });

  it('programa aviso, início e fim com chaves idempotentes', async () => {
    const resultado = await service.programar(41, new Date('2026-10-14T15:00:00.000Z'));

    expect(resultado).toEqual({ criadas: 3, destinatarios: 1 });
    expect(prisma.transicaoAgendamento.createMany).toHaveBeenCalledWith({
      skipDuplicates: true,
      data: expect.arrayContaining([
        expect.objectContaining({
          tipo: 'AVISO',
          destinatarioUsuarioId: 88,
          dataPrevista: new Date('2026-10-14T15:50:00.000Z'),
          chaveIdempotencia: 'atendimento:41:r2:AVISO:u88',
        }),
        expect.objectContaining({ tipo: 'INICIAR', dataPrevista: inicio }),
        expect.objectContaining({ tipo: 'FINALIZAR', dataPrevista: fim }),
      ]),
    });
  });

  it('usa equipe autorizada quando o profissional não possui conta', async () => {
    prisma.membroEquipe.findFirst.mockResolvedValue(null);
    prisma.membroEquipe.findMany.mockResolvedValue([
      { usuarioId: 10, papel: 'RECEPCIONISTA', permissoes: ['AGENDA_GERENCIAR'] },
      { usuarioId: 11, papel: 'PROFISSIONAL', permissoes: [] },
    ]);

    await service.programar(41, new Date('2026-10-14T15:00:00.000Z'));

    const tarefas = prisma.transicaoAgendamento.createMany.mock.calls[0][0].data;
    expect(tarefas.find((item: any) => item.tipo === 'AVISO').destinatarioUsuarioId).toBe(10);
    expect(prisma.usuario.findFirst).not.toHaveBeenCalled();
  });

  it('agenda aviso imediato quando criado dentro da janela', async () => {
    const agora = new Date('2026-10-14T15:55:00.000Z');
    await service.programar(41, agora);
    const tarefas = prisma.transicaoAgendamento.createMany.mock.calls[0][0].data;
    expect(tarefas.find((item: any) => item.tipo === 'AVISO').dataPrevista).toEqual(agora);
  });

  it('cancela tarefas se o estabelecimento desativou a automação', async () => {
    prisma.agendamento.findUnique.mockResolvedValue({
      ...(await prisma.agendamento.findUnique()),
      estabelecimento: {
        ...(await prisma.agendamento.findUnique()).estabelecimento,
        fluxoAtendimentoAutomaticoAtivo: false,
      },
    });

    const resultado = await service.programar(41);

    expect(resultado).toEqual({ criadas: 0, motivo: 'AUTOMACAO_INATIVA' });
    expect(prisma.transicaoAgendamento.createMany).not.toHaveBeenCalled();
  });
});
