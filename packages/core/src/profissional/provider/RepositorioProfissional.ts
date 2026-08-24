import Profissional from '../model/Profissional'

export default interface RepositorioProfissional {
    buscarTodos(): Promise<Profissional[]>
}
