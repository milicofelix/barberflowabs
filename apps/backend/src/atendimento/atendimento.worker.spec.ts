import { AtendimentoWorker } from './atendimento.worker';

describe('AtendimentoWorker', () => {
  const agora = new Date('2026-10-14T16:00:00.000Z');
  let orquestrador: any;
  let fluxo: any;
  let worker: AtendimentoWorker;

  beforeEach(() => {
    orquestrador = {
      reconciliar: jest.fn().mockResolvedValue({ verificadas: 0, criadas: 0 }),
      reivindicarProxima: jest.fn()
        .mockResolvedValueOnce({
          id: 1, agendamentoId: 41, estabelecimentoId: 7, tipo: 'INICIAR', tentativas: 1,
        })
        .mockResolvedValueOnce(null),
      validarTarefa: jest.fn().mockResolvedValue({ valida: true, agendamento: { id: 41 } }),
      concluirTarefa: jest.fn(),
      cancelarTarefa: jest.fn(),
      registrarFalha: jest.fn(),
      notificar: jest.fn(),
      obterMetricas: jest.fn().mockReturnValue({ processadas: 1 }),
    };
    fluxo = { alterarAutomatico: jest.fn().mockResolvedValue({ id: 41, status: 'CHECKIN' }) };
    worker = new AtendimentoWorker(orquestrador, fluxo);
  });

  it('inicia atendimento vencido pelo serviço único de domínio', async () => {
    const resultado = await worker.processarLote(10, agora);

    expect(resultado).toEqual({ processadas: 1, ocupado: false });
    expect(fluxo.alterarAutomatico).toHaveBeenCalledWith(41, 7, 'CHECKIN', agora);
    expect(orquestrador.concluirTarefa).toHaveBeenCalledWith(1, agora);
  });

  it('cancela tarefa obsoleta sem alterar o agendamento', async () => {
    orquestrador.validarTarefa.mockResolvedValue({ valida: false, motivo: 'REVISAO_OBSOLETA' });

    await worker.processarLote(10, agora);

    expect(orquestrador.cancelarTarefa).toHaveBeenCalledWith(1, 'REVISAO_OBSOLETA', agora);
    expect(fluxo.alterarAutomatico).not.toHaveBeenCalled();
  });

  it('registra retentativa para falha de infraestrutura', async () => {
    fluxo.alterarAutomatico.mockRejectedValue(Object.assign(new Error('database unavailable'), { code: 'P1001' }));
    orquestrador.registrarFalha.mockResolvedValue({ excedeu: false, esperaSegundos: 5 });

    await worker.processarLote(10, agora);

    expect(orquestrador.registrarFalha).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1 }), 'Error:P1001', 5, agora,
    );
  });
});
