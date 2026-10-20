import { TEMPO_SLOT } from '../../constants'
import { AgendaUtils } from '../../utils'

// { inicio: "20:30", qtde: 4, horariosOcupados: ["09:45", "11:30", "15:45", "16:00"] }
// ["20:30", "20:45"]
export default class Horarios {
    constructor(
        public readonly inicio: string,
        public readonly qtde: number,
        private readonly horariosOcupados: string[],
        private readonly horariosDisponiveis?: string[]
    ) {}

    get todos() {
        if (this.horariosDisponiveis) {
            return this.horariosConsecutivos(this.horariosDisponiveis)
        }

        const { manha, tardeNoite } = AgendaUtils.horariosDoDia()
        // Manhã/tarde são seções visuais, não um intervalo obrigatório.
        const horarios = [...manha, ...tardeNoite]
        return this.horariosConsecutivos(horarios)
    }

    get completo() {
        return this.todos.length === this.qtde
    }

    get incompleto() {
        return !this.completo
    }

    get ocupado() {
        return this.todos.some((h) => this.horariosOcupados.includes(h))
    }

    private horariosConsecutivos(horariosDisponiveis: string[]) {
        if (typeof this.inicio !== 'string') return []

        const [hora, minuto] = this.inicio.split(':').map(Number)
        if (!Number.isInteger(hora) || !Number.isInteger(minuto)) return []

        const inicioEmMinutos = hora * 60 + minuto
        const horarios: string[] = []

        for (let indice = 0; indice < this.qtde; indice++) {
            const totalMinutos = inicioEmMinutos + indice * TEMPO_SLOT
            const horario = `${Math.floor(totalMinutos / 60).toString().padStart(2, '0')}:${(totalMinutos % 60).toString().padStart(2, '0')}`
            if (!horariosDisponiveis.includes(horario)) break
            horarios.push(horario)
        }

        return horarios
    }
}
