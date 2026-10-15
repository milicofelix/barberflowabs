import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { FluxoAtendimentoService } from './fluxo-atendimento.service';

function agendamento(overrides: Record<string, any> = {}) {
  return {
    id: 17,
    estabelecimentoId: 3,
    usuarioId: 8,
    status: 'CONFIRMADO',
    data: new Date('2026-10-14T16:00:00.000Z'),
    dataFim: new Date('2026-10-14T17:30:00.000Z'),
    automacaoAtendimentoAtiva: true,
    controleManualEm: null,
    controleManualPorId: null,
    iniciadoEm: null,
    finalizadoEm: null,
    revisaoFluxo: 1,
    servicos: [{ id: 2, nome: 'Limpeza de pele', preco: 150, qtdeSlots: 3 }],
    usuario: { id: 8, nome: 'Cliente' },
    profissional: { id: 5, nome: 'Profissional' },
    ...overrides,
  };
}

function criarCenario(atual = agendamento(), depois?: any) {
  const tx = {
    $queryRaw: jest.fn().mockResolvedValue([{ fluxoAtendimentoAutomaticoAtivo: true, inicioAtendimentoAutomaticoAtivo: true, finalizacaoAtendimentoAutomaticaAtiva: true }]),
    agendamento: {
      findFirst: jest.fn().mockResolvedValue(atual),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      findUnique: jest.fn().mockResolvedValue(depois ?? { ...atual, status: 'CHECKIN' }),
    },
    transicaoAgendamento: { updateMany: jest.fn().mockResolvedValue({ count: 2 }) },
    logAuditoria: { create: jest.fn().mockResolvedValue({ id: 1 }) },
  };
  const prisma = {
    $transaction: jest.fn((callback: any) => callback(tx)),
    envioComunicacao: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
  } as any;
  const financeiro = { registrarReceitaAgendamento: jest.fn() } as any;
  const atualizacoes = { publicar: jest.fn() } as any;
  const fidelidade = { aplicar: jest.fn() } as any;
  return {
    tx, prisma, financeiro, atualizacoes, fidelidade,
    service: new FluxoAtendimentoService(prisma, financeiro, atualizacoes, fidelidade),
  };
}

describe('FluxoAtendimentoService', () => {
  const agora = new Date('2026-10-14T16:00:00.000Z');

  it('revalida a configuração sob lock antes de uma transição automática', async () => {
    const cenario = criarCenario();
    cenario.tx.$queryRaw.mockResolvedValue([{ fluxoAtendimentoAutomaticoAtivo: false }]);
    await expect(cenario.service.alterarAutomatico(17, 3, 'CHECKIN', agora)).rejects.toBeInstanceOf(ConflictException);
    expect(cenario.tx.agendamento.updateMany).not.toHaveBeenCalled();
  });

  it('assume controle manual, inicia o atendimento e cancela transições pendentes', async () => {
    const cenario = criarCenario();

    await cenario.service.alterar({
      agendamentoId: 17,
      estabelecimentoId: 3,
      status: 'CHECKIN',
      origem: 'MANUAL',
      usuarioId: 11,
      agora,
    });

    expect(cenario.tx.agendamento.updateMany).toHaveBeenCalledWith({
      where: { id: 17, estabelecimentoId: 3, status: 'CONFIRMADO', revisaoFluxo: 1 },
      data: {
        status: 'CHECKIN',
        automacaoAtendimentoAtiva: false,
        controleManualEm: agora,
        controleManualPorId: 11,
        iniciadoEm: agora,
      },
    });
    expect(cenario.tx.transicaoAgendamento.updateMany).toHaveBeenCalled();
    expect(cenario.tx.logAuditoria.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        usuarioId: 11,
        entidadeId: '17',
        detalhes: expect.objectContaining({ anterior: 'CONFIRMADO', novo: 'CHECKIN', origem: 'MANUAL' }),
      }),
    }));
    expect(cenario.atualizacoes.publicar).toHaveBeenCalledWith(3);
  });

  it('impede a automação quando alguém assumiu o controle manual', async () => {
    const cenario = criarCenario(agendamento({
      status: 'CHECKIN',
      automacaoAtendimentoAtiva: false,
      controleManualEm: new Date('2026-10-14T16:01:00.000Z'),
    }));

    await expect(cenario.service.alterarAutomatico(17, 3, 'CONCLUIDO', agora))
      .rejects.toBeInstanceOf(ConflictException);
    expect(cenario.tx.agendamento.updateMany).not.toHaveBeenCalled();
  });

  it('inicia automaticamente no horário sem assumir controle manual', async () => {
    const cenario = criarCenario();

    await cenario.service.alterarAutomatico(17, 3, 'CHECKIN', agora);

    expect(cenario.tx.agendamento.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: { status: 'CHECKIN', iniciadoEm: agora },
    }));
    expect(cenario.tx.transicaoAgendamento.updateMany).not.toHaveBeenCalled();
  });

  it('não inicia automaticamente antes do horário', async () => {
    const cenario = criarCenario(agendamento({ data: new Date('2026-10-14T16:01:00.000Z') }));

    await expect(cenario.service.alterarAutomatico(17, 3, 'CHECKIN', agora))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(cenario.tx.agendamento.updateMany).not.toHaveBeenCalled();
  });

  it('isola o tenant e não altera agendamento de outro estabelecimento', async () => {
    const cenario = criarCenario(null as any);
    cenario.tx.agendamento.findFirst.mockResolvedValue(null);

    await expect(cenario.service.alterarManual(17, 99, 'CHECKIN', 11))
      .rejects.toBeInstanceOf(NotFoundException);
    expect(cenario.tx.agendamento.updateMany).not.toHaveBeenCalled();
  });

  it('detecta uma alteração concorrente com destino diferente', async () => {
    const cenario = criarCenario();
    cenario.tx.agendamento.updateMany.mockResolvedValue({ count: 0 });
    cenario.tx.agendamento.findFirst
      .mockResolvedValueOnce(agendamento())
      .mockResolvedValueOnce(agendamento({ status: 'CANCELADO' }));

    await expect(cenario.service.alterarManual(17, 3, 'CHECKIN', 11))
      .rejects.toBeInstanceOf(ConflictException);
    expect(cenario.tx.logAuditoria.create).not.toHaveBeenCalled();
  });

  it('conclui uma vez e delega a receita ao financeiro idempotente', async () => {
    const atual = agendamento({ status: 'CHECKIN', iniciadoEm: new Date('2026-10-14T16:00:00.000Z') });
    const finalizado = agendamento({ status: 'CONCLUIDO', finalizadoEm: agora });
    const cenario = criarCenario(atual, finalizado);

    await cenario.service.alterarManual(17, 3, 'CONCLUIDO', 11);

    expect(cenario.financeiro.registrarReceitaAgendamento)
      .toHaveBeenCalledWith(3, 11, finalizado);
    expect(cenario.tx.agendamento.updateMany).toHaveBeenCalledTimes(1);
    expect(cenario.fidelidade.aplicar).toHaveBeenCalledWith(cenario.tx, finalizado, 11, expect.any(Date));
  });

  it('repete somente o efeito idempotente quando a conclusão já foi persistida', async () => {
    const finalizado = agendamento({ status: 'CONCLUIDO', finalizadoEm: agora });
    const cenario = criarCenario(finalizado);

    await cenario.service.alterarManual(17, 3, 'CONCLUIDO', 11);

    expect(cenario.tx.agendamento.updateMany).not.toHaveBeenCalled();
    expect(cenario.tx.logAuditoria.create).not.toHaveBeenCalled();
    expect(cenario.financeiro.registrarReceitaAgendamento)
      .toHaveBeenCalledWith(3, 11, finalizado);
    expect(cenario.fidelidade.aplicar).not.toHaveBeenCalled();
  });

  it('não permite registrar ausência antes do horário', async () => {
    const cenario = criarCenario(agendamento({ data: new Date('2026-10-14T17:00:00.000Z') }));

    await expect(cenario.service.alterar({
      agendamentoId: 17,
      estabelecimentoId: 3,
      status: 'NO_SHOW',
      origem: 'MANUAL',
      usuarioId: 11,
      agora,
    })).rejects.toBeInstanceOf(BadRequestException);
  });
});
