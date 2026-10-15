import { FinanceiroRepository } from './financeiro.repository';
import { ComissaoService } from './comissao.service';
import { chaveComissao } from './financeiro.constants';

describe('Aceite financeiro do fluxo de atendimento (isolado)', () => {
  it('repetição da conclusão reaproveita a conta sem repetir receita ou auditoria', async () => {
    let conta: any = null;
    const tx = { contaFinanceira: { findUnique: jest.fn(async () => conta), create: jest.fn(async ({ data }) => (conta = { id: 12, ...data })) }, logAuditoria: { create: jest.fn() } };
    const repo = new FinanceiroRepository({ $transaction: jest.fn((cb) => cb(tx)) } as any);
    const reserva = { id: 6, valorTotal: 150, data: new Date('2026-10-15T13:00:00Z'), servicos: [] };
    await repo.registrarReceitaAgendamento(3, null, reserva);
    await repo.registrarReceitaAgendamento(3, 9, reserva);
    expect(tx.contaFinanceira.create).toHaveBeenCalledTimes(1);
    expect(tx.logAuditoria.create).toHaveBeenCalledTimes(1);
    expect(conta).toMatchObject({ estabelecimentoId: 3, agendamentoId: 6, tipo: 'RECEBER', valorOriginal: 150 });
  });
  it('comissão respeita profissional/serviço, serviço, profissional e padrão', () => {
    const service = new ComissaoService();
    const regras = [
      { chave: chaveComissao(), percentual: 10, ativo: true },
      { chave: chaveComissao(4), percentual: 20, ativo: true },
      { chave: chaveComissao(null, 2), percentual: 30, ativo: true },
      { chave: chaveComissao(4, 2), percentual: 40, ativo: true },
    ];
    expect(service.percentual(regras, 4, 2)).toBe(40);
    expect(service.percentual(regras, 5, 2)).toBe(30);
    expect(service.percentual(regras, 4, 3)).toBe(20);
    expect(service.percentual(regras, 5, 3)).toBe(10);
    expect(service.percentual([], 5, 3)).toBe(0);
  });
});
