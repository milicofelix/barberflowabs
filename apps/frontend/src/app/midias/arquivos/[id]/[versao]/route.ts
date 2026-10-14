export async function GET(_request: Request, { params }: { params: { id: string; versao: string } }) {
    if (!/^[a-f0-9-]{36}$/.test(params.id) || !['miniatura', 'principal'].includes(params.versao)) return new Response(null, { status: 404 })
    const base = process.env.NEXT_PUBLIC_API_URL
    if (!base) return new Response(null, { status: 503 })
    try {
        const resposta = await fetch(`${base.replace(/\/$/, '')}/midias/arquivos/${params.id}/${params.versao}`, { cache: 'no-store' })
        if (!resposta.ok) return new Response(null, { status: resposta.status })
        return new Response(resposta.body, { headers: {
            'Content-Type': resposta.headers.get('Content-Type') ?? 'image/webp',
            'Cache-Control': 'public, max-age=31536000, immutable',
            'X-Content-Type-Options': 'nosniff',
        } })
    } catch { return new Response(null, { status: 502 }) }
}
