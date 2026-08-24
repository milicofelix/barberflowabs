import CasoDeUso from '../../shared/CasoDeUso'
import Profissional from '../model/Profissional'
import RepositorioProfissional from '../provider/RepositorioProfissional'

export default class BuscarProfissionais implements CasoDeUso<void, Profissional[]> {
    constructor(private readonly repo: RepositorioProfissional) {}

    async executar(): Promise<Profissional[]> {
        return this.repo.buscarTodos()
    }
}
