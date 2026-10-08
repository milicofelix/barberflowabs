import { useState } from 'react'
import useAPI, { mensagemDoErro } from './useAPI'
import useSessao from './useSessao'

export default function useFormAuth() {
    const [modo, setModo] = useState<'login' | 'cadastro'>('login')

    const [nome, setNome] = useState('')
    const [email, setEmail] = useState('')
    const [senha, setSenha] = useState('')
    const [erros, setErros] = useState<any>({})
    const [processando, setProcessando] = useState(false)
    const [erroGeral, setErroGeral] = useState<string | null>(null)

    const { httpPost } = useAPI()
    const { iniciarSessao } = useSessao()

    function alterarModo() {
        setErroGeral(null)
        setModo(modo === 'login' ? 'cadastro' : 'login')
    }

    async function submeter() {
        if (!validar() || processando) return

        try {
            setProcessando(true)
            setErroGeral(null)
            if (modo === 'cadastro') await registrar()
            await login()
            limparFormulario()
        } catch (erro) {
            setErroGeral(mensagemDoErro(erro))
        } finally {
            setProcessando(false)
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
        const token = await httpPost<string>('auth/login', { email, senha })
        if (!token || typeof token !== 'string') throw new Error('Não foi possível iniciar a sessão.')
        await iniciarSessao(token)
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
        erroGeral,
        processando,
        alterarNome: setNome,
        alterarEmail: setEmail,
        alterarSenha: setSenha,
        alterarModo,
        submeter,
    }
}
