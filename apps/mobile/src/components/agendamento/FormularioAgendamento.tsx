import { StyleSheet, Text, View } from 'react-native'
import CampoDataHora from '../shared/CampoDataHora'
import CampoProfissional from '../shared/CampoProfissional'
import CampoServicos from '../shared/CampoServicos'
import Passos from '../shared/Passos'
import React from 'react'
import useAgendamento from '../../data/hooks/useAgendamento'

export interface FormularioAgendamentoProps {
    finalizar: () => void
}

export default function FormularioAgendamento(props: FormularioAgendamentoProps) {
    const {
        profissional,
        servicos,
        data,
        horariosOcupados,
        selecionarProfissional,
        selecionarServicos,
        selecionarData,
        podeAgendar,
        qtdeHorarios,
    } = useAgendamento()

    return (
        <View style={styles.container}>
            <Text style={styles.titulo}>Agende seu horário</Text>
            <Passos
                labels={['Profissional', 'Serviços', 'Horário']}
                permiteProximoPasso={[!!profissional, servicos.length > 0, podeAgendar()]}
                labelAcao="Confirmar"
                acao={props.finalizar}
            >
                <CampoProfissional value={profissional} onChange={selecionarProfissional} />
                <CampoServicos value={servicos} onChange={selecionarServicos} />
                <CampoDataHora
                    value={data}
                    onChange={selecionarData}
                    qtdeHorarios={qtdeHorarios()}
                    horariosOcupados={horariosOcupados}
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
