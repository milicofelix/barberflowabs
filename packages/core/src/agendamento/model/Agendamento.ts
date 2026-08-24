import Usuario from '../../usuario/model/Usuario'
import Profissional from '../../profissional/model/Profissional'
import Servico from '../../servico/model/Servico'

export default interface Agendamento {
    id: number
    data: Date
    usuario: Usuario
    profissional: Partial<Profissional>
    servicos: Partial<Servico>[]
}
