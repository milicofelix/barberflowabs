import PerfilPublicoBarbearia from '@/components/publico/PerfilPublicoBarbearia'

export default function Page({ params }: { params: { slug: string } }) {
    return <PerfilPublicoBarbearia slug={params.slug} />
}
