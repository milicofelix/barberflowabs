import { StyleSheet, Text, View } from 'react-native'
import CampoDataHora from '../shared/CampoDataHora'
import CampoProfissional from '../shared/CampoProfissional'
import CampoServicos from '../shared/CampoServicos'
import Passos from '../shared/Passos'
import React from 'react'
import useAgendamento from '../../data/hooks/useAgendamento'
import useTema from '@/src/data/contexts/ContextoTema'

export interface FormularioAgendamentoProps {
    finalizar: () => void
    titulo?: string
    labelAcao?: string
}

export default function FormularioAgendamento(props: FormularioAgendamentoProps) {
    const { cores } = useTema()
    const {
        profissional,
        servicos,
        data,
        horariosOcupados,
        horariosDisponiveis,
        selecionarProfissional,
        selecionarServicos,
        selecionarData,
        podeAgendar,
        qtdeHorarios,
    } = useAgendamento()

    return (
        <View style={styles.container}>
            <Text style={[styles.titulo, { color: cores.texto }]}>{props.titulo ?? 'Agende seu horário'}</Text>
            <Passos
                labels={['Profissional', 'Serviços', 'Horário']}
                permiteProximoPasso={[!!profissional, servicos.length > 0, podeAgendar()]}
                labelAcao={props.labelAcao ?? 'Confirmar'}
                acao={props.finalizar}
            >
                <CampoProfissional value={profissional} onChange={selecionarProfissional} />
                <CampoServicos value={servicos} onChange={selecionarServicos} />
                <CampoDataHora
                    value={data}
                    onChange={selecionarData}
                    qtdeHorarios={qtdeHorarios()}
                    horariosOcupados={horariosOcupados}
                    horariosDisponiveis={horariosDisponiveis}
                />
            </Passos>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        width: '100%',
        marginBottom: 20,
    },
    titulo: {
        color: 'white',
        fontSize: 30,
        fontWeight: '700',
        textAlign: 'center',
    },
})
