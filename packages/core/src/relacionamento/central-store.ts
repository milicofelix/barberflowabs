import { APIClienteRelacionamento, DadosRelacionamento, FormularioRelacionamento, SecaoRelacionamento, objetoRelacionamento, registrosRelacionamento, prepararFormularioRelacionamento } from './central'

export interface EstadoCentralRelacionamento {
    grupoFidelidade: 'recompensas' | 'cupons' | 'indicacoes'
    secao: SecaoRelacionamento; permissoes: string[]; carregando: boolean; salvando: boolean; erro: string; mensagem: string
    itens: DadosRelacionamento[]; total: number; pagina: number; busca: string; inicio: string; fim: string
    clientes: DadosRelacionamento[]; templates: DadosRelacionamento[]; programa: DadosRelacionamento
    selecionado: DadosRelacionamento | null; detalhe: DadosRelacionamento | null; paginaDetalhe: number; totalDetalhe: number
}
/** Estado por sessão/tenant, não persistido. Uma resposta antiga nunca substitui uma consulta mais recente. */
export class CentralRelacionamentoStore {
    private ouvintes = new Set<() => void>()
    private revisao = 0
    private ativo = true
    private estado: EstadoCentralRelacionamento
    constructor(private api: APIClienteRelacionamento) {
        const agora = new Date(); const inicio = new Date(agora.getFullYear(), agora.getMonth(), 1)
        this.estado = { grupoFidelidade: 'recompensas', secao: 'clientes', permissoes: [], carregando: true, salvando: false, erro: '', mensagem: '', itens: [], total: 0, pagina: 1, busca: '', inicio: inicio.toISOString(), fim: agora.toISOString(), clientes: [], templates: [], programa: {}, selecionado: null, detalhe: null, paginaDetalhe: 1, totalDetalhe: 0 }
    }
    snapshot = () => this.estado
    subscribe = (ouvinte: () => void) => { this.ouvintes.add(ouvinte); return () => { this.ouvintes.delete(ouvinte) } }
    private atualizar(dados: Partial<EstadoCentralRelacionamento>) { if (!this.ativo) return; this.estado = { ...this.estado, ...dados }; this.ouvintes.forEach(o => o()) }
    encerrar = () => { this.ativo = false; this.revisao++; this.ouvintes.clear() }
    async iniciar() {
        this.ativo = true
        try { const resposta = await this.api.get('/equipe/minhas-permissoes'); this.atualizar({ permissoes: Array.isArray(resposta) ? resposta as string[] : [] }); await this.carregar() }
        catch (e) { this.atualizar({ carregando: false, erro: mensagem(e) }) }
    }
    async recarregar() {
        if (this.estado.salvando || !this.ativo) return
        await this.iniciar()
        if (this.ativo && !this.estado.erro && this.estado.selecionado) await this.selecionar(this.estado.selecionado, this.estado.paginaDetalhe)
    }
    async carregar(alteracoes: Partial<Pick<EstadoCentralRelacionamento, 'grupoFidelidade' | 'secao' | 'pagina' | 'busca' | 'inicio' | 'fim'>> = {}) {
        const mudar = (alteracoes.secao !== undefined && alteracoes.secao !== this.estado.secao) || (alteracoes.grupoFidelidade !== undefined && alteracoes.grupoFidelidade !== this.estado.grupoFidelidade)
        this.atualizar({ ...alteracoes, ...(mudar ? { pagina: 1, selecionado: null, detalhe: null, itens: [], total: 0, mensagem: '' } : {}), carregando: true, erro: '' })
        const versao = ++this.revisao
        const e = this.estado
        if (!e.permissoes.includes('RELACIONAMENTO_VISUALIZAR')) { this.atualizar({ carregando: false, itens: [], selecionado: null, detalhe: null, clientes: [], templates: [], programa: {}, erro: 'Você não tem permissão para visualizar relacionamento.' }); return }
        try {
            let itens: DadosRelacionamento[] = []; let total = 0
            const extras: Partial<EstadoCentralRelacionamento> = {}
            if (e.secao === 'clientes') {
                const todos = registrosRelacionamento(await this.api.get(`/relacionamento/clientes?q=${encodeURIComponent(e.busca)}`))
                total = todos.length; itens = todos.slice((e.pagina - 1) * 25, e.pagina * 25)
            } else if (e.secao === 'templates') {
                const todos = registrosRelacionamento(await this.api.get('/relacionamento/templates')); total = todos.length; itens = todos.slice((e.pagina - 1) * 25, e.pagina * 25); extras.templates = todos
            } else if (e.secao === 'fidelidade') {
                const [programa, indicacoes, clientes] = await Promise.all([this.api.get('/relacionamento/fidelidade/programa'), e.grupoFidelidade === 'indicacoes' ? this.api.get(`/relacionamento/fidelidade/indicacoes?pagina=${e.pagina}`) : Promise.resolve([]), e.grupoFidelidade === 'indicacoes' ? this.api.get('/relacionamento/clientes') : Promise.resolve([])])
                extras.programa = objetoRelacionamento(programa); extras.clientes = registrosRelacionamento(clientes)
                const indicados = registrosRelacionamento(indicacoes).map(i => ({ ...i, tipoRegistro: 'indicacao', chaveRegistro: `indicacao:${i.id}` }))
                const ofertas = registrosRelacionamento(extras.programa[e.grupoFidelidade]).map(i => ({ ...i, tipoRegistro: e.grupoFidelidade === 'cupons' ? 'cupom' : 'recompensa', chaveRegistro: `${e.grupoFidelidade}:${i.id}` }))
                itens = e.grupoFidelidade === 'indicacoes' ? indicados : ofertas.slice((e.pagina - 1) * 25, e.pagina * 25)
                // O endpoint legado de indicações retorna um array, sem contagem global.
                total = e.grupoFidelidade === 'indicacoes' ? (e.pagina - 1) * 50 + indicados.length + (indicados.length === 50 ? 1 : 0) : ofertas.length
            } else if (e.secao === 'metricas') {
                if (!e.permissoes.includes('FINANCEIRO_VISUALIZAR')) throw new Error('Métricas exigem também permissão de visualizar financeiro.')
                const dados = objetoRelacionamento(await this.api.get(`/relacionamento/governanca/metricas?inicio=${encodeURIComponent(e.inicio)}&fim=${encodeURIComponent(e.fim)}`))
                itens = ['funil', 'atribuicao', 'clientes', 'regras', 'periodo'].map(chave => ({ ...objetoRelacionamento(dados[chave]), nome: chave, chaveRegistro: chave })); total = itens.length
            } else {
                const resposta = objetoRelacionamento(await this.api.get(`/relacionamento/${e.secao}?pagina=${e.pagina}&limite=25`)); itens = registrosRelacionamento(resposta); total = Number(resposta.total ?? itens.length)
                if (e.secao === 'campanhas') extras.templates = registrosRelacionamento(await this.api.get('/relacionamento/templates'))
            }
            if (this.ativo && versao === this.revisao) this.atualizar({ ...extras, itens, total, carregando: false })
        } catch (erro) { if (versao === this.revisao) this.atualizar({ carregando: false, erro: mensagem(erro) }) }
    }
    async selecionar(item: DadosRelacionamento | null, pagina = 1) {
        const versao = ++this.revisao
        this.atualizar({ selecionado: item, detalhe: null, erro: '', paginaDetalhe: pagina, totalDetalhe: 0, carregando: !!item })
        if (!item) { this.atualizar({ carregando: false }); return }
        const secao = this.estado.secao
        try {
            let detalhe = item; let total = 0
            if (secao === 'clientes') {
                const [cliente, preferencias, carteira] = await Promise.all([this.api.get(`/relacionamento/clientes/${item.id}`), this.api.get(`/relacionamento/clientes/${item.id}/preferencias`), this.api.get(`/relacionamento/fidelidade/clientes/${item.id}?pagina=${pagina}`)])
                detalhe = { ...objetoRelacionamento(cliente), preferencias, carteira }; total = Number(objetoRelacionamento(carteira).total ?? 0)
            } else if (secao === 'campanhas') {
                const [campanha, audiencia] = await Promise.all([this.api.get(`/relacionamento/campanhas/${item.id}`), this.api.get(`/relacionamento/campanhas/${item.id}/audiencia?pagina=${pagina}&limite=25`)])
                detalhe = { ...objetoRelacionamento(campanha), audiencia }; total = Number(objetoRelacionamento(audiencia).total ?? 0)
            } else if (secao === 'envios') detalhe = objetoRelacionamento(await this.api.get(`/relacionamento/envios/${item.id}`))
            if (this.ativo && versao === this.revisao) this.atualizar({ detalhe, selecionado: { ...item, ...detalhe }, totalDetalhe: total, carregando: false })
        } catch (erro) { if (versao === this.revisao) this.atualizar({ erro: mensagem(erro), carregando: false }) }
    }
    async salvar(form: FormularioRelacionamento, valores: Record<string, string>, canal?: string): Promise<boolean> {
        if (this.estado.salvando || !this.estado.permissoes.includes(form.metodo === 'GET' ? 'RELACIONAMENTO_VISUALIZAR' : 'RELACIONAMENTO_GERENCIAR')) return false
        this.atualizar({ salvando: true, erro: '', mensagem: '' })
        try {
            const payload = prepararFormularioRelacionamento(form, valores, canal)
            let caminho = form.caminho
            if (caminho.includes(':agendamentoId')) {
                if (!this.estado.permissoes.includes('AGENDA_GERENCIAR')) throw new Error('Benefícios exigem também permissão de gerenciar agenda.')
                if (typeof payload._agendamentoId !== 'number' || !Number.isSafeInteger(payload._agendamentoId) || payload._agendamentoId <= 0) throw new Error('Número do agendamento inválido')
                caminho = caminho.replace(':agendamentoId', String(payload._agendamentoId)); delete payload._agendamentoId
            }
            const resposta = await (form.metodo === 'GET' ? this.api.get(caminho) : form.metodo === 'PUT' ? this.api.put(caminho, payload) : this.api.post(caminho, payload))
            if (caminho.includes('/agendamentos/')) {
                const detalhe = objetoRelacionamento(form.metodo === 'GET' ? resposta : await this.api.get(caminho.replace(/\/cancelar$/, '')))
                this.atualizar({ selecionado: { nome: 'Benefícios do agendamento', ...detalhe }, detalhe, mensagem: form.metodo === 'GET' ? '' : 'Benefício atualizado com sucesso.' }); return true
            }
            await this.carregar(); if (this.estado.selecionado) await this.selecionar(this.estado.selecionado, this.estado.paginaDetalhe)
            this.atualizar({ mensagem: 'Alteração registrada com sucesso.' }); return true
        } catch (erro) { this.atualizar({ erro: mensagem(erro) }); return false }
        finally { this.atualizar({ salvando: false }) }
    }
}
export function limitePaginaRelacionamento(estado: EstadoCentralRelacionamento) { return estado.secao === 'fidelidade' && estado.grupoFidelidade === 'indicacoes' ? 50 : 25 }
function mensagem(erro: unknown) { return erro instanceof Error ? erro.message : 'Não foi possível carregar relacionamento.' }
