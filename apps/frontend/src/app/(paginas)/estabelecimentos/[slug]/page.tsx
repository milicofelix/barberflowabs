import PerfilPublicoEstabelecimento from '@/components/publico/PerfilPublicoEstabelecimento'

export default function Page({ params }: { params: { slug: string } }) {
    return <PerfilPublicoEstabelecimento slug={params.slug} />
}
