import NossosClientes from '@/components/cliente/NossosClientes'
import Slogan from '@/components/landing/Slogan'
import NossosProfissionais from '@/components/profissional/NossosProfissionais'
import NossosServicos from '@/components/servico/NossosServicos'
import Cabecalho from '@/components/shared/Cabecalho'
import Rodape from '@/components/shared/Rodape'
import SecaoBackground from '@/components/shared/SecaoBackground'

export default function Landing() {
    return (
        <div className="flex flex-col">
            <Slogan />
            <SecaoBackground imagem="/banners/servicos.webp">
                <NossosServicos />
            </SecaoBackground>
            <SecaoBackground imagem="/banners/profissionais.webp">
                <NossosProfissionais />
            </SecaoBackground>
            <SecaoBackground imagem="/banners/clientes.webp">
                <NossosClientes />
            </SecaoBackground>
            <Rodape />
        </div>
    )
}
