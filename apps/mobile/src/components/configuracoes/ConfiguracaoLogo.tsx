import { useEffect, useState } from 'react'
import { DeviceEventEmitter, Pressable, Text, View } from 'react-native'
import { OPCOES_LOGO_ESTABELECIMENTO, type ConfiguracaoLogoEstabelecimento } from '@uniflowabs/core'
import useAPI, { mensagemDoErro } from '@/src/data/hooks/useAPI'
import useSessao from '@/src/data/hooks/useSessao'
import useTema from '@/src/data/contexts/ContextoTema'
import SeletorImagem from '@/src/components/midia/SeletorImagem'

export default function ConfiguracaoLogo() {
    const { usuario } = useSessao(); const { cores } = useTema(); const { httpGet, httpPut } = useAPI()
    const dono = String(usuario?.papel ?? usuario?.role).toUpperCase() === 'ESTABLISHMENT_OWNER'
    const [config, setConfig] = useState<ConfiguracaoLogoEstabelecimento | null>(null)
    const [midiaId, setMidiaId] = useState<string>()
    const [salvando, setSalvando] = useState(false); const [mensagem, setMensagem] = useState('')
    useEffect(() => {
        setConfig(null); setMidiaId(undefined); setMensagem('')
        if (!dono) return
        let vigente = true
        httpGet<ConfiguracaoLogoEstabelecimento>('/estabelecimentos/minha/logo').then((r) => { if (vigente) setConfig(r) }).catch((e) => { if (vigente) setMensagem(mensagemDoErro(e)) })
        return () => { vigente = false }
    }, [dono, usuario?.estabelecimentoId, httpGet])
    if (!dono) return null
    async function salvar() {
        if (!config || salvando) return
        setSalvando(true); setMensagem('')
        try {
            const r = await httpPut<ConfiguracaoLogoEstabelecimento>('/estabelecimentos/minha/logo', { logoModo: config.logoModo, midiaId })
            setConfig(r); setMidiaId(undefined); setMensagem('Logo atualizado.')
            DeviceEventEmitter.emit('uniflow:identidade-atualizada')
        } catch (e) { setMensagem(mensagemDoErro(e)) } finally { setSalvando(false) }
    }
    return <View style={{ padding: 16, gap: 12, marginVertical: 12, borderWidth: 1, borderRadius: 14, borderColor: cores.borda, backgroundColor: cores.superficie }}>
        <Text style={{ color: cores.texto, fontWeight: '800', fontSize: 19 }}>Logo do estabelecimento</Text>
        <Text style={{ color: cores.textoSecundario }}>Use seu logo ou deixe a área limpa se a marca já estiver no banner. A capa não será alterada.</Text>
        {config ? <>{OPCOES_LOGO_ESTABELECIMENTO.map((o) => <Pressable key={o.modo} accessibilityRole="radio" accessibilityState={{ checked: config.logoModo === o.modo, disabled: salvando }} disabled={salvando} onPress={() => setConfig({ ...config, logoModo: o.modo })} style={{ minHeight: 48, padding: 12, borderWidth: 1, borderRadius: 10, borderColor: config.logoModo === o.modo ? cores.destaque : cores.borda }}><Text style={{ color: cores.texto }}>{config.logoModo === o.modo ? '● ' : '○ '}{o.titulo}</Text></Pressable>)}
        {config.logoModo === 'PERSONALIZADO' ? <SeletorImagem finalidade="LOGO" titulo="Enviar ou escolher seu logo" valor={config.logoURL} disabled={salvando} alterar={(url, id) => { setConfig({ ...config, logoURL: url }); setMidiaId(id ?? undefined) }} /> : null}
        <Text style={{ color: cores.textoSecundario }}>PNG transparente é recomendado. JPEG, PNG ou WebP, até 5 MB, sem recorte.</Text>
        <Pressable accessibilityRole="button" disabled={salvando || config.logoModo === 'PERSONALIZADO' && !config.logoURL} onPress={salvar} style={{ minHeight: 48, padding: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: cores.destaque, opacity: salvando || config.logoModo === 'PERSONALIZADO' && !config.logoURL ? 0.5 : 1 }}><Text style={{ color: cores.destaqueTexto, fontWeight: '800' }}>{salvando ? 'Salvando...' : 'Salvar logo'}</Text></Pressable></> : null}
        {mensagem ? <Text accessibilityRole="text" style={{ color: cores.texto }}>{mensagem}</Text> : null}
    </View>
}
