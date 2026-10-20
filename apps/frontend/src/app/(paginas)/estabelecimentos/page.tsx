import DescobertaEstabelecimentos from '@/components/publico/DescobertaEstabelecimentos'
import NavegacaoPublica from '@/components/shared/NavegacaoPublica'

export default function EstabelecimentosPage() {
    return (
        <>
            <NavegacaoPublica voltarPara="/" voltarLabel="Voltar ao início" />
            <DescobertaEstabelecimentos />
        </>
    )
}
