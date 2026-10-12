'use client'

import { Check, LoaderCircle, MapPin, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import useSessao from '@/data/hooks/useSessao'
import { consultarViaCep } from '@/data/saas/viacep'
import useSolicitacaoEstabelecimento from '@/data/hooks/useSolicitacaoEstabelecimento'
import { formatarCep, formatarTelefone } from './solicitacao-estabelecimento.types'
import { MODELOS_ATENDIMENTO_ONBOARDING, TIPOS_ESTABELECIMENTO_ONBOARDING } from './onboarding.config'
import { Campo, GrupoOpcoes, Selecao } from './CamposOnboarding'

const nomesPassos = ['Responsável', 'Tipo do negócio', 'Dados comerciais', 'Endereço', 'Revisão']

export default function PassosSolicitacaoEstabelecimento() {
    const { usuario } = useSessao()
    const fluxo = useSolicitacaoEstabelecimento()
    const [consultandoCep, setConsultandoCep] = useState(false)
    const [erroCep, setErroCep] = useState('')
    const [aceitouTermos, setAceitouTermos] = useState(false)

    if (fluxo.carregando) return <div className="flex min-h-72 items-center justify-center"><LoaderCircle className="animate-spin" /></div>
    if (!fluxo.dados) return <Aviso texto={fluxo.mensagem || 'Não foi possível abrir o cadastro.'} />

    const { solicitacao, segmentos, planos } = fluxo.dados
    if (!['RASCUNHO', 'REJECTED', 'CORRECTION_REQUESTED'].includes(solicitacao.status)) {
        return <Acompanhamento solicitacao={solicitacao} />
    }

    async function buscarCep() {
        if (fluxo.form.modeloAtendimento === 'DOMICILIAR') return
        setConsultandoCep(true); setErroCep('')
        try {
            const endereco = await consultarViaCep(fluxo.form.cep)
            fluxo.alterar('cep', formatarCep(endereco.cep)); fluxo.alterar('logradouro', endereco.logradouro)
            fluxo.alterar('bairro', endereco.bairro); fluxo.alterar('cidade', endereco.localidade)
            fluxo.alterar('estado', endereco.uf); fluxo.alterar('complemento', fluxo.form.complemento || endereco.complemento)
        } catch (erro) {
            setErroCep(erro instanceof Error ? erro.message : 'Não foi possível consultar o CEP.')
        } finally { setConsultandoCep(false) }
    }

    return <div className="grid gap-6">
        <ol className="grid grid-cols-5 gap-2" aria-label="Progresso do cadastro">
            {nomesPassos.map((nome, indice) => <li key={nome} className="grid gap-2 text-center text-xs font-semibold text-muted-foreground">
                <span className={`mx-auto grid h-9 w-9 place-items-center rounded-full border ${indice <= fluxo.passo ? 'border-violet-500 bg-violet-600 text-white' : 'border-border bg-card'}`}>
                    {indice < fluxo.passo ? <Check size={17} /> : indice + 1}
                </span>
                <span className="hidden sm:block">{nome}</span>
            </li>)}
        </ol>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-lg sm:p-8">
            {fluxo.passo === 0 && <div className="grid gap-5">
                <Titulo titulo="Conta do responsável" descricao="Usaremos a conta com a qual você já está conectado. Não é necessário criar outro cadastro." />
                <div className="rounded-xl border border-violet-200 bg-violet-50 p-5 text-slate-900 dark:border-violet-900 dark:bg-violet-950/40 dark:text-white">
                    <strong className="block text-lg">{usuario?.nome}</strong><span>{usuario?.email}</span>
                    {usuario?.telefone && <span className="mt-1 block">{formatarTelefone(usuario.telefone)}</span>}
                </div>
                <p className="flex items-start gap-2 text-sm text-muted-foreground"><ShieldCheck className="mt-0.5 shrink-0 text-emerald-500" size={18} />Você continuará como cliente enquanto a solicitação estiver em análise.</p>
            </div>}

            {fluxo.passo === 1 && <div className="grid gap-6">
                <Titulo titulo="Qual é o seu tipo de negócio?" descricao="Escolha a opção mais próxima. Sugeriremos segmentos compatíveis para reduzir erros." />
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{TIPOS_ESTABELECIMENTO_ONBOARDING.map(({ valor, texto, descricao, Icone }) => {
                    const ativo = fluxo.form.tipoEstabelecimento === valor
                    return <button type="button" key={valor} onClick={() => fluxo.selecionarTipo(valor)} className={`rounded-xl border p-4 text-left transition hover:-translate-y-0.5 ${ativo ? 'border-violet-500 bg-violet-600 text-white shadow-md' : 'border-border bg-background text-foreground'}`}>
                        <Icone size={24} /><strong className="mt-3 block">{texto}</strong><span className={`text-xs ${ativo ? 'text-violet-100' : 'text-muted-foreground'}`}>{descricao}</span>
                    </button>
                })}</div>
                <GrupoOpcoes titulo="Segmentos oferecidos" itens={segmentos} selecionados={fluxo.form.segmentoIds} alternar={fluxo.alternarSegmento} />
                <GrupoOpcoes titulo="Especialidades" descricao="Marque ao menos uma especialidade que represente sua atuação." itens={fluxo.especialidadesDisponiveis} selecionados={fluxo.form.especialidadeIds} alternar={fluxo.alternarEspecialidade}
                    mensagemSemOpcoes={fluxo.form.segmentoIds.length ? 'Este segmento ainda não possui especialidades cadastradas.' : 'Selecione ao menos um segmento.'} />
            </div>}

            {fluxo.passo === 2 && <div className="grid gap-5">
                <Titulo titulo="Identificação comercial" descricao="Esses dados serão revisados antes da publicação. O endereço da página será criado automaticamente." />
                <Campo label="Nome público" required value={fluxo.form.nomePublico} onChange={(valor) => fluxo.alterar('nomePublico', valor)} />
                <div className="grid gap-4 sm:grid-cols-2">
                    <Campo label="E-mail comercial" type="email" required value={fluxo.form.emailComercial} onChange={(valor) => fluxo.alterar('emailComercial', valor.trim().toLowerCase())} />
                    <Campo label="Telefone comercial" required value={formatarTelefone(fluxo.form.telefoneComercial)} onChange={(valor) => fluxo.alterar('telefoneComercial', formatarTelefone(valor))} />
                    <Selecao label="Modelo de atendimento" value={fluxo.form.modeloAtendimento} opcoes={MODELOS_ATENDIMENTO_ONBOARDING} onChange={(valor) => fluxo.alterar('modeloAtendimento', valor)} />
                    <Selecao label="Plano desejado" value={fluxo.form.planoSlug} opcoes={planos.map((plano) => [plano.slug, plano.nome])} onChange={(valor) => fluxo.alterar('planoSlug', valor)} />
                </div>
            </div>}

            {fluxo.passo === 3 && <div className="grid gap-5">
                <Titulo titulo="Endereço do atendimento" descricao={fluxo.form.modeloAtendimento === 'DOMICILIAR' ? 'Como seu atendimento é domiciliar, o endereço comercial é opcional.' : 'Informe o CEP para preencher o endereço automaticamente. Você poderá corrigir qualquer campo.'} />
                <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto]">
                    <Campo label="CEP" required={fluxo.form.modeloAtendimento !== 'DOMICILIAR'} value={formatarCep(fluxo.form.cep)} onChange={(valor) => fluxo.alterar('cep', formatarCep(valor))} onBlur={() => fluxo.form.cep.replace(/\D/g, '').length === 8 && buscarCep()} />
                    <button type="button" className="button min-h-11" onClick={buscarCep} disabled={consultandoCep}>{consultandoCep ? 'Consultando...' : 'Buscar CEP'}</button>
                </div>
                {erroCep && <Aviso texto={erroCep} />}
                <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
                    <Campo label="Logradouro" required value={fluxo.form.logradouro} onChange={(valor) => fluxo.alterar('logradouro', valor)} />
                    <Campo label="Número" required value={fluxo.form.numero} onChange={(valor) => fluxo.alterar('numero', valor)} />
                    <Campo label="Complemento" value={fluxo.form.complemento} onChange={(valor) => fluxo.alterar('complemento', valor)} />
                    <Campo label="Ponto de referência" value={fluxo.form.pontoReferencia} onChange={(valor) => fluxo.alterar('pontoReferencia', valor)} />
                    <Campo label="Bairro" required value={fluxo.form.bairro} onChange={(valor) => fluxo.alterar('bairro', valor)} />
                    <div className="grid grid-cols-[1fr_90px] gap-3"><Campo label="Cidade" required value={fluxo.form.cidade} onChange={(valor) => fluxo.alterar('cidade', valor)} /><Campo label="UF" required maxLength={2} value={fluxo.form.estado} onChange={(valor) => fluxo.alterar('estado', valor.toUpperCase().replace(/[^A-Z]/g, ''))} /></div>
                </div>
                <p className="flex gap-2 text-xs text-muted-foreground"><MapPin size={16} />Latitude e longitude serão verificadas pela administração; você não precisa informá-las.</p>
            </div>}

            {fluxo.passo === 4 && <Revisao fluxo={fluxo} aceitou={aceitouTermos} alterarAceite={setAceitouTermos} />}

            {fluxo.mensagem && <div className="mt-5 rounded-lg border border-violet-200 bg-violet-50 p-3 text-sm text-violet-900 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-100">{fluxo.mensagem}</div>}
            <div className="mt-7 flex flex-wrap justify-between gap-3">
                <button type="button" className="button-outline disabled:opacity-40" disabled={fluxo.passo === 0 || fluxo.salvando} onClick={fluxo.voltar}>Voltar</button>
                {fluxo.passo < 4
                    ? <button type="button" className="button" disabled={fluxo.salvando} onClick={fluxo.avancar}>{fluxo.salvando ? 'Salvando...' : 'Continuar'}</button>
                    : <button type="button" className="button" disabled={fluxo.salvando} onClick={() => fluxo.enviar(aceitouTermos)}>{fluxo.salvando ? 'Enviando...' : 'Enviar para análise'}</button>}
            </div>
        </section>
    </div>
}

function Titulo({ titulo, descricao }: { titulo: string; descricao: string }) { return <header><h2 className="text-2xl font-black">{titulo}</h2><p className="mt-1 text-sm text-muted-foreground">{descricao}</p></header> }
function Aviso({ texto }: { texto: string }) { return <p className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">{texto}</p> }

function Revisao({ fluxo, aceitou, alterarAceite }: { fluxo: ReturnType<typeof useSolicitacaoEstabelecimento>; aceitou: boolean; alterarAceite: (valor: boolean) => void }) {
    const tipo = TIPOS_ESTABELECIMENTO_ONBOARDING.find((item) => item.valor === fluxo.form.tipoEstabelecimento)?.texto
    return <div className="grid gap-5"><Titulo titulo="Revise e envie" descricao="Confira os dados antes de encaminhar a solicitação para análise." />
        <dl className="grid gap-4 rounded-xl border border-border bg-background/60 p-5 sm:grid-cols-2">
            <Resumo rotulo="Tipo" valor={tipo} /><Resumo rotulo="Nome público" valor={fluxo.form.nomePublico} />
            <Resumo rotulo="Contato" valor={`${fluxo.form.emailComercial} · ${formatarTelefone(fluxo.form.telefoneComercial)}`} />
            <Resumo rotulo="Atendimento" valor={MODELOS_ATENDIMENTO_ONBOARDING.find(([valor]) => valor === fluxo.form.modeloAtendimento)?.[1]} />
            <Resumo rotulo="Segmentos" valor={fluxo.dados?.segmentos.filter((item) => fluxo.form.segmentoIds.includes(item.id)).map((item) => item.nome).join(', ')} />
            <Resumo rotulo="Especialidades" valor={fluxo.especialidadesDisponiveis.filter((item) => fluxo.form.especialidadeIds.includes(item.id)).map((item) => item.nome).join(', ')} />
            <Resumo rotulo="Endereço" valor={fluxo.form.modeloAtendimento === 'DOMICILIAR' ? 'Atendimento domiciliar' : `${fluxo.form.logradouro}, ${fluxo.form.numero} · ${fluxo.form.bairro} · ${fluxo.form.cidade}/${fluxo.form.estado}`} />
        </dl>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-4 text-sm"><input type="checkbox" checked={aceitou} onChange={(evento) => alterarAceite(evento.target.checked)} className="mt-1 h-4 w-4" /><span>Declaro que as informações são verdadeiras e aceito os termos de cadastro, versão <strong>{fluxo.dados?.configuracao.termosVersao}</strong>.</span></label>
    </div>
}

function Resumo({ rotulo, valor }: { rotulo: string; valor?: string | null }) { return <div><dt className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{rotulo}</dt><dd className="mt-1 font-medium">{valor || 'Não informado'}</dd></div> }

function Acompanhamento({ solicitacao }: { solicitacao: { id: number; status: string; enviadoEm?: string | null; motivoRevisao?: string | null } }) {
    const rotulos: Record<string, string> = { PENDING_REVIEW: 'em análise', APPROVED: 'aprovada', CANCELED: 'cancelada' }
    return <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-lg"><div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-200"><Check size={30} /></div><h2 className="mt-5 text-2xl font-black">Solicitação {rotulos[solicitacao.status] ?? solicitacao.status}</h2><p className="mt-2 text-muted-foreground">Protocolo #{solicitacao.id}{solicitacao.enviadoEm ? ` · enviada em ${new Date(solicitacao.enviadoEm).toLocaleDateString('pt-BR')}` : ''}</p>{solicitacao.motivoRevisao && <Aviso texto={solicitacao.motivoRevisao} />}<p className="mt-5 text-sm text-muted-foreground">Você será avisado quando houver uma atualização.</p></div>
}
