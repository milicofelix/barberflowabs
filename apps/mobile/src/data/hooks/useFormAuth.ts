import { useState } from 'react'
import useAPI, { ErroAPI, mensagemDoErro } from './useAPI'
import useSessao from './useSessao'

type ErrosFormulario = Partial<Record<'nome' | 'email' | 'telefone' | 'senha' | 'confirmacaoSenha', string>>

export default function useFormAuth() {
    const [modo, setModo] = useState<'login' | 'cadastro'>('login')

    const [nome, setNome] = useState('')
    const [email, setEmail] = useState('')
    const [telefone, setTelefone] = useState('')
    const [senha, setSenha] = useState('')
    const [confirmacaoSenha, setConfirmacaoSenha] = useState('')
    const [erros, setErros] = useState<ErrosFormulario>({})
    const [processando, setProcessando] = useState(false)
    const [erroGeral, setErroGeral] = useState<string | null>(null)
    const [sucesso, setSucesso] = useState<string | null>(null)

    const { httpPost } = useAPI()
    const { iniciarSessao } = useSessao()

    function alterarModo() {
        setErroGeral(null)
        setSucesso(null)
        setErros({})
        setModo((valor) => (valor === 'login' ? 'cadastro' : 'login'))
    }

    async function submeter() {
        if (!validar() || processando) return

        try {
            setProcessando(true)
            setErroGeral(null)
            setSucesso(null)
            if (modo === 'cadastro') {
                await registrar()
                setSucesso('Conta criada! Estamos preparando seu primeiro acesso.')
            }
            await login()
            limparFormulario()
        } catch (erro) {
            if (modo === 'login' && erro instanceof ErroAPI && erro.status === 401) {
                setErroGeral('E-mail ou senha inválidos. Confira os dados e tente novamente.')
            } else {
                setErroGeral(mensagemDoErro(erro))
            }
        } finally {
            setProcessando(false)
        }
    }

    function validar() {
        const novosErros: ErrosFormulario = {}
        const emailNormalizado = email.trim().toLowerCase()
        const telefoneNumerico = telefone.replace(/\D/g, '')

        if (!emailNormalizado) novosErros.email = 'Informe seu e-mail.'
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalizado)) novosErros.email = 'Informe um e-mail válido.'
        if (!senha) novosErros.senha = 'Informe sua senha.'
        else if (senha.length < 6) novosErros.senha = 'A senha deve ter pelo menos 6 caracteres.'

        if (modo === 'cadastro') {
            if (nome.trim().length < 3) novosErros.nome = 'Informe seu nome completo.'
            if (telefoneNumerico.length < 10 || telefoneNumerico.length > 11) novosErros.telefone = 'Informe um telefone com DDD.'
            if (!confirmacaoSenha) novosErros.confirmacaoSenha = 'Confirme sua senha.'
            else if (confirmacaoSenha !== senha) novosErros.confirmacaoSenha = 'As senhas não coincidem.'
        }

        setErros(novosErros)
        return Object.keys(novosErros).length === 0
    }

    async function login() {
        const token = await httpPost<string>('auth/login', { email: email.trim().toLowerCase(), senha })
        if (!token || typeof token !== 'string') throw new Error('Não foi possível iniciar a sessão.')
        await iniciarSessao(token)
    }

    async function registrar() {
        await httpPost('auth/registrar', {
            nome: nome.trim(),
            email: email.trim().toLowerCase(),
            telefone: telefone.replace(/\D/g, ''),
            senha,
        })
    }

    function limparFormulario() {
        setNome('')
        setEmail('')
        setTelefone('')
        setSenha('')
        setConfirmacaoSenha('')
        setModo('login')
    }

    return {
        modo,
        nome,
        email,
        telefone,
        senha,
        confirmacaoSenha,
        erros,
        erroGeral,
        sucesso,
        processando,
        alterarNome: (valor: string) => { setNome(valor); setErros((atuais) => ({ ...atuais, nome: undefined })); setErroGeral(null) },
        alterarEmail: (valor: string) => { setEmail(valor); setErros((atuais) => ({ ...atuais, email: undefined })); setErroGeral(null) },
        alterarTelefone: (valor: string) => { setTelefone(valor); setErros((atuais) => ({ ...atuais, telefone: undefined })); setErroGeral(null) },
        alterarSenha: (valor: string) => { setSenha(valor); setErros((atuais) => ({ ...atuais, senha: undefined })); setErroGeral(null) },
        alterarConfirmacaoSenha: (valor: string) => { setConfirmacaoSenha(valor); setErros((atuais) => ({ ...atuais, confirmacaoSenha: undefined })); setErroGeral(null) },
        alterarModo,
        submeter,
    }
}
