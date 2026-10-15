/** Contrato de apresentação compartilhado por web e React Native. Sem dependência de UI. */
export type DadosRelacionamento = Record<string, unknown>
export type SecaoRelacionamento = 'clientes' | 'templates' | 'campanhas' | 'fidelidade' | 'envios' | 'metricas'
export interface CampoRelacionamento {
    chave: string; titulo: string; tipo?: 'numero' | 'booleano' | 'texto' | 'longo' | 'data' | 'lista' | 'niveis'
    opcoes?: Array<{ valor: string; titulo: string }>; padrao?: string; opcional?: boolean; oculto?: boolean
}
export interface FormularioRelacionamento {
    titulo: string; caminho: string; metodo: 'GET' | 'POST' | 'PUT'; campos: CampoRelacionamento[]
    aviso?: string; confirmar?: string
}
export interface AcaoRelacionamento { titulo: string; caminho: string; confirmar?: string; formulario?: FormularioRelacionamento }
export interface APIClienteRelacionamento {
    get: (caminho: string) => Promise<unknown>
    post: (caminho: string, dados: unknown) => Promise<unknown>
    put: (caminho: string, dados: unknown) => Promise<unknown>
}
export const secoesRelacionamento: Array<{ id: SecaoRelacionamento; titulo: string }> = [
    { id: 'clientes', titulo: 'Clientes' }, { id: 'templates', titulo: 'Templates' },
    { id: 'campanhas', titulo: 'Campanhas' }, { id: 'fidelidade', titulo: 'Fidelização' },
    { id: 'envios', titulo: 'Envios' }, { id: 'metricas', titulo: 'Métricas' },
]
export const canaisRelacionamento = ['PUSH', 'EMAIL', 'WHATSAPP']
export function objetoRelacionamento(valor: unknown): DadosRelacionamento {
    return valor && typeof valor === 'object' && !Array.isArray(valor) ? valor as DadosRelacionamento : {}
}
export function registrosRelacionamento(valor: unknown): DadosRelacionamento[] {
    const lista = Array.isArray(valor) ? valor : objetoRelacionamento(valor).itens
    return Array.isArray(lista) ? lista.map(objetoRelacionamento) : []
}
export function valorRelacionamento(dados: DadosRelacionamento, caminho: string): unknown {
    return caminho.split('.').reduce<unknown>((valor, chave) => objetoRelacionamento(valor)[chave], dados)
}
const base = '/relacionamento'
const fidelidade = `${base}/fidelidade`
const campo = (chave: string, titulo: string, tipo: CampoRelacionamento['tipo'] = 'texto', padrao?: string, opcional = false): CampoRelacionamento => ({ chave, titulo, tipo, padrao, opcional })
const escolha = (chave: string, titulo: string, valores: string[]): CampoRelacionamento => ({ chave, titulo, opcoes: valores.map(valor => ({ valor, titulo: valor.replace(/_/g, ' ') })) })
const ativo = campo('ativo', 'Ativo', 'booleano', 'false')
export const camposProgramaRelacionamento: CampoRelacionamento[] = [ativo, campo('centavosPorPonto', 'Centavos gastos por ponto', 'numero', '100'), campo('validadeDias', 'Validade dos pontos (dias)', 'numero', '365'), campo('bonusIndicacao', 'Bônus por indicação (pontos)', 'numero', '0'), campo('minimoIndicacaoCentavos', 'Valor mínimo da indicação (centavos)', 'numero', '0'), campo('niveis', 'Níveis: um por linha, no formato Nome;Pontos', 'niveis', 'Inicial;0')]
const camposTemplate = [campo('nome', 'Nome'), escolha('evento', 'Evento', ['CONFIRMACAO_AGENDAMENTO', 'LEMBRETE_AGENDAMENTO', 'CAMPANHA', 'FIDELIDADE']), escolha('canal', 'Canal', canaisRelacionamento), campo('assunto', 'Assunto', 'texto', '', true), campo('conteudo', 'Conteúdo', 'longo'), ativo]
const camposRecompensa = [campo('nome', 'Nome'), campo('pontos', 'Custo em pontos', 'numero'), campo('descontoCentavos', 'Desconto (centavos)', 'numero'), ativo]
const camposCupom = [campo('codigo', 'Código'), campo('descontoCentavos', 'Desconto (centavos)', 'numero'), campo('inicio', 'Início (data e hora locais)', 'data'), campo('fim', 'Fim exclusivo (data e hora locais)', 'data'), campo('limiteTotal', 'Limite total', 'numero', '100'), campo('limitePorCliente', 'Limite por cliente', 'numero', '1'), campo('minimoCentavos', 'Gasto mínimo (centavos)', 'numero', '0'), campo('elegibilidade.tags', 'Tags elegíveis (separadas por vírgula)', 'lista', '', true), campo('elegibilidade.servicoIds', 'IDs dos serviços elegíveis (separados por vírgula)', 'lista', '', true), campo('elegibilidade.primeiraVisita', 'Somente primeira visita', 'booleano', 'false'), ativo]
export function formulariosRelacionamento(secao: SecaoRelacionamento, clientes: DadosRelacionamento[], templates: DadosRelacionamento[]): FormularioRelacionamento[] {
    const selecionarCliente = (chave: string, titulo: string): CampoRelacionamento => ({ chave, titulo, opcoes: clientes.map(c => ({ valor: String(c.id), titulo: `${String(objetoRelacionamento(c.usuario).nome ?? 'Cliente')} · #${c.id}` })) })
    if (secao === 'templates') return [{ titulo: 'Novo template', caminho: `${base}/templates`, metodo: 'POST', campos: camposTemplate, aviso: 'Variáveis de campanha: {{nome}}, {{estabelecimento}} e {{descadastroUrl}}. O canal só enviará com consentimento.' }]
    if (secao === 'campanhas') return [{ titulo: 'Nova campanha', caminho: `${base}/campanhas`, metodo: 'POST', campos: [campo('nome', 'Nome'), { chave: 'templateId', titulo: 'Template de campanha ativo', opcoes: templates.filter(t => t.ativo && t.evento === 'CAMPANHA').map(t => ({ valor: String(t.id), titulo: `${t.nome} · ${t.canal}` })) }, campo('filtros.tags', 'Tags (qualquer uma, separadas por vírgula)', 'lista', '', true), ...['unidadeId', 'servicoId', 'profissionalId'].map((chave) => campo(`filtros.${chave}`, `Filtro por ${chave.replace('Id', '')} (ID opcional)`, 'numero', '', true)), campo('filtros.recorrenciaMinima', 'Mínimo de visitas concluídas', 'numero', '', true), campo('filtros.inatividadeDias', 'Inatividade mínima em dias', 'numero', '', true), campo('intervaloMinimoHoras', 'Intervalo mínimo entre campanhas (24 a 720 horas)', 'numero', '168')] }]
    if (secao === 'fidelidade') return [
        { titulo: 'Nova recompensa', caminho: `${fidelidade}/recompensas`, metodo: 'POST', campos: camposRecompensa },
        { titulo: 'Novo cupom', caminho: `${fidelidade}/cupons`, metodo: 'POST', campos: camposCupom },
        { titulo: 'Registrar indicação', caminho: `${fidelidade}/indicacoes`, metodo: 'POST', campos: [selecionarCliente('indicadorId', 'Quem indicou'), selecionarCliente('indicadoId', 'Cliente indicado')], aviso: 'A indicação exige revisão humana de identidade antes da aprovação. Não concede consentimento de marketing.' },
    ]
    return []
}
export function formulariosBeneficioRelacionamento(): FormularioRelacionamento[] {
    const agendamento = campo('_agendamentoId', 'Número do agendamento (consulte na agenda)', 'numero')
    const chave = { ...campo('chaveIdempotencia', 'Chave da operação', 'texto', `central-${Date.now()}-${Math.random().toString(36).slice(2)}`), oculto: true }
    const caminho = `${fidelidade}/agendamentos/:agendamentoId/beneficio`
    return [
        { titulo: 'Consultar benefício do agendamento', caminho, metodo: 'GET', campos: [agendamento] },
        { titulo: 'Aplicar cupom no agendamento', caminho, metodo: 'POST', campos: [agendamento, campo('codigoCupom', 'Código do cupom'), chave], confirmar: 'Confirma a reserva do desconto neste atendimento?' },
        { titulo: 'Resgatar recompensa no agendamento', caminho, metodo: 'POST', campos: [agendamento, campo('recompensaId', 'Número da recompensa', 'numero'), chave], confirmar: 'Confirma o consumo dos pontos do cliente e a reserva do desconto?' },
        { titulo: 'Cancelar benefício do agendamento', caminho: `${caminho}/cancelar`, metodo: 'POST', campos: [agendamento], confirmar: 'Cancelar o benefício reservado? O estorno seguirá a validade original dos pontos.' },
    ]
}
export function formularioSupressaoRelacionamento(clienteId: number): FormularioRelacionamento {
    return { titulo: 'Supressão de campanhas', caminho: `${base}/campanhas/supressoes`, metodo: 'POST', campos: [{ ...campo('clienteId', 'Cliente', 'numero', String(clienteId)), oculto: true }, escolha('canal', 'Canal', canaisRelacionamento), campo('ativa', 'Bloquear campanhas neste canal', 'booleano', 'true'), campo('motivo', 'Motivo')], confirmar: 'Confirmo a alteração. Remover bloqueio não concede consentimento de comunicação.' }
}
export function formularioClienteRelacionamento(cliente: DadosRelacionamento): FormularioRelacionamento {
    return { titulo: 'Editar relacionamento', caminho: `${base}/clientes/${cliente.id}`, metodo: 'PUT', campos: [escolha('status', 'Status', ['ATIVO', 'INATIVO', 'BLOQUEADO']), campo('tags', 'Tags (separadas por vírgula)', 'lista', '', true), campo('observacoes', 'Observações', 'longo', '', true)] }
}
export function formularioPreferenciaRelacionamento(clienteId: number, canal: string): FormularioRelacionamento {
    return { titulo: `Preferência ${canal}`, caminho: `${base}/clientes/${clienteId}/preferencias`, metodo: 'PUT', campos: [campo('consentido', 'Cliente autorizou este canal', 'booleano', 'false'), campo('versaoTermos', 'Versão dos termos apresentados')], aviso: 'Registre somente autorização explícita do cliente. Importação de contato não é consentimento.', confirmar: 'Confirmo que esta preferência corresponde à manifestação do cliente.' }
}
export function acoesRegistroRelacionamento(secao: SecaoRelacionamento, registro: DadosRelacionamento): AcaoRelacionamento[] {
    const id = Number(registro.id)
    if (!id) return []
    if (secao === 'templates') return [{ titulo: 'Editar template', caminho: '', formulario: { titulo: 'Editar template', caminho: `${base}/templates/${id}`, metodo: 'PUT', campos: camposTemplate } }]
    if (secao === 'campanhas') {
        const caminho = `${base}/campanhas/${id}`
        if (registro.status === 'RASCUNHO' && !registro.audienciaCongeladaEm) return [{ titulo: 'Congelar audiência', caminho: `${caminho}/congelar`, confirmar: 'Congelar público e conteúdo? Após esta ação, eles não poderão ser editados.' }]
        if (registro.status === 'RASCUNHO') return [{ titulo: 'Agendar disparo', caminho: '', formulario: { titulo: 'Agendar disparo', caminho: `${caminho}/agendar`, metodo: 'POST', campos: [campo('agendadoPara', 'Data e hora locais do disparo', 'data')], confirmar: 'Confirma o agendamento do envio para a audiência congelada?' } }]
        if (['AGENDADA', 'EM_EXECUCAO'].includes(String(registro.status))) return [{ titulo: 'Pausar campanha', caminho: `${caminho}/pausar`, confirmar: 'Pausar novos envios? Mensagens já entregues ao provedor não podem ser recolhidas.' }]
        if (registro.status === 'PAUSADA') return [{ titulo: 'Retomar campanha', caminho: `${caminho}/retomar`, confirmar: 'Retomar os envios desta campanha agora?' }]
    }
    if (secao === 'envios' && !registro.campanhaId && ['FILA_MORTA', 'FALHA_PERMANENTE'].includes(String(registro.status))) return [{ titulo: 'Reprocessar envio', caminho: '', formulario: { titulo: 'Reprocessar envio', caminho: `${base}/envios/${id}/reprocessar`, metodo: 'POST', campos: [campo('tentativasAdicionais', 'Tentativas adicionais', 'numero', '3')], confirmar: 'Autorizar novas tentativas desta mensagem?' } }]
    if (secao === 'fidelidade') {
        if (registro.tipoRegistro === 'recompensa' || registro.tipoRegistro === 'cupom') return [{ titulo: 'Editar oferta', caminho: '', formulario: { titulo: 'Editar oferta', caminho: `${fidelidade}/${registro.tipoRegistro === 'cupom' ? 'cupons' : 'recompensas'}/${id}`, metodo: 'PUT', campos: registro.tipoRegistro === 'cupom' ? camposCupom : camposRecompensa } }]
        if (registro.tipoRegistro === 'indicacao' && registro.status === 'PENDENTE') return [{ titulo: 'Aprovar indicação', caminho: `${fidelidade}/indicacoes/${id}/aprovar`, confirmar: 'Confirma a revisão da identidade dos clientes e ausência de autoindicação?' }]
    }
    return []
}
/** Valores locais de formulário viram instantes ISO; a API continua sendo autoridade das regras. */
export function prepararFormularioRelacionamento(form: FormularioRelacionamento, valores: Record<string, string>, canal?: string): DadosRelacionamento {
    const resultado: DadosRelacionamento = {}
    for (const c of form.campos) {
        const texto = (valores[c.chave] ?? '').trim()
        if (!texto && c.opcional) {
            if (c.tipo === 'lista') definir(resultado, c.chave, [])
            else if (c.chave === 'observacoes' || c.chave === 'assunto') definir(resultado, c.chave, null)
            continue
        }
        if (!texto) throw new Error(`Preencha: ${c.titulo}`)
        let valor: unknown = texto
        if (c.opcoes && !c.opcoes.some(o => o.valor === texto)) throw new Error(`Selecione: ${c.titulo}`)
        if (c.tipo === 'numero' || /Id$/.test(c.chave)) { const numero = Number(texto); if (!Number.isSafeInteger(numero) || numero < 0) throw new Error(`Número inválido: ${c.titulo}`); valor = numero }
        if (c.tipo === 'booleano') valor = texto === 'true'
        if (c.tipo === 'lista') {
            valor = texto.split(',').map(v => v.trim()).filter(Boolean)
            if (c.chave.endsWith('servicoIds')) { valor = (valor as string[]).map(Number); if ((valor as number[]).some(n => !Number.isSafeInteger(n) || n <= 0)) throw new Error('IDs de serviços inválidos') }
        }
        if (c.tipo === 'data') valor = instanteLocalRelacionamento(texto)
        if (c.tipo === 'niveis') valor = texto.split('\n').filter(v => v.trim()).map(linha => { const [nome, pontos] = linha.split(';'); if (!nome?.trim() || !pontos?.trim() || !Number.isSafeInteger(Number(pontos))) throw new Error('Use um nível por linha: Nome;Pontos'); return { nome: nome.trim(), pontos: Number(pontos) } })
        definir(resultado, c.chave, valor)
    }
    if (canal) return { preferencias: [{ ...resultado, canal, origem: 'ESTABELECIMENTO' }] }
    return resultado
}
export function instanteLocalRelacionamento(texto: string): string {
    const partes = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(texto)
    if (!partes) throw new Error('Informe data e hora locais no formato AAAA-MM-DDTHH:mm')
    const [, ano, mes, dia, hora, minuto] = partes.map(Number)
    const data = new Date(ano!, mes! - 1, dia, hora, minuto)
    if (data.getFullYear() !== ano || data.getMonth() !== mes! - 1 || data.getDate() !== dia || data.getHours() !== hora || data.getMinutes() !== minuto) throw new Error('Data ou hora inexistente')
    return data.toISOString()
}
function definir(objeto: DadosRelacionamento, caminho: string, valor: unknown) {
    const partes = caminho.split('.'); const chave = partes.pop()!
    let atual = objeto
    for (const parte of partes) { if (!atual[parte]) atual[parte] = {}; atual = objetoRelacionamento(atual[parte]) }
    atual[chave] = valor
}
export function valoresFormularioRelacionamento(form: FormularioRelacionamento, registro: DadosRelacionamento = {}): Record<string, string> {
    return Object.fromEntries(form.campos.map(c => {
        const valor = valorRelacionamento(registro, c.chave)
        if (valor == null) return [c.chave, c.padrao ?? c.opcoes?.[0]?.valor ?? '']
        if (c.tipo === 'niveis' && Array.isArray(valor)) return [c.chave, valor.map(n => `${objetoRelacionamento(n).nome};${objetoRelacionamento(n).pontos}`).join('\n')]
        if (c.tipo === 'data') { const data = new Date(String(valor)); return [c.chave, new Date(data.getTime() - data.getTimezoneOffset() * 60000).toISOString().slice(0, 16)] }
        return [c.chave, Array.isArray(valor) ? valor.join(', ') : String(valor)]
    }))
}
