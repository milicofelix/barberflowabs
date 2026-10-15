import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { validarPrograma, validarCupom, liquidoCentavos } from './fidelidade.dto';
import { CarteiraFidelidadeRepository } from './carteira-fidelidade.repository';
import { BeneficioFidelidadeRepository } from './beneficio-fidelidade.repository';
import { LiquidacaoFidelidadeService } from './liquidacao-fidelidade.service';
import { validarIdentidadesIndicacao } from './indicacao-fidelidade.repository';
import { FidelidadeController } from './fidelidade.controller';
import { FinanceiroRepository } from 'src/financeiro/financeiro.repository';

const programa = { ativo: true, centavosPorPonto: 100, validadeDias: 365, bonusIndicacao: 30, minimoIndicacaoCentavos: 1000, niveis: [{ nome: 'Inicial', pontos: 0 }, { nome: 'Prata', pontos: 100 }] };
const agora = new Date('2026-10-15T15:00:00Z');
const executar = (tx: any) => ({ $transaction: jest.fn((cb) => cb(tx)) }) as any;

describe('Contratos de fidelidade', () => {
  it('impede regra sem validade, níveis repetidos e divisão por zero', () => {
    expect(() => validarPrograma({ ...programa, centavosPorPonto: 0 })).toThrow(BadRequestException);
    expect(() => validarPrograma({ ...programa, validadeDias: 0 })).toThrow(BadRequestException);
    expect(() => validarPrograma({ ...programa, niveis: [{ nome: 'A', pontos: 0 }, { nome: 'B', pontos: 0 }] })).toThrow(BadRequestException);
    expect(validarPrograma(programa)).toEqual(programa);
  });
  it('valida período e limites do cupom sem aceitar elegibilidade arbitrária', () => {
    const cupom = { codigo: 'bemvindo', descontoCentavos: 1000, inicio: '2026-10-15T00:00:00Z', fim: '2026-11-01T00:00:00Z', limiteTotal: 10, limitePorCliente: 1, minimoCentavos: 1000, ativo: true };
    expect(validarCupom(cupom).codigo).toBe('BEMVINDO');
    expect(() => validarCupom({ ...cupom, limiteTotal: 0 })).toThrow(BadRequestException);
    expect(() => validarCupom({ ...cupom, fim: cupom.inicio })).toThrow(BadRequestException);
    expect(() => validarCupom({ ...cupom, elegibilidade: { tenantId: 9 } as any })).toThrow(BadRequestException);
  });
  it('calcula líquido em centavos incluindo desconto integral', () => {
    expect(liquidoCentavos({ valorTotal: 150 }, 2000)).toBe(13000);
    expect(liquidoCentavos({ valorTotal: 150 }, 15000)).toBe(0);
    expect(liquidoCentavos({ valorTotal: 0, servicos: [{ preco: 25 }] }, 500)).toBe(2000);
  });
});

describe('Extrato imutável por lotes', () => {
  it('consulta somente lotes válidos e desconta consumos sem alterar o crédito', async () => {
    const tx = { movimentoFidelidade: { findMany: jest.fn().mockResolvedValue([{ id: 1, pontos: 100, expiraEm: new Date('2027-01-01'), consumos: [{ pontos: -30 }, { pontos: 10 }] }]) } };
    const carteira = new CarteiraFidelidadeRepository({} as any);
    expect(await carteira.lotes(tx, 3, agora)).toEqual([{ id: 1, expiraEm: new Date('2027-01-01'), saldo: 80 }]);
    expect(tx.movimentoFidelidade.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ clienteId: 3, expiraEm: { gt: agora } }), orderBy: [{ expiraEm: 'asc' }, { id: 'asc' }] }));
  });
  it('consome lotes pela validade e recusa saldo insuficiente antes de gravar', async () => {
    const carteira = new CarteiraFidelidadeRepository({} as any);
    jest.spyOn(carteira, 'lotes').mockResolvedValue([{ id: 2, saldo: 30, expiraEm: new Date('2027-01-01') }, { id: 3, saldo: 50, expiraEm: new Date('2027-02-01') }] as any);
    const tx = { movimentoFidelidade: { create: jest.fn() } };
    await carteira.debitar(tx, 8, 60, 9, agora);
    expect(tx.movimentoFidelidade.create.mock.calls.map(([d]) => d.data.pontos)).toEqual([-30, -30]);
    tx.movimentoFidelidade.create.mockClear();
    await expect(carteira.debitar(tx, 8, 90, 10, agora)).rejects.toThrow(ConflictException);
    expect(tx.movimentoFidelidade.create).not.toHaveBeenCalled();
  });
  it('estorno cria lançamento compensatório referenciando o mesmo lote', async () => {
    const tx = { movimentoFidelidade: { findMany: jest.fn().mockResolvedValue([{ id: 7, clienteId: 4, creditoId: 2, pontos: -30 }]), create: jest.fn() } };
    await new CarteiraFidelidadeRepository({} as any).estornar(tx, { id: 9 });
    expect(tx.movimentoFidelidade.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ creditoId: 2, pontos: 30, tipo: 'ESTORNO', chave: 'estorno:7' }) }));
  });
  it('recusa cliente de outro estabelecimento', async () => {
    const tx = { clienteEstabelecimento: { findFirst: jest.fn().mockResolvedValue(null) } };
    await expect(new CarteiraFidelidadeRepository({} as any).cliente(tx, 3, 999)).rejects.toThrow(NotFoundException);
    expect(tx.clienteEstabelecimento.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 999, estabelecimentoId: 3, status: 'ATIVO' } }));
  });
});

describe('Resgate e idempotência', () => {
  it('repetição retorna o benefício sem debitar pontos novamente e rejeita troca de payload', async () => {
    const beneficio = { id: 8, agendamentoId: 2, recompensaId: 4, snapshot: { codigoCupom: null } };
    const tx = { $queryRaw: jest.fn(), agendamento: { findFirst: jest.fn().mockResolvedValue({ id: 2 }) }, beneficioFidelidade: { findUnique: jest.fn().mockResolvedValue(beneficio) } };
    const carteiras = { debitar: jest.fn() } as any;
    const repo = new BeneficioFidelidadeRepository(executar(tx), carteiras, { bloquearPrograma: jest.fn().mockResolvedValue(programa) } as any);
    await expect(repo.aplicar(1, 5, 2, { chaveIdempotencia: 'abc', recompensaId: 4 })).resolves.toBe(beneficio);
    expect(carteiras.debitar).not.toHaveBeenCalled();
    await expect(repo.aplicar(1, 5, 2, { chaveIdempotencia: 'abc', recompensaId: 9 })).rejects.toThrow(ConflictException);
  });
  it('limite global de cupom inclui reservas ainda não concluídas', async () => {
    const a = { id: 2, usuarioId: 9, estabelecimentoId: 1, status: 'AGENDADO', valorTotal: 100, contasFinanceiras: [], servicos: [] };
    const tx = { $queryRaw: jest.fn(), agendamento: { findFirst: jest.fn().mockResolvedValue(a) }, clienteEstabelecimento: { findUnique: jest.fn().mockResolvedValue({ id: 5, status: 'ATIVO' }) }, beneficioFidelidade: { findUnique: jest.fn().mockResolvedValue(null), findFirst: jest.fn().mockResolvedValue(null), count: jest.fn().mockResolvedValue(1), create: jest.fn() }, cupomFidelidade: { findFirst: jest.fn().mockResolvedValue({ id: 3, inicio: new Date('2000-01-01'), fim: new Date('2100-01-01'), minimoCentavos: 0, descontoCentavos: 1000, elegibilidade: {}, limiteTotal: 1, limitePorCliente: 1 }) } };
    const repo = new BeneficioFidelidadeRepository(executar(tx), { bloquear: jest.fn() } as any, { bloquearPrograma: jest.fn().mockResolvedValue(programa) } as any);
    await expect(repo.aplicar(1, 5, 2, { chaveIdempotencia: 'cupom', codigoCupom: 'BEMVINDO' })).rejects.toThrow(ConflictException);
    expect(tx.beneficioFidelidade.create).not.toHaveBeenCalled();
  });
});

describe('Conclusão integrada', () => {
  function cenario(ativo = true) {
    const tx: any = { $queryRaw: jest.fn(), liquidacaoFidelidade: { findUnique: jest.fn().mockResolvedValue(null), create: jest.fn() }, programaFidelidade: { findUnique: jest.fn().mockResolvedValue({ ...programa, ativo }) }, beneficioFidelidade: { findFirst: jest.fn().mockResolvedValue({ id: 9, descontoCentavos: 2000 }), update: jest.fn() }, clienteEstabelecimento: { findUnique: jest.fn().mockResolvedValue({ id: 3, status: 'ATIVO' }) }, indicacaoFidelidade: { findUnique: jest.fn().mockResolvedValue(null) }, logAuditoria: { create: jest.fn() } };
    const carteira = { bloquear: jest.fn(), creditar: jest.fn() } as any;
    const beneficio = { cancelarNaTransacao: jest.fn() } as any;
    return { tx, carteira, beneficio, service: new LiquidacaoFidelidadeService(carteira, beneficio) };
  }
  const a = { id: 2, estabelecimentoId: 1, usuarioId: 8, valorTotal: 150, status: 'CONCLUIDO' };
  it('crédito usa somente valor líquido e repetição não concede outro ganho', async () => {
    const c = cenario(); await c.service.aplicar(c.tx, a, 5, agora);
    expect(c.carteira.creditar).toHaveBeenCalledWith(c.tx, 3, 130, 'ganho:agendamento:2', 'GANHO', 365, expect.objectContaining({ liquidoCentavos: 13000 }), agora);
    c.tx.liquidacaoFidelidade.findUnique.mockResolvedValue({ agendamentoId: 2 });
    await c.service.aplicar(c.tx, a, 5, agora);
    expect(c.carteira.creditar).toHaveBeenCalledTimes(1);
  });
  it('programa inativo não concede pontos mas honra desconto reservado', async () => {
    const c = cenario(false); await c.service.aplicar(c.tx, a, 5, agora);
    expect(c.carteira.creditar).not.toHaveBeenCalled();
    expect(c.tx.liquidacaoFidelidade.create).toHaveBeenCalledWith({ data: { agendamentoId: 2, liquidoCentavos: 13000, pontos: 0 } });
  });
  it('cancelamento e ausência delegam estorno e não geram crédito', async () => {
    const c = cenario(); await c.service.aplicar(c.tx, { ...a, status: 'CANCELADO' }, 5, agora);
    expect(c.beneficio.cancelarNaTransacao).toHaveBeenCalled();
    expect(c.tx.liquidacaoFidelidade.create).not.toHaveBeenCalled();
  });
  it.each([13000, 0])('receita respeita líquido congelado de %s centavos', async (centavos) => {
    const tx = { $queryRaw: jest.fn(), liquidacaoFidelidade: { findUnique: jest.fn().mockResolvedValue({ liquidoCentavos: centavos }) }, contaFinanceira: { findUnique: jest.fn().mockResolvedValue(null), create: jest.fn() }, logAuditoria: { create: jest.fn() } };
    await new FinanceiroRepository(executar(tx)).registrarReceitaAgendamento(1, 5, { ...a, servicos: [{ preco: 150 }] });
    if (centavos) expect(tx.contaFinanceira.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ valorOriginal: 130 }) }));
    else expect(tx.contaFinanceira.create).not.toHaveBeenCalled();
  });
});

describe('Identidade e autorização', () => {
  it('recusa autoindicação inclusive telefone com formatação diferente', () => {
    const cliente = (id, telefone) => ({ usuario: { id, telefone, email: `${id}@example.test`, papel: 'CUSTOMER' } });
    expect(() => validarIdentidadesIndicacao(cliente(1, '(11) 99999-1234'), cliente(2, '+55 11 99999-1234'))).toThrow(ConflictException);
    expect(() => validarIdentidadesIndicacao(cliente(1, ''), cliente(2, '11999991234'))).toThrow(ConflictException);
  });
  it('perfil sem permissão não chega ao repositório', async () => {
    const programas = { salvar: jest.fn() } as any;
    const controller = new FidelidadeController(programas, {} as any, {} as any, {} as any, { validarPermissao: jest.fn().mockRejectedValue(new ForbiddenException()) } as any);
    await expect(controller.salvar({ id: 3, estabelecimentoId: 8 } as any, programa)).rejects.toThrow(ForbiddenException);
    expect(programas.salvar).not.toHaveBeenCalled();
  });
});
