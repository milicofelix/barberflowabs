import { useEffect, useState } from 'react'
import { Image, Text, View } from 'react-native'
import { iniciaisUsuario } from '@uniflowabs/core'
import { urlMidia } from './SeletorImagem'

export default function AvatarUsuario({ nome, fotoURL, tamanho = 96 }: { nome: string; fotoURL?: string | null; tamanho?: number }) {
    const [falhou, setFalhou] = useState(false)
    useEffect(() => setFalhou(false), [fotoURL])
    const estilo = { width: tamanho, height: tamanho, borderRadius: tamanho / 2 }
    return fotoURL && !falhou ? <Image accessibilityLabel={`Foto de ${nome}`} source={{ uri: urlMidia(fotoURL), cache: 'force-cache' }} onError={() => setFalhou(true)} style={estilo} />
        : <View accessibilityLabel={`Perfil de ${nome}`} style={[estilo, { backgroundColor: '#635BDB', borderColor: '#60A5FA', borderWidth: 2, alignItems: 'center', justifyContent: 'center' }]}><Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: tamanho / 3 }}>{iniciaisUsuario(nome)}</Text></View>
}
