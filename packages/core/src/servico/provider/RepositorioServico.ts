import Servico from '../model/Servico'

export default interface RepositorioServico {
    buscarTodos(): Promise<Servico[]>
}
