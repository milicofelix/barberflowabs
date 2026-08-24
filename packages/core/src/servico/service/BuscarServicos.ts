import CasoDeUso from '../../shared/CasoDeUso'
import Servico from '../model/Servico'
import RepositorioServico from '../provider/RepositorioServico'

export default class BuscarServicos implements CasoDeUso<void, Servico[]> {
    constructor(private readonly repo: RepositorioServico) {}

    async executar(): Promise<Servico[]> {
        return this.repo.buscarTodos()
    }
}
