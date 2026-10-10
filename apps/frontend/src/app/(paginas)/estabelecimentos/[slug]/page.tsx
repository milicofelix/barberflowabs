import PerfilPublicoEstabelecimento from '@/components/publico/PerfilPublicoEstabelecimento'
import NavegacaoPublica from '@/components/shared/NavegacaoPublica'

export default function Page({ params }: { params: { slug: string } }) {
    return (
        <>
            <NavegacaoPublica voltarPara="/estabelecimentos" voltarLabel="Voltar aos estabelecimentos" />
            <PerfilPublicoEstabelecimento slug={params.slug} />
        </>
    )
}
