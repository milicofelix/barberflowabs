import { AgendaUtils } from '../../utils'

// { inicio: "20:30", qtde: 4, horariosOcupados: ["09:45", "11:30", "15:45", "16:00"] }
// ["20:30", "20:45"]
export default class Horarios {
    constructor(
        public readonly inicio: string,
        public readonly qtde: number,
        private readonly horariosOcupados: string[]
    ) {}

    get todos() {
        const { manha, tardeNoite } = AgendaUtils.horariosDoDia()
        const horarios = manha.includes(this.inicio) ? manha : tardeNoite
        const indice = horarios.indexOf(this.inicio)
        return horarios.slice(indice, indice + this.qtde)
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
}
