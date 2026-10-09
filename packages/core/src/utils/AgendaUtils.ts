export default class AgendaUtils {
    private static readonly tempoSlot = 15
    private static minutos = [0, 15, 30, 45]

    static horariosDoDia() {
        return {
            manha: this.gerarHorarios([8, 9, 10, 11]),
            tardeNoite: this.gerarHorarios([13, 14, 15, 16, 17, 18, 19, 20]),
        }
    }

    static duracaoTotal(servicos: { qtdeSlots: number; duracaoMinutos?: number }[]) {
        const duracao = this.duracaoEmMinutos(servicos)
        const horas = Math.floor(duracao / 60)
        const minutos = duracao % 60
        return `${horas}h ${minutos.toString().padStart(2, '0')}m`
    }

    static qtdeHorarios(servicos: { qtdeSlots: number; duracaoMinutos?: number }[]) {
        return Math.ceil(this.duracaoEmMinutos(servicos) / this.tempoSlot)
    }

    private static duracaoEmMinutos(
        servicos: { qtdeSlots: number; duracaoMinutos?: number }[]
    ) {
        return servicos.reduce((total, servico) => {
            const duracao = Number(servico.duracaoMinutos)
            return total + (duracao > 0 ? duracao : servico.qtdeSlots * this.tempoSlot)
        }, 0)
    }

    static gerarHorarios(horas: number[]): string[] {
        return horas.reduce((horarios, hora) => {
            const horariosDaHora = this.minutos.map((minuto) => {
                const horaFormatada = hora.toString().padStart(2, '0')
                const minutoFormatado = minuto.toString().padStart(2, '0')
                return `${horaFormatada}:${minutoFormatado}`
            })
            return [...horarios, ...horariosDaHora]
        }, [] as string[])
    }
}
