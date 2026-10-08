import EstadoVazio from '@/src/components/shared/EstadoVazio'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StyleSheet } from 'react-native'

interface Props {
    titulo: string
    descricao: string
}

function ModuloEmPreparacao({ titulo, descricao }: Props) {
    return (
        <SafeAreaView style={styles.container}>
            <EstadoVazio titulo={titulo} descricao={descricao} />
        </SafeAreaView>
    )
}

export function Operacao() {
    return (
        <ModuloEmPreparacao
            titulo="Área operacional"
            descricao="Dashboard, agenda e gestão diária serão disponibilizados nas próximas fases."
        />
    )
}

export function Configuracoes() {
    return (
        <ModuloEmPreparacao
            titulo="Configurações da barbearia"
            descricao="Horários e perfil público serão disponibilizados nas próximas fases."
        />
    )
}

export function Administracao() {
    return (
        <ModuloEmPreparacao
            titulo="Administração do software"
            descricao="A gestão global do Barber Flow ABS será disponibilizada em uma fase dedicada."
        />
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', backgroundColor: '#09090b' },
})
