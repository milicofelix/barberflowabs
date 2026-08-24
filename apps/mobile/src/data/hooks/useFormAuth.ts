import { useState } from 'react'
import useAPI from './useAPI'
import useSessao from './useSessao'

export default function useFormAuth() {
    const [modo, setModo] = useState<'login' | 'cadastro'>('login')

    const [nome, setNome] = useState('')
    const [email, setEmail] = useState('')
    const [senha, setSenha] = useState('')
    const [erros, setErros] = useState<any>({})

    const { httpPost } = useAPI()
    const { iniciarSessao } = useSessao()

    function alterarModo() {
        setModo(modo === 'login' ? 'cadastro' : 'login')
    }

    async function submeter() {
        if (modo === 'login' && validar()) {
            await login()
            limparFormulario()
        } else if (validar()) {
            await registrar()
            await login()
            limparFormulario()
        }
    }

    function validar() {
        const erros: any = {}
        if (!email) erros.email = 'E-mail é obrigatório'
        if (!senha) erros.senha = 'Senha é obrigatória'
        if (modo === 'cadastro' && !nome) erros.nome = 'Nome é obrigatório'

        setErros(erros)
        return Object.keys(erros).length === 0
    }

    async function login() {
        const token = await httpPost('auth/login', { email, senha })
        iniciarSessao(token)
    }

    async function registrar() {
        await httpPost('auth/registrar', { nome, email, senha })
    }

    function limparFormulario() {
        setNome('')
        setEmail('')
        setSenha('')
        setModo('login')
    }

    return {
        modo,
        nome,
        email,
        senha,
        erros,
        alterarNome: setNome,
        alterarEmail: setEmail,
        alterarSenha: setSenha,
        alterarModo,
        submeter,
    }
}
