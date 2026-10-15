import { ControladorTour } from '../../../../packages/core/src/tour/ControladorTour';
import { TOUR_MAPA, lerEstadoTour, type DefinicaoTour, type PersistenciaTour, type EventoTour } from '../../../../packages/core/src/tour/contratos';
import { RegistroAlvosTour, alvoVisivelTour } from '../../../mobile/src/data/tour/alvos';

const agora = () => '2026-10-15T18:00:00.000Z';
function memoria(inicial: string | null = null) {
  let salvo = inicial;
  const adapter: PersistenciaTour = {
    ler: jest.fn(async () => salvo),
    salvar: jest.fn(async (_chave, valor) => { salvo = valor; }),
  };
  return { adapter, valor: () => salvo };
}
const estadoSalvo = (status = 'EM_ANDAMENTO', passoAtual = 2, versao = 1) => JSON.stringify({ status, passoAtual, versao, atualizadoEm: agora() });

describe('Fundação do tour do mapa', () => {
  it('aguarda hidratação e inicia uma única apresentação automática', async () => {
    const { adapter } = memoria(); const tour = new ControladorTour(TOUR_MAPA, adapter, agora);
    expect(tour.iniciar(true)).toBe(false);
    await tour.carregar();
    expect(tour.iniciar(true)).toBe(true);
    expect(tour.iniciar(true)).toBe(false);
    expect(tour.obterSnapshot().estado).toMatchObject({ status: 'EM_ANDAMENTO', passoAtual: 0 });
  });
  it('avança, volta, ignora retorno antes do primeiro e conclui no último', async () => {
    const { adapter } = memoria(); const tour = new ControladorTour(TOUR_MAPA, adapter, agora);
    await tour.carregar(); tour.iniciar(); tour.voltar();
    expect(tour.obterSnapshot().estado.passoAtual).toBe(0);
    tour.avancar(); tour.avancar(); tour.voltar();
    expect(tour.obterSnapshot().estado.passoAtual).toBe(1);
    for (let i = 0; i < TOUR_MAPA.passos.length; i++) tour.avancar();
    expect(tour.obterSnapshot()).toMatchObject({ aberto: false, estado: { status: 'CONCLUIDO' } });
    await tour.aguardarPersistencia();
  });
  it.each(['PULADO', 'CONCLUIDO'])('não reabre automaticamente depois de %s, inclusive em outra instância', async status => {
    const { adapter } = memoria(); const tour = new ControladorTour(TOUR_MAPA, adapter, agora);
    await tour.carregar(); tour.iniciar();
    if (status === 'PULADO') tour.pular(); else tour.concluir();
    await tour.aguardarPersistencia();
    const reaberto = new ControladorTour(TOUR_MAPA, adapter, agora);
    await reaberto.carregar();
    expect(reaberto.iniciar(true)).toBe(false);
    expect(reaberto.reiniciar()).toBe(true);
    expect(reaberto.obterSnapshot().estado.passoAtual).toBe(0);
  });
  it('restaura progresso após suspensão e reinício do controlador', async () => {
    const { adapter } = memoria(); const tour = new ControladorTour(TOUR_MAPA, adapter, agora);
    await tour.carregar(); tour.iniciar(); tour.avancar(); tour.suspender();
    await tour.aguardarPersistencia();
    const retomado = new ControladorTour(TOUR_MAPA, adapter, agora);
    await retomado.carregar();
    expect(retomado.obterSnapshot().aberto).toBe(false);
    retomado.iniciar(true);
    expect(retomado.obterSnapshot().estado.passoAtual).toBe(1);
  });
  it('nova versão não reaparece sem decisão de produto e reinício manual começa do zero', async () => {
    const { adapter } = memoria(estadoSalvo('CONCLUIDO', 3));
    const tour = new ControladorTour({ ...TOUR_MAPA, versao: 2 }, adapter, agora);
    await tour.carregar();
    expect(tour.iniciar(true)).toBe(false);
    tour.reiniciar();
    expect(tour.obterSnapshot().estado).toMatchObject({ versao: 2, passoAtual: 0 });
  });
  it('permite reexibição essencial explicitamente configurada, sem sobrescrever versão futura', async () => {
    const antigo = memoria(estadoSalvo('CONCLUIDO', 3));
    const tour = new ControladorTour({ ...TOUR_MAPA, versao: 2, reiniciarAutomaticamenteNovaVersao: true }, antigo.adapter, agora);
    await tour.carregar(); expect(tour.iniciar(true)).toBe(true);
    const futuro = memoria(estadoSalvo('CONCLUIDO', 3, 3));
    const downgrade = new ControladorTour(TOUR_MAPA, futuro.adapter, agora);
    await downgrade.carregar();
    expect(downgrade.iniciar()).toBe(false); expect(downgrade.reiniciar()).toBe(false);
    expect(futuro.adapter.salvar).not.toHaveBeenCalled();
  });
  it('corrupção e falha de leitura não apagam preferência nem abrem tour automaticamente', async () => {
    const { adapter } = memoria('{invalido'); const tour = new ControladorTour(TOUR_MAPA, adapter, agora);
    await tour.carregar(); expect(tour.iniciar(true)).toBe(false); expect(adapter.salvar).not.toHaveBeenCalled();
    expect(tour.obterSnapshot().erro).toBeTruthy();
    const falha = memoria(); (falha.adapter.ler as jest.Mock).mockRejectedValue(new Error('offline'));
    const outro = new ControladorTour(TOUR_MAPA, falha.adapter, agora);
    await outro.carregar(); expect(outro.iniciar(true)).toBe(false);
  });
  it('serializa gravações e mantém o último estado mesmo com navegação rápida', async () => {
    const dados = memoria(); const tour = new ControladorTour(TOUR_MAPA, dados.adapter, agora);
    await tour.carregar(); tour.iniciar(); tour.avancar(); tour.voltar(); tour.pular();
    await tour.aguardarPersistencia();
    expect(lerEstadoTour(dados.valor()!)?.status).toBe('PULADO');
    expect(dados.adapter.salvar).toHaveBeenCalledTimes(4);
  });
  it('falha de gravação é recuperável e não prende a sobreposição', async () => {
    const dados = memoria(); (dados.adapter.salvar as jest.Mock).mockRejectedValue(new Error('sem espaço'));
    const tour = new ControladorTour(TOUR_MAPA, dados.adapter, agora);
    await tour.carregar(); tour.iniciar(); tour.pular(); await tour.aguardarPersistencia();
    expect(tour.obterSnapshot()).toMatchObject({ aberto: false, estado: { status: 'PULADO' } });
    expect(tour.obterSnapshot().erro).toContain('não pôde ser salvo');
  });
  it('retorno rápido à tela aguarda as gravações da instância anterior', async () => {
    let salvo: string | null = null;
    let liberar!: () => void;
    const espera = new Promise<void>(resolve => { liberar = resolve; });
    const adapter: PersistenciaTour = { ler: async () => salvo, salvar: async (_chave, valor) => { await espera; salvo = valor; } };
    const primeiro = new ControladorTour(TOUR_MAPA, adapter, agora);
    await primeiro.carregar(); primeiro.iniciar(); primeiro.avancar(); primeiro.pular();
    const segundo = new ControladorTour(TOUR_MAPA, adapter, agora);
    const hidratando = segundo.carregar();
    liberar(); await hidratando;
    expect(segundo.obterSnapshot().estado.status).toBe('PULADO');
    expect(segundo.iniciar(true)).toBe(false);
  });
  it('passos opcionais indisponíveis são pulados e fallback explicativo permanece navegável', async () => {
    const definicao: DefinicaoTour = { ...TOUR_MAPA, passos: [
      { ...TOUR_MAPA.passos[0]!, indisponivel: 'PULAR' }, TOUR_MAPA.passos[1]!,
      { ...TOUR_MAPA.passos[2]!, indisponivel: 'PULAR' },
    ] };
    const tour = new ControladorTour(definicao, memoria().adapter, agora, undefined, () => false);
    await tour.carregar(); tour.iniciar();
    expect(tour.obterSnapshot().estado.passoAtual).toBe(1);
    tour.avancar(); expect(tour.obterSnapshot().estado.status).toBe('CONCLUIDO');
  });
  it('eventos só contêm contrato técnico sem conteúdo pessoal ou medidas de alvos', async () => {
    const eventos: EventoTour[] = [];
    const tour = new ControladorTour(TOUR_MAPA, memoria().adapter, agora, evento => eventos.push(evento));
    await tour.carregar(); tour.iniciar(); tour.avancar(); tour.voltar(); tour.pular();
    expect(eventos.map(e => e.tipo)).toEqual(['INICIO', 'AVANCO', 'RETORNO', 'ABANDONO']);
    expect(Object.keys(eventos[0]!).sort()).toEqual(['passoId', 'tipo', 'tourId', 'versao']);
  });
  it('valida versão, índice, status e timestamp persistidos', () => {
    expect(lerEstadoTour(estadoSalvo('PULADO'))).not.toBeNull();
    expect(lerEstadoTour(estadoSalvo('INVALIDO'))).toBeNull();
    expect(lerEstadoTour(estadoSalvo('EM_ANDAMENTO', -1))).toBeNull();
    expect(lerEstadoTour(estadoSalvo('EM_ANDAMENTO', 0, 0))).toBeNull();
    expect(lerEstadoTour('{"versao":1}')).toBeNull();
  });
});

describe('Registro e viewport dos alvos mobile', () => {
  it('registra, mede e invalida, preservando novo alvo com a mesma chave ao remover o anterior', () => {
    const registro = new RegistroAlvosTour(); const callback = jest.fn();
    const remover = registro.registrar('filtros', resultado => resultado({ x: 10, y: 20, largura: 50, altura: 30 }));
    registro.medir('filtros', callback);
    expect(callback).toHaveBeenCalledWith({ x: 10, y: 20, largura: 50, altura: 30 });
    const nova = registro.registrar('filtros', resultado => resultado(null));
    remover(); expect(registro.possui('filtros')).toBe(true);
    nova(); expect(registro.possui('filtros')).toBe(false);
    expect(registro.obterRevisao()).toBe(3);
  });
  it('ausência, medida inválida ou alvo parcialmente fora da viewport usam fallback', () => {
    const viewport = { x: 0, y: 20, largura: 300, altura: 400 };
    expect(alvoVisivelTour(null, viewport)).toBeNull();
    expect(alvoVisivelTour({ x: 0, y: 0, largura: 100, altura: 40 }, viewport)).toBeNull();
    expect(alvoVisivelTour({ x: 0, y: 30, largura: NaN, altura: 40 }, viewport)).toBeNull();
    expect(alvoVisivelTour({ x: 10, y: 30, largura: 100, altura: 40 }, viewport)).toEqual({ x: 10, y: 10, largura: 100, altura: 40 });
    const retorno = jest.fn(); new RegistroAlvosTour().medir('ausente', retorno); expect(retorno).toHaveBeenCalledWith(null);
  });
});
