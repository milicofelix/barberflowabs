'use client'
import Cabecalho from '../shared/Cabecalho'
import Link from 'next/link'
import useSessao from '@/data/hooks/useSessao'
import ImagemIdentidadeUnidade from '../shared/ImagemIdentidadeUnidade'
import NavegacaoEmBotoes from '../shared/NavegacaoEmBotoes'

export default function Slogan() {
    const { carregando, usuario } = useSessao()
    const papel = String(usuario?.role ?? usuario?.papel ?? '').toUpperCase()
    const admin = ['SUPER_ADMIN', 'APP_OWNER'].includes(papel)
    const operacional = !admin && Boolean(usuario?.estabelecimentoId)
        && (Boolean(usuario?.membroEstabelecimento) || ['ESTABLISHMENT_OWNER', 'ESTABLISHMENT_MEMBER'].includes(papel))
    return (
        <div className={`home-identidade relative bg-white dark:bg-slate-950 ${operacional ? 'home-operacional h-[100dvh] min-h-[560px]' : usuario ? 'h-[650px] sm:h-[780px]' : 'h-[450px] sm:h-[700px]'}`}>
            <ImagemIdentidadeUnidade className="home-imagem absolute inset-0 h-full w-full object-cover" />
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
                {usuario ? <div className="mt-auto w-full"><NavegacaoEmBotoes /></div> : null}
            </div>
        </div>
    )
}
