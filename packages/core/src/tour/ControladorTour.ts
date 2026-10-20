import { DefinicaoTour, EstadoTourMapa, EventoTour, PersistenciaTour, lerEstadoTour, novoEstadoTour } from './contratos'

// Leituras de uma tela recém-aberta também aguardam gravações da instância anterior.
const filasPersistencia = new WeakMap<PersistenciaTour, Map<string, Promise<void>>>()

export interface SnapshotTour {
    estado: EstadoTourMapa
    carregando: boolean
    aberto: boolean
    erro: string
}

export class ControladorTour {
    private snapshot: SnapshotTour
    private ouvintes = new Set<() => void>()
    private fila: Promise<void> = Promise.resolve()
    private hidratacao: Promise<void> | null = null
    private leituraSegura = false

    constructor(
        readonly definicao: DefinicaoTour,
        private persistencia: PersistenciaTour,
        private agora = () => new Date().toISOString(),
        private emitir?: (evento: EventoTour) => void,
        private disponivel = (_alvo: string) => true,
    ) {
        if (!Number.isSafeInteger(definicao.versao) || definicao.versao < 1 || !definicao.passos.length
            || new Set(definicao.passos.map(p => p.id)).size !== definicao.passos.length) throw new Error('Definição de tour inválida')
        this.snapshot = { estado: novoEstadoTour(definicao.versao, agora()), aberto: false, carregando: true, erro: '' }
    }

    obterSnapshot = () => this.snapshot
    observar = (ouvinte: () => void) => { this.ouvintes.add(ouvinte); return () => { this.ouvintes.delete(ouvinte) } }
    private atualizar(dados: Partial<SnapshotTour>) {
        this.snapshot = { ...this.snapshot, ...dados }
        this.ouvintes.forEach(ouvinte => ouvinte())
    }

    carregar = (): Promise<void> => {
        if (this.hidratacao) return this.hidratacao
        this.hidratacao = this.hidratar()
        return this.hidratacao
    }

    private async hidratar() {
        try {
            await filasPersistencia.get(this.persistencia)?.get(this.definicao.chavePersistencia)
            const salvo = await this.persistencia.ler(this.definicao.chavePersistencia)
            const estado = salvo === null ? this.snapshot.estado : lerEstadoTour(salvo)
            if (!estado || (estado.versao === this.definicao.versao && estado.passoAtual >= this.definicao.passos.length)) {
                throw new Error('Progresso salvo inválido. Reinicie o tour manualmente.')
            }
            this.leituraSegura = true
            this.atualizar({ estado, carregando: false })
        } catch {
            this.atualizar({ carregando: false, erro: 'Não foi possível recuperar o progresso. O início automático foi desativado; você pode reiniciar manualmente.' })
        }
    }

    iniciar = (automatico = false): boolean => {
        if (this.snapshot.carregando || this.snapshot.aberto) return false
        const estado = this.snapshot.estado
        if (automatico && (!this.leituraSegura || (estado.versao === this.definicao.versao && ['CONCLUIDO', 'PULADO'].includes(estado.status))
            || (estado.versao !== this.definicao.versao && !this.definicao.reiniciarAutomaticamenteNovaVersao))) return false
        // Uma versão antiga do app não deve sobrescrever o progresso de uma versão mais recente.
        if (estado.versao > this.definicao.versao) {
            this.atualizar({ erro: 'Este dispositivo já utilizou uma versão mais recente do tour. Atualize o aplicativo.' })
            return false
        }
        const passo = estado.versao === this.definicao.versao && estado.status === 'EM_ANDAMENTO' ? estado.passoAtual : 0
        this.mover(passo, 1, 'INICIO')
        return true
    }

    avancar = () => { if (this.snapshot.aberto) this.mover(this.snapshot.estado.passoAtual + 1, 1, 'AVANCO') }
    voltar = () => { if (this.snapshot.aberto) this.mover(this.snapshot.estado.passoAtual - 1, -1, 'RETORNO') }
    pular = () => { if (this.snapshot.aberto) this.salvar('PULADO', this.snapshot.estado.passoAtual, 'ABANDONO') }
    concluir = () => { if (this.snapshot.aberto) this.salvar('CONCLUIDO', this.snapshot.estado.passoAtual, 'CONCLUSAO') }
    reiniciar = () => {
        if (this.snapshot.carregando || this.snapshot.estado.versao > this.definicao.versao) return false
        this.mover(0, 1, 'REINICIO')
        return true
    }
    /** Fechar a tela pausa a apresentação sem marcar conclusão ou apagar progresso. */
    suspender = () => this.atualizar({ aberto: false })
    aguardarPersistencia = () => this.fila

    private mover(indice: number, direcao: 1 | -1, evento: EventoTour['tipo']) {
        while (indice >= 0 && indice < this.definicao.passos.length) {
            const passo = this.definicao.passos[indice]!
            if (passo.indisponivel !== 'PULAR' || this.disponivel(passo.alvo)) {
                this.salvar('EM_ANDAMENTO', indice, evento)
                return
            }
            indice += direcao
        }
        if (direcao === 1) this.salvar('CONCLUIDO', this.definicao.passos.length - 1, 'CONCLUSAO')
    }

    private salvar(status: EstadoTourMapa['status'], passoAtual: number, tipo: EventoTour['tipo']) {
        const estado = { versao: this.definicao.versao, status, passoAtual, atualizadoEm: this.agora() }
        this.atualizar({ estado, aberto: status === 'EM_ANDAMENTO', erro: '' })
        const passoId = this.definicao.passos[passoAtual]!.id
        try { this.emitir?.({ tourId: this.definicao.id, versao: estado.versao, passoId, tipo }) } catch { /* Observação não controla a navegação. */ }
        let filas = filasPersistencia.get(this.persistencia)
        if (!filas) { filas = new Map(); filasPersistencia.set(this.persistencia, filas) }
        this.fila = (filas.get(this.definicao.chavePersistencia) ?? Promise.resolve()).then(async () => {
            try { await this.persistencia.salvar(this.definicao.chavePersistencia, JSON.stringify(estado)) }
            catch { this.atualizar({ erro: 'O progresso não pôde ser salvo neste dispositivo. O tour poderá reaparecer ao reiniciar o app.' }) }
        })
        filas.set(this.definicao.chavePersistencia, this.fila)
    }
}
