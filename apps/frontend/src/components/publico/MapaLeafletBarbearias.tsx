'use client'

import Link from 'next/link'
import { caminhoMarcador } from '@/data/marketplace/marcadores'
import { useEffect, useMemo, useRef, useState } from 'react'

const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
const CENTRO_PADRAO: [number, number] = [-23.55052, -46.633308]

declare global {
    interface Window {
        L?: any
    }
}

type Props = {
    barbearias: any[]
    posicaoUsuario?: { lat: number; lng: number } | null
}

export default function MapaLeafletBarbearias({ barbearias, posicaoUsuario }: Props) {
    const mapaRef = useRef<HTMLDivElement | null>(null)
    const instanciaRef = useRef<any>(null)
    const camadaMarcadoresRef = useRef<any>(null)
    const [leafletPronto, setLeafletPronto] = useState(false)
    const [erroMapa, setErroMapa] = useState('')

    const pontos = useMemo(
        () =>
            barbearias
                .map((barbearia) => {
                    const lat = coordenadaValida(barbearia.endereco?.latitude)
                    const lng = coordenadaValida(barbearia.endereco?.longitude)
                    return lat === null || lng === null ? null : { barbearia, lat, lng }
                })
                .filter(Boolean) as Array<{ barbearia: any; lat: number; lng: number }>,
        [barbearias],
    )

    useEffect(() => {
        carregarLeaflet()
            .then(() => setLeafletPronto(true))
            .catch(() => setErroMapa('Não foi possível carregar o mapa.'))
    }, [])

    useEffect(() => {
        if (!leafletPronto || !mapaRef.current || instanciaRef.current) return

        const L = window.L
        const centro = posicaoUsuario ? [posicaoUsuario.lat, posicaoUsuario.lng] : pontos[0] ? [pontos[0].lat, pontos[0].lng] : CENTRO_PADRAO

        instanciaRef.current = L.map(mapaRef.current, {
            center: centro,
            zoom: pontos.length > 0 ? 13 : 11,
            scrollWheelZoom: true,
        })

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap',
        }).addTo(instanciaRef.current)

        camadaMarcadoresRef.current = L.layerGroup().addTo(instanciaRef.current)
        setTimeout(() => instanciaRef.current?.invalidateSize(), 120)

        return () => {
            instanciaRef.current?.remove()
            instanciaRef.current = null
            camadaMarcadoresRef.current = null
        }
    }, [leafletPronto, pontos, posicaoUsuario])

    useEffect(() => {
        if (!leafletPronto || !instanciaRef.current || !camadaMarcadoresRef.current) return

        const L = window.L
        const mapa = instanciaRef.current
        const camada = camadaMarcadoresRef.current

        camada.clearLayers()

        const coordenadas: any[] = []

        if (posicaoUsuario) {
            const marcadorUsuario = L.circleMarker([posicaoUsuario.lat, posicaoUsuario.lng], {
                radius: 9,
                color: '#2563eb',
                fillColor: '#3b82f6',
                fillOpacity: 0.9,
                weight: 3,
            }).bindPopup('<strong>Sua localização</strong>')

            marcadorUsuario.addTo(camada)
            coordenadas.push([posicaoUsuario.lat, posicaoUsuario.lng])
        }

        pontos.forEach(({ barbearia, lat, lng }) => {
            const distancia = barbearia.distanciaKm !== null ? `<br><small>${barbearia.distanciaKm} km de distância</small>` : ''
            const status = barbearia.statusOperacional?.label ? `<br><small>${barbearia.statusOperacional.label}</small>` : ''
            const popup = `
                <strong>${escaparHtml(barbearia.nome)}</strong>
                ${distancia}
                ${status}
                <br><a href="/barbearias/${encodeURIComponent(barbearia.slug)}">Ver perfil</a>
            `

            const icone = L.icon({
                iconUrl: caminhoMarcador(barbearia),
                iconSize: [56, 56],
                iconAnchor: [28, 53],
                popupAnchor: [0, -49],
            })

            L.marker([lat, lng], { icon: icone }).bindPopup(popup).addTo(camada)
            coordenadas.push([lat, lng])
        })

        if (coordenadas.length > 1) {
            mapa.fitBounds(L.latLngBounds(coordenadas), { padding: [42, 42], maxZoom: 15 })
            return
        }

        if (coordenadas.length === 1) {
            mapa.setView(coordenadas[0], 14)
        }
    }, [leafletPronto, pontos, posicaoUsuario])

    return (
        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
            <div className="relative min-h-[520px] overflow-hidden rounded border border-zinc-800 bg-zinc-900">
                {erroMapa && <div className="grid h-full min-h-[520px] place-items-center px-6 text-center text-zinc-400">{erroMapa}</div>}
                {!erroMapa && pontos.length === 0 && !posicaoUsuario && (
                    <div className="absolute inset-0 z-[401] flex items-center justify-center bg-zinc-950/80 px-6 text-center text-zinc-300">
                        As barbearias ainda não possuem coordenadas cadastradas.
                    </div>
                )}
                {!erroMapa && !leafletPronto && <div className="grid h-full min-h-[520px] place-items-center text-zinc-400">Carregando mapa...</div>}
                <div ref={mapaRef} className="h-full min-h-[520px] w-full" />
            </div>

            <div className="grid content-start gap-3">
                {barbearias.map((barbearia) => (
                    <Link key={barbearia.id} href={`/barbearias/${barbearia.slug}`} className="rounded border border-zinc-800 bg-zinc-900 p-4">
                        <div className="flex items-start justify-between gap-3">
                            <strong>{barbearia.nome}</strong>
                            {barbearia.distanciaKm !== null && <span className="text-sm text-zinc-400">{barbearia.distanciaKm} km</span>}
                        </div>
                        <p className="mt-1 text-sm text-zinc-400">{barbearia.statusOperacional?.label ?? 'Status indisponível'}</p>
                    </Link>
                ))}
            </div>
        </div>
    )
}

function carregarLeaflet() {
    if (typeof window === 'undefined') return Promise.reject()
    if (window.L) return Promise.resolve()

    carregarCss(LEAFLET_CSS)

    return new Promise<void>((resolve, reject) => {
        const scriptExistente = document.querySelector<HTMLScriptElement>(`script[src="${LEAFLET_JS}"]`)

        if (scriptExistente) {
            scriptExistente.addEventListener('load', () => resolve(), { once: true })
            scriptExistente.addEventListener('error', () => reject(), { once: true })
            return
        }

        const script = document.createElement('script')
        script.src = LEAFLET_JS
        script.async = true
        script.onload = () => resolve()
        script.onerror = () => reject()
        document.body.appendChild(script)
    })
}

function carregarCss(href: string) {
    if (document.querySelector(`link[href="${href}"]`)) return

    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = href
    document.head.appendChild(link)
}

function coordenadaValida(valor: unknown) {
    if (valor === null || valor === undefined || valor === '') return null

    const numero = Number(valor)
    return Number.isFinite(numero) ? numero : null
}

function escaparHtml(valor: string) {
    return String(valor ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;')
}
