import Usuario from '../../usuario/model/Usuario'
import Profissional from '../../profissional/model/Profissional'
import Servico from '../../servico/model/Servico'

export default interface Agendamento {
    id: number
    barbeariaId?: number
    data: Date
    dataFim?: Date
    inicioOcupacao?: Date
    fimOcupacao?: Date
    unidadeId?: number | null
    modeloAtendimento?: 'PRESENCIAL' | 'DOMICILIAR' | 'HIBRIDO'
    enderecoAtendimento?: string | null
    deslocamentoMinutos?: number
    usuario: Usuario
    profissional: Partial<Profissional>
    servicos: Partial<Servico>[]
}
