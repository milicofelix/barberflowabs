import CasoDeUso from '../../shared/CasoDeUso'
import Agendamento from '../model/Agendamento'
import RepositorioAgendamento from '../provider/RepositorioAgendamento'

type Entrada = {
    profissional: number
    data: Date
}

export default class BuscarAgendaProfissionalPorDia implements CasoDeUso<Entrada, Agendamento[]> {
    constructor(private readonly repo: RepositorioAgendamento) {}

    executar(entrada: Entrada): Promise<Agendamento[]> {
        const { profissional, data } = entrada
        return this.repo.buscarPorProfissionalEData(profissional, data)
    }
}
