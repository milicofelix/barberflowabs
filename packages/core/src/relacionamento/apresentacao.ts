import { DadosRelacionamento, objetoRelacionamento } from './central'

export function tituloRegistroRelacionamento(item: DadosRelacionamento) {
    const usuario = objetoRelacionamento(item.usuario)
    return String(usuario.nome ?? item.nome ?? item.codigo ?? (item.tipoRegistro === 'indicacao' ? `Indicação #${item.id}` : `Registro #${item.id}`))
}
const rotulos: Record<string, string> = { id: 'Identificador', usuario: 'Cliente', nome: 'Nome', status: 'Status', ativo: 'Ativo', codigo: 'Código', telefone: 'Telefone', email: 'E-mail', tags: 'Tags', observacoes: 'Observações', ultimoAgendamentoEm: 'Último agendamento', ultimaInteracaoEm: 'Última interação', canal: 'Canal', evento: 'Evento', assunto: 'Assunto', conteudo: 'Conteúdo', consentido: 'Consentimento', consentidoEm: 'Autorizado em', revogadoEm: 'Revogado em', origem: 'Origem', versaoTermos: 'Versão dos termos', saldo: 'Saldo de pontos', pontos: 'Pontos', nivel: 'Nível', pontosAcumulados: 'Pontos acumulados', calculadoEm: 'Calculado em', expiraEm: 'Validade', extrato: 'Extrato', lotes: 'Lotes válidos', carteira: 'Fidelização', preferencias: 'Preferências', tipo: 'Tipo', createdAt: 'Criado em', enviadoEm: 'Enviado em', agendadoPara: 'Agendado para', audienciaCongeladaEm: 'Audiência congelada em', tentativas: 'Tentativas', callbacks: 'Eventos do provedor', erro: 'Erro', numero: 'Tentativa', indicadorId: 'Cliente indicador (ID)', indicadoId: 'Cliente indicado (ID)', descontoCentavos: 'Desconto em centavos', minimoCentavos: 'Mínimo em centavos', limiteTotal: 'Limite total', limitePorCliente: 'Limite por cliente', inicio: 'Início', fim: 'Fim exclusivo', filtros: 'Filtros', elegibilidade: 'Elegibilidade', itens: 'Registros', total: 'Total', audiencia: 'Audiência', envios: 'Envios', usuarioId: 'ID do usuário', motivo: 'Motivo', evidencia: 'Evidência', proximaTentativaEm: 'Próxima tentativa', maximoTentativas: 'Máximo de tentativas', provedor: 'Provedor' }
const ocultos = new Set(['chaveIdempotencia', 'chave', 'metadados', 'payload', 'templateSnapshot', 'referenciaExterna', 'referenciaVerificacao', 'chaveRegistro', 'tipoRegistro', 'estabelecimentoId', 'lockToken', 'lockAte', 'destino', 'dadosExpurgadosEm'])
export function rotuloRelacionamento(chave: string) { return rotulos[chave] ?? chave.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ') }
/** Sem JSON bruto: conserva estrutura de leitura e oculta dados técnicos/tokens do transporte. */
export function linhasRelacionamento(dados: unknown, prefixo = '', profundidade = 0): Array<{ titulo: string; valor: string }> {
    if (profundidade > 5 || dados == null) return []
    if (Array.isArray(dados)) return dados.flatMap((valor, i) => typeof valor === 'object' ? linhasRelacionamento(valor, `${prefixo} ${i + 1}`, profundidade + 1) : [{ titulo: prefixo, valor: String(valor) }])
    return Object.entries(objetoRelacionamento(dados)).filter(([chave]) => !ocultos.has(chave)).flatMap(([chave, valor]) => {
        const titulo = `${prefixo ? `${prefixo} · ` : ''}${rotuloRelacionamento(chave)}`
        if (valor == null) return [{ titulo, valor: 'Não informado' }]
        if (typeof valor === 'object') return linhasRelacionamento(valor, titulo, profundidade + 1)
        const texto = typeof valor === 'boolean' ? (valor ? 'Sim' : 'Não') : String(valor)
        const formatado = /^\d{4}-\d{2}-\d{2}T/.test(texto) && Number.isFinite(new Date(texto).getTime()) ? new Date(texto).toLocaleString('pt-BR') : texto
        return [{ titulo, valor: formatado }]
    })
}
