'use client'
import Image from 'next/image'
import Logo from '../shared/Logo'
import Link from 'next/link'
import useFormAuth from '../../data/hooks/useFormAuth'
import CampoEmail from '../shared/formulario/CampoEmail'
import CampoTexto from '../shared/formulario/CampoTexto'
import CampoTelefone from '../shared/formulario/CampoTelefone'
import CampoSenha from '../shared/formulario/CampoSenha'

export default function FormAuth() {
    const {
        modo,
        nome,
        email,
        senha,
        telefone,
        alterarNome,
        alterarEmail,
        alterarSenha,
        alterarTelefone,
        alterarModo,
        submeter,
    } = useFormAuth()

    return (
        <div className="h-screen">
            <Image src="/banners/principal.webp" fill alt="Banner" />
            <div
                className="
                    flex flex-col justify-center items-center
                    absolute top-0 left-0 w-full h-full gap-10
                    bg-black/80
                "
            >
                <Logo />
                <div>
                    {modo === 'login' ? (
                        <h1 className="text-2xl font-thin">Seja bem vindo</h1>
                    ) : (
                        <h1 className="text-2xl font-thin">Cadastro</h1>
                    )}
                </div>
                <div className="flex flex-col gap-4 w-80">
                    {modo === 'cadastro' && (
                        <CampoTexto placeholder="Nome" value={nome} onChangeText={alterarNome} />
                    )}
                    <CampoEmail placeholder="E-mail" value={email} onChangeText={alterarEmail} />
                    <CampoSenha placeholder="Senha" value={senha} onChangeText={alterarSenha} />
                    {modo === 'cadastro' && (
                        <CampoTelefone
                            placeholder="Telefone"
                            value={telefone}
                            onChangeText={alterarTelefone}
                        />
                    )}
                    <div className="flex gap-2">
                        <button onClick={submeter} className="button flex-1 bg-green-600">
                            {modo === 'login' ? 'Entrar' : 'Cadastrar'}
                        </button>
                        <Link href="/" className="button flex-1 flex justify-center">
                            Cancelar
                        </Link>
                    </div>
                    <div className="flex mt-6">
                        <button onClick={alterarModo} className="flex-1 button-outline">
                            {modo === 'login' ? (
                                <div>
                                    Ainda não tem conta?{' '}
                                    <span className="text-yellow-400 font-bold">Cadastre-se!</span>
                                </div>
                            ) : (
                                <div>
                                    Já tem conta?{' '}
                                    <span className="text-yellow-400 font-bold">
                                        Entre na plataforma!
                                    </span>
                                </div>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
