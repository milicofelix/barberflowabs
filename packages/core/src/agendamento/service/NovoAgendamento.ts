import CasoDeUso from '../../shared/CasoDeUso'
import Usuario from '../../usuario/model/Usuario'
import Agendamento from '../model/Agendamento'
import RepositorioAgendamento from '../provider/RepositorioAgendamento'

type Entrada = {
    agendamento: Agendamento
    usuario: Usuario
}

export default class NovoAgendamento implements CasoDeUso<Entrada, void> {
    constructor(private readonly repo: RepositorioAgendamento) {}

    async executar(entrada: Entrada): Promise<void> {
        const { usuario, agendamento } = entrada

        if (usuario.id !== agendamento.usuario.id) {
            throw new Error('Não é possível criar um agendamento para outro usuário.')
        }

        await this.repo.criar(agendamento)
    }
}
