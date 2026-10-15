import { useRef, useState } from 'react'
import { Alert, Linking } from 'react-native'
import * as Location from 'expo-location'
import { obterLocalizacaoMarketplace } from '../estabelecimentos/localizacao'

type Posicao = { lat: number; lng: number }

/** Somente ações explícitas do usuário entram neste fluxo, nunca etapas do tour. */
export default function useLocalizacaoMarketplace(aplicar: (posicao: Posicao, raioKm: number | null) => void) {
    const [localizando, setLocalizando] = useState(false)
    const [aviso, setAviso] = useState('')
    const [negada, setNegada] = useState(false)
    const executando = useRef(false)
    async function localizar(raioKm: number | null) {
        if (executando.current) return
        executando.current = true; setLocalizando(true); setAviso('')
        try {
            const resultado = await obterLocalizacaoMarketplace({
                lerPermissao: () => Location.getForegroundPermissionsAsync(),
                solicitarPermissao: () => Location.requestForegroundPermissionsAsync(),
                explicar: () => new Promise<boolean>(resolve => Alert.alert('Usar sua localização?',
                    'Sua localização permite buscar estabelecimentos próximos e aplicar a distância escolhida. Você pode continuar sem autorizar.',
                    [{ text: 'Agora não', style: 'cancel', onPress: () => resolve(false) }, { text: 'Continuar', onPress: () => resolve(true) }],
                    { cancelable: true, onDismiss: () => resolve(false) })),
                obterPosicao: async () => {
                    const local = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
                    return { lat: local.coords.latitude, lng: local.coords.longitude }
                },
            })
            if (resultado.tipo === 'NEGADA') {
                setNegada(true)
                setAviso('A localização não está autorizada. Você pode continuar usando busca, filtros e mapa sem ela, ou habilitá-la nas configurações do aparelho.')
                return
            }
            if (resultado.tipo === 'CANCELADA') return
            setNegada(false)
            aplicar(resultado.posicao, raioKm)
        } catch {
            setAviso('Não foi possível obter sua localização agora. Tente novamente quando desejar; você pode continuar buscando sem ela.')
        } finally { executando.current = false; setLocalizando(false) }
    }
    const abrirConfiguracoes = () => { void Linking.openSettings().catch(() => setAviso('Abra as configurações do aparelho para alterar a permissão de localização.')) }
    return { localizar, localizando, aviso, negada, abrirConfiguracoes }
}
