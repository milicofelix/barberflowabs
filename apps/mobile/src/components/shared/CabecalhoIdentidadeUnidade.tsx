import { fundoDaHome } from '@/src/data/estabelecimentos/capas'
import useIdentidadeUnidade from '@/src/data/hooks/useIdentidadeUnidade'
import { useEffect, useState } from 'react'
import { Image, ImageBackground, StyleSheet, Text, View } from 'react-native'
import MarcaUniFlow from './MarcaUniFlow'

const imagensPreparadas = new Set<string>()

export default function CabecalhoIdentidadeUnidade({ destaque = false }: { destaque?: boolean }) {
    const { unidade, operacional } = useIdentidadeUnidade()
    const [falhou, setFalhou] = useState(false)
    const fundo = fundoDaHome(unidade, falhou)
    const chave = JSON.stringify(fundoDaHome(unidade))

    useEffect(() => setFalhou(false), [chave])
    useEffect(() => {
        if (fundo && typeof fundo === 'object' && 'uri' in fundo && fundo.uri && !imagensPreparadas.has(fundo.uri)) {
            const uri = fundo.uri
            Image.prefetch(uri).then((ok) => { if (ok) imagensPreparadas.add(uri) }).catch(() => {})
        }
    }, [chave, fundo])

    if (!operacional) return null
    const estiloHero = destaque ? styles.heroDestaque : styles.heroCompacto
    const estiloSobreposicao = destaque ? styles.sobreposicaoDestaque : styles.sobreposicaoCompacta
    const conteudo = <View style={[styles.sobreposicao, estiloSobreposicao]}>
        <View style={styles.marca}><MarcaUniFlow horizontal contraste exibirSlogan={destaque} /></View>
        <View>
            <Text style={styles.rotulo}>SUA UNIDADE</Text>
            <Text numberOfLines={2} style={[styles.titulo, destaque ? styles.tituloDestaque : styles.tituloCompacto]}>
                {unidade?.nomePublico || unidade?.nome || 'Seu estabelecimento'}
            </Text>
            {destaque ? <Text style={styles.descricao}>Acompanhe sua operação e os próximos atendimentos.</Text> : null}
        </View>
    </View>

    return fundo
        ? <ImageBackground source={fundo} onError={() => setFalhou(true)} resizeMode="cover" style={[styles.hero, estiloHero]} imageStyle={styles.imagem}>{conteudo}</ImageBackground>
        : <View style={[styles.hero, estiloHero, styles.semImagem]}>{conteudo}</View>
}

const styles = StyleSheet.create({
    hero: { marginHorizontal: -18, overflow: 'hidden', borderBottomLeftRadius: 22, borderBottomRightRadius: 22 },
    heroDestaque: { minHeight: 250, marginTop: -18, marginBottom: 12 },
    heroCompacto: { minHeight: 250, marginTop: -18, marginBottom: 12 },
    imagem: { borderBottomLeftRadius: 22, borderBottomRightRadius: 22 },
    semImagem: { backgroundColor: '#172554' },
    sobreposicao: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 20, backgroundColor: 'rgba(3,8,24,.56)' },
    sobreposicaoDestaque: { minHeight: 250, paddingTop: 18, paddingBottom: 22 },
    sobreposicaoCompacta: { minHeight: 250, paddingTop: 18, paddingBottom: 22 },
    marca: { alignSelf: 'flex-start', maxWidth: '72%', paddingRight: 7, borderRadius: 16, backgroundColor: 'rgba(3,8,24,.52)' },
    rotulo: { color: '#F2C35B', fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
    titulo: { color: '#FFFFFF', fontWeight: '900', marginTop: 4, textShadowColor: 'rgba(0,0,0,.85)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 5 },
    tituloDestaque: { fontSize: 28, lineHeight: 33 },
    tituloCompacto: { fontSize: 21, lineHeight: 25 },
    descricao: { color: '#F1F5F9', lineHeight: 20, marginTop: 5, textShadowColor: 'rgba(0,0,0,.9)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
})
