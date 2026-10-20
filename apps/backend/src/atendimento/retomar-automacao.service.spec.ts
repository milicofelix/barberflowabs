import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { RetomarAutomacaoService } from './retomar-automacao.service';
import { ConflitoAgendaError } from 'src/motor-agenda/conflito-agenda.error';

const agora = new Date('2026-10-15T16:20:00.000Z');
function ambiente(alteracoes: Record<string, any> = {}) {
  const atual = {
    id: 17, estabelecimentoId: 3, profissionalId: 5, unidadeId: 1,
    status: 'ATRASADO', data: new Date('2026-10-15T16:00:00.000Z'), dataFim: new Date('2026-10-15T17:30:00.000Z'),
    iniciadoEm: null, automacaoAtendimentoAtiva: false, controleManualEm: agora, revisaoFluxo: 2,
    deslocamentoMinutos: 0, valorTotal: 150, modeloAtendimento: 'PRESENCIAL',
    estabelecimento: { fluxoAtendimentoAutomaticoAtivo: true, inicioAtendimentoAutomaticoAtivo: true, modeloAtendimento: 'PRESENCIAL' },
    itens: [{ duracaoMinutos: 90, preparoAntesMinutos: 10, preparoDepoisMinutos: 10 }],
    servicos: [{ id: 1, duracaoMinutos: 120 }],
    ...alteracoes,
  };
  const tx = {
    $queryRawUnsafe: jest.fn(),
    agendamento: { findFirst: jest.fn().mockResolvedValue(atual), updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    agendamentoRecurso: { deleteMany: jest.fn(), createMany: jest.fn() },
    transicaoAgendamento: { updateMany: jest.fn() }, logAuditoria: { create: jest.fn() },
  };
  const prisma = { $transaction: jest.fn((acao) => acao(tx)) };
  const disponibilidade = { verificar: jest.fn().mockResolvedValue([]) };
  const consulta = { validarHorarioFuncionamento: jest.fn() };
  const orquestrador = { programar: jest.fn() }; const revisao = { publicar: jest.fn() };
  const service = new RetomarAutomacaoService(prisma as any, disponibilidade as any, consulta as any, orquestrador as any, revisao as any);
  return { atual, tx, disponibilidade, consulta, orquestrador, revisao, service };
}

describe('Retomar automação do atendimento', () => {
  it('retoma atraso com duração comercial do snapshot sem preparação e cria nova revisão', async () => {
    const cenario = ambiente();
    await cenario.service.executar(17, 3, 11, agora);
    expect(cenario.tx.agendamento.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 17, estabelecimentoId: 3 } }));
    expect(cenario.tx.agendamento.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 17, estabelecimentoId: 3, status: 'ATRASADO', revisaoFluxo: 2 },
      data: expect.objectContaining({ status: 'CHECKIN', iniciadoEm: agora, dataFim: new Date('2026-10-15T17:50:00.000Z'), controleManualEm: null, controleManualPorId: null, automacaoAtendimentoAtiva: true, revisaoFluxo: { increment: 1 } }),
    }));
    expect(cenario.tx.transicaoAgendamento.updateMany).toHaveBeenCalled();
    expect(cenario.orquestrador.programar).toHaveBeenCalledWith(17, agora);
    expect(cenario.revisao.publicar).toHaveBeenCalledWith(3);
    expect(cenario.tx.logAuditoria.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ usuarioId: 11, acao: 'AGENDAMENTO_AUTOMACAO_RETOMADA' }) }));
  });
  it('preserva início efetivo quando iniciado manualmente', async () => {
    const cenario = ambiente({ status: 'CHECKIN', iniciadoEm: new Date('2026-10-15T16:10:00.000Z') });
    await cenario.service.executar(17, 3, 11, agora);
    expect(cenario.tx.agendamento.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ iniciadoEm: new Date('2026-10-15T16:10:00.000Z'), dataFim: new Date('2026-10-15T17:40:00.000Z') }) }));
  });
  it('não inicia antes do horário ao retomar um atraso futuro', async () => {
    const cenario = ambiente({ data: new Date('2026-10-15T18:00:00.000Z') });
    await cenario.service.executar(17, 3, 11, agora);
    expect(cenario.tx.agendamento.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: 'CONFIRMADO', iniciadoEm: null, dataFim: new Date('2026-10-15T19:30:00.000Z') }) }));
  });
  it('repetir retomada já aplicada não duplica revisão ou auditoria', async () => {
    const cenario = ambiente({ status: 'CHECKIN', automacaoAtendimentoAtiva: true, controleManualEm: null });
    await cenario.service.executar(17, 3, 11, agora);
    expect(cenario.tx.agendamento.updateMany).not.toHaveBeenCalled();
    expect(cenario.tx.logAuditoria.create).not.toHaveBeenCalled();
    expect(cenario.orquestrador.programar).toHaveBeenCalled();
  });
  it.each(['CONCLUIDO', 'CANCELADO', 'NO_SHOW'])('não reabre estado terminal %s', async (status) => {
    const cenario = ambiente({ status });
    await expect(cenario.service.executar(17, 3, 11, agora)).rejects.toBeInstanceOf(BadRequestException);
    expect(cenario.tx.agendamento.updateMany).not.toHaveBeenCalled();
  });
  it('não altera outro tenant ou atendimento inexistente', async () => {
    const cenario = ambiente(); cenario.tx.agendamento.findFirst.mockResolvedValue(null);
    await expect(cenario.service.executar(17, 7, 11, agora)).rejects.toBeInstanceOf(NotFoundException);
    expect(cenario.tx.agendamento.updateMany).not.toHaveBeenCalled();
  });
  it('não ativa a configuração global da unidade implicitamente', async () => {
    const cenario = ambiente({ estabelecimento: { fluxoAtendimentoAutomaticoAtivo: false } });
    await expect(cenario.service.executar(17, 3, 11, agora)).rejects.toBeInstanceOf(BadRequestException);
    expect(cenario.tx.agendamento.updateMany).not.toHaveBeenCalled();
  });
  it('recusa período conflitante sem aplicar nova revisão', async () => {
    const cenario = ambiente(); cenario.disponibilidade.verificar.mockRejectedValue(new ConflitoAgendaError('Profissional indisponível'));
    await expect(cenario.service.executar(17, 3, 11, agora)).rejects.toBeInstanceOf(ConflictException);
    expect(cenario.tx.agendamento.updateMany).not.toHaveBeenCalled();
    expect(cenario.orquestrador.programar).not.toHaveBeenCalled();
  });
  it('recusa uma atualização concorrente antes de modificar as reservas', async () => {
    const cenario = ambiente(); cenario.tx.agendamento.updateMany.mockResolvedValue({ count: 0 });
    await expect(cenario.service.executar(17, 3, 11, agora)).rejects.toBeInstanceOf(ConflictException);
    expect(cenario.tx.agendamentoRecurso.deleteMany).not.toHaveBeenCalled();
    expect(cenario.orquestrador.programar).not.toHaveBeenCalled();
  });
});
