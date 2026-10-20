import { CentralRelacionamentoStore } from '../../../../packages/core/src/relacionamento/central-store';
import { acoesRegistroRelacionamento, formularioClienteRelacionamento, formularioPreferenciaRelacionamento, formulariosBeneficioRelacionamento, formulariosRelacionamento, instanteLocalRelacionamento, prepararFormularioRelacionamento, valoresFormularioRelacionamento } from '../../../../packages/core/src/relacionamento/central';

describe('Contratos compartilhados da central web e mobile', () => {
  it('conserva origem do consentimento e registra somente o canal escolhido', () => {
    const form = formularioPreferenciaRelacionamento(13, 'EMAIL');
    expect(prepararFormularioRelacionamento(form, { consentido: 'false', versaoTermos: '2026-10' }, 'EMAIL')).toEqual({ preferencias: [{ canal: 'EMAIL', consentido: false, origem: 'ESTABELECIMENTO', versaoTermos: '2026-10' }] });
    expect(form.confirmar).toBeTruthy();
  });
  it('permite limpar tags e observações sem escolher tenant no payload', () => {
    const payload = prepararFormularioRelacionamento(formularioClienteRelacionamento({ id: 13 }), { status: 'ATIVO', tags: '', observacoes: '' });
    expect(payload).toEqual({ status: 'ATIVO', tags: [], observacoes: null });
  });
  it('filtra templates de campanha ativos e recusa seleção inexistente', () => {
    const form = formulariosRelacionamento('campanhas', [], [{ id: 1, nome: 'Marketing', evento: 'CAMPANHA', ativo: true }, { id: 2, evento: 'LEMBRETE_AGENDAMENTO', ativo: true }, { id: 3, evento: 'CAMPANHA', ativo: false }])[0]!;
    expect(form.campos.find(c => c.chave === 'templateId')?.opcoes?.map(o => o.valor)).toEqual(['1']);
    expect(() => prepararFormularioRelacionamento(form, { ...valoresFormularioRelacionamento(form), nome: 'Campanha', templateId: '2' })).toThrow();
  });
  it('expõe ações somente nos estados válidos, sem reprocessar campanha como envio avulso', () => {
    expect(acoesRegistroRelacionamento('campanhas', { id: 1, status: 'CONCLUIDA' })).toEqual([]);
    expect(acoesRegistroRelacionamento('campanhas', { id: 1, status: 'PAUSADA' })[0]?.titulo).toBe('Retomar campanha');
    expect(acoesRegistroRelacionamento('envios', { id: 2, campanhaId: 1, status: 'FILA_MORTA' })).toEqual([]);
  });
  it('mantém a chave do benefício entre tentativas do mesmo formulário', () => {
    const form = formulariosBeneficioRelacionamento()[1]!;
    const valores = { ...valoresFormularioRelacionamento(form), _agendamentoId: '50', codigoCupom: 'PROMO' };
    expect(prepararFormularioRelacionamento(form, valores)).toEqual(prepararFormularioRelacionamento(form, valores));
    expect(prepararFormularioRelacionamento(form, valores).chaveIdempotencia).toBeTruthy();
  });
  it('converte horário local sem depender do parser de datas da plataforma e rejeita datas inexistentes', () => {
    expect(new Date(instanteLocalRelacionamento('2026-10-15T11:00')).getHours()).toBe(11);
    expect(() => instanteLocalRelacionamento('2026-02-31T11:00')).toThrow();
    expect(() => instanteLocalRelacionamento('15/10/2026 11h')).toThrow();
  });
});

describe('Estado da central por sessão', () => {
  const api = (permissoes: string[]) => ({ get: jest.fn(async (caminho: string): Promise<unknown> => caminho === '/equipe/minhas-permissoes' ? permissoes : []), post: jest.fn(async () => ({})), put: jest.fn(async () => ({})) });
  it('não carrega clientes sem permissão de leitura', async () => {
    const transporte = api([]); const store = new CentralRelacionamentoStore(transporte);
    await store.iniciar();
    expect(transporte.get.mock.calls).toEqual([['/equipe/minhas-permissoes']]);
    expect(store.snapshot().itens).toEqual([]);
  });
  it('não altera dados com acesso somente de leitura', async () => {
    const transporte = api(['RELACIONAMENTO_VISUALIZAR']); const store = new CentralRelacionamentoStore(transporte);
    await store.iniciar();
    expect(await store.salvar(formularioClienteRelacionamento({ id: 10 }), { status: 'ATIVO', tags: '', observacoes: '' })).toBe(false);
    expect(transporte.put).not.toHaveBeenCalled();
  });
  it('impede benefício sem permissão de agenda', async () => {
    const transporte = api(['RELACIONAMENTO_VISUALIZAR', 'RELACIONAMENTO_GERENCIAR']); const store = new CentralRelacionamentoStore(transporte);
    await store.iniciar();
    const form = formulariosBeneficioRelacionamento()[1]!;
    expect(await store.salvar(form, { ...valoresFormularioRelacionamento(form), _agendamentoId: '2', codigoCupom: 'PROMO' })).toBe(false);
    expect(transporte.post).not.toHaveBeenCalled();
  });
  it('conserva registros quando uma atualização falha', async () => {
    const transporte = api(['RELACIONAMENTO_VISUALIZAR']); const store = new CentralRelacionamentoStore(transporte);
    transporte.get.mockImplementation(async caminho => caminho === '/equipe/minhas-permissoes' ? ['RELACIONAMENTO_VISUALIZAR'] : [{ id: 10, usuario: { nome: 'Cliente' } }]);
    await store.iniciar();
    transporte.get.mockRejectedValue(new Error('Servidor indisponível'));
    await store.carregar();
    expect(store.snapshot().itens[0]?.id).toBe(10);
    expect(store.snapshot().erro).toBe('Servidor indisponível');
  });
  it('ignora resultado de consulta encerrada na troca de sessão', async () => {
    const transporte = api(['RELACIONAMENTO_VISUALIZAR']); const store = new CentralRelacionamentoStore(transporte);
    await store.iniciar();
    let resolver!: (valor: unknown) => void;
    transporte.get.mockImplementation(() => new Promise(resolve => { resolver = resolve; }));
    const pendente = store.carregar(); store.encerrar(); resolver([{ id: 99 }]); await pendente;
    expect(store.snapshot().itens).toEqual([]);
  });
});
