import { OrquestradorAtendimentoService } from './orquestrador-atendimento.service';

describe('Aviso operacional sob lock', () => {
  it('não repete aviso quando outro worker já concluiu a tarefa', async () => {
    const tx = { $queryRaw: jest.fn().mockResolvedValueOnce([{ fluxoAtendimentoAutomaticoAtivo: true }]).mockResolvedValueOnce([{ revisaoFluxo: 1, automacaoAtendimentoAtiva: true, controleManualEm: null, status: 'CONFIRMADO', data: new Date('2026-10-15T14:00:00Z') }]).mockResolvedValueOnce([{ status: 'PROCESSADA', bloqueadoPor: null }]), notificacaoUsuario: { create: jest.fn() } };
    const service = new OrquestradorAtendimentoService({ $transaction: jest.fn((cb) => cb(tx)) } as any);
    await service.notificar({ id: 1, agendamentoId: 8, estabelecimentoId: 3, revisaoFluxo: 1, bloqueadoPor: 'worker-1', destinatarioUsuarioId: 9 }, { data: new Date('2026-10-15T14:00:00Z') }, new Date('2026-10-15T13:50:00Z'));
    expect(tx.notificacaoUsuario.create).not.toHaveBeenCalled();
    expect(service.obterMetricas().notificacoes).toBe(0);
  });
});
