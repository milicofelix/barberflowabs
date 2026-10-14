'use client'
import { useEffect, useState } from 'react'
import Cabecalho from '../shared/Cabecalho'
import Link from 'next/link'
import useSessao from '@/data/hooks/useSessao'
import useAPI from '@/data/hooks/useAPI'
import { capaDoEstabelecimento } from '@/data/estabelecimentos/capas'
import type { IdentidadeEstabelecimento } from '@uniflowabs/core'

export default function Slogan() {
    const { carregando, usuario } = useSessao()
    const { httpGet } = useAPI()
    const papel = String(usuario?.role ?? usuario?.papel ?? '').toUpperCase()
    const admin = ['SUPER_ADMIN', 'APP_OWNER'].includes(papel)
    const operacional = !admin && Boolean(usuario?.estabelecimentoId)
        && (Boolean(usuario?.membroEstabelecimento) || ['ESTABLISHMENT_OWNER', 'ESTABLISHMENT_MEMBER'].includes(papel))
    const [unidade, setUnidade] = useState<(IdentidadeEstabelecimento & { id: number }) | null>(null)
    const [falhou, setFalhou] = useState(false)
    useEffect(() => {
        if (!operacional) return
        let vigente = true
        const carregar = () => httpGet('/estabelecimentos/minha/perfil-publico').then((dados) => { if (vigente && dados?.id === usuario?.estabelecimentoId) setUnidade(dados) })
        void carregar()
        window.addEventListener('focus', carregar)
        return () => { vigente = false; window.removeEventListener('focus', carregar) }
    }, [operacional, usuario?.estabelecimentoId, httpGet])
    const contexto: IdentidadeEstabelecimento = operacional && unidade && unidade.id === usuario?.estabelecimentoId ? unidade : {}
    const imagem = capaDoEstabelecimento(contexto, falhou)
    useEffect(() => { setFalhou(false) }, [contexto.imagemCapaURL, contexto.tipoEstabelecimento])
    useEffect(() => { const previa = new window.Image(); previa.src = imagem }, [imagem])
    return (
        <div className={`home-identidade relative bg-white dark:bg-slate-950 ${operacional ? 'home-operacional h-[100dvh] min-h-[560px]' : 'h-[450px] sm:h-[700px]'}`}>
            <img src={imagem} alt="" decoding="async" onError={() => setFalhou(true)} className="home-imagem absolute inset-0 h-full w-full object-cover" />
            <div
                className="
                    home-sobre-imagem flex flex-col items-center
                    absolute top-0 left-0 w-full h-full
                "
            >
                <Cabecalho semFundo />
                {!carregando && !operacional ? <div className="slogan-conteudo flex flex-col justify-center items-center gap-5">
                    <h1 className="slogan-titulo flex flex-col items-center gap-1">
                        <span className="text-2xl text-white sm:text-3xl md:text-4xl lg:text-5xl font-thin tracking-wider">
                            Encontre seu
                        </span>
                        <span className="text-5xl text-white sm:text-6xl md:text-7xl lg:text-8xl font-black">
                            Estabelecimento
                        </span>
                    </h1>
                    <p className="slogan-descricao text-base text-center text-white sm:text-lg font-extralight">
                        Compare estabelecimentos, escolha um profissional e agende seu horário online.
                    </p>
                    <Link
                        href="/estabelecimentos"
                        className="
                            bg-gradient-to-r from-green-500 to-green-600
                            text-white font-semibold text-base md:text-lg
                            px-4 py-2 rounded-sm hover:from-green-600 hover:to-green-700 
                        "
                    >
                        Ver Estabelecimentos
                    </Link>
                </div> : null}
            </div>
        </div>
    )
}
