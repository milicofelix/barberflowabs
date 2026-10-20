import Usuario from '../../usuario/model/Usuario'
import Profissional from '../../profissional/model/Profissional'
import Servico from '../../servico/model/Servico'

export default interface Agendamento {
    id: number
    estabelecimentoId?: number
    data: Date
    dataFim?: Date
    inicioOcupacao?: Date
    fimOcupacao?: Date
    unidadeId?: number | null
    modeloAtendimento?: 'PRESENCIAL' | 'DOMICILIAR' | 'HIBRIDO'
    enderecoAtendimento?: string | null
    deslocamentoMinutos?: number
    status?: string
    estabelecimento?: { id: number; nome: string; slug: string }
    unidade?: { id: number; nome: string } | null
    usuario: Usuario
    profissional: Partial<Profissional>
    servicos: Partial<Servico>[]
}
