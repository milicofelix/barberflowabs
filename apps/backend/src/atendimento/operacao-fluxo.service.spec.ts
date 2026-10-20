import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { OperacaoFluxoService } from './operacao-fluxo.service';

const config = { fluxoAtendimentoAutomaticoAtivo: true, inicioAtendimentoAutomaticoAtivo: true, finalizacaoAtendimentoAutomaticaAtiva: true, avisoAtendimentoAntecedenciaMinutos: 10 };
function cenario(overrides: Record<string, unknown> = {}) {
  const tx: any = {
    $queryRaw: jest.fn().mockResolvedValue([{ id: 3 }]), $executeRaw: jest.fn(),
    estabelecimento: { findUnique: jest.fn().mockResolvedValue(config), update: jest.fn().mockResolvedValue(config) },
    agendamento: { findFirst: jest.fn().mockResolvedValue({ id: 8, revisaoFluxo: 2, status: 'CONFIRMADO', automacaoAtendimentoAtiva: true, controleManualEm: null, estabelecimento: config, ...overrides }) },
    transicaoAgendamento: { findFirst: jest.fn().mockResolvedValue({ id: 7, agendamentoId: 8, revisaoFluxo: 2, tipo: 'INICIAR', tentativas: 5 }), updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    logAuditoria: { create: jest.fn() },
  };
  const prisma: any = { $transaction: jest.fn((cb) => cb(tx)) };
  const revisoes = { publicar: jest.fn() };
  return { tx, revisoes, service: new OperacaoFluxoService(prisma, revisoes as any) };
}
describe('Operação do fluxo por unidade', () => {
  it('recusa antecedência fora dos limites sem escrever', async () => {
    const { tx, service } = cenario();
    await expect(service.configurar(3, 9, { ...config, avisoAtendimentoAntecedenciaMinutos: 61 })).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.estabelecimento.update).not.toHaveBeenCalled();
  });
  it('salvar a mesma configuração não repete auditoria', async () => {
    const { tx, service } = cenario(); await service.configurar(3, 9, config);
    expect(tx.logAuditoria.create).not.toHaveBeenCalled();
  });
  it('reenfileira a mesma tarefa com CAS, revisão e tenant, sem retomar atendimento', async () => {
    const { tx, service } = cenario(); const agora = new Date('2026-10-15T13:00:00Z');
    await expect(service.reprocessar(3, 9, 7, agora)).resolves.toEqual({ reenfileirada: true, id: 7 });
    expect(tx.transicaoAgendamento.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ id: 7, estabelecimentoId: 3, status: 'FALHOU', revisaoFluxo: 2 }), data: expect.objectContaining({ status: 'AGENDADA', tentativas: 0, proximaTentativaEm: agora }) }));
    expect(tx.logAuditoria.create).toHaveBeenCalledTimes(1);
  });
  it.each([{ controleManualEm: new Date() }, { status: 'CONCLUIDO' }, { revisaoFluxo: 3 }, { estabelecimento: { ...config, fluxoAtendimentoAutomaticoAtivo: false } }])('recusa intervenção manual, terminal, revisão antiga e unidade desativada: %o', async (dados) => {
    const { tx, service } = cenario(dados);
    await expect(service.reprocessar(3, 9, 7)).rejects.toBeInstanceOf(ConflictException);
    expect(tx.transicaoAgendamento.updateMany).not.toHaveBeenCalled();
  });
  it('não reprocessa tarefa de outra unidade', async () => {
    const { tx, service } = cenario(); tx.transicaoAgendamento.findFirst.mockResolvedValue(null);
    await expect(service.reprocessar(3, 9, 7)).rejects.toBeInstanceOf(NotFoundException);
    expect(tx.transicaoAgendamento.findFirst).toHaveBeenCalledWith({ where: { id: 7, estabelecimentoId: 3 } });
  });
  it('repetição ou concorrência não duplica auditoria', async () => {
    const { tx, service } = cenario(); tx.transicaoAgendamento.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.reprocessar(3, 9, 7)).rejects.toBeInstanceOf(ConflictException);
    expect(tx.logAuditoria.create).not.toHaveBeenCalled();
  });
});
