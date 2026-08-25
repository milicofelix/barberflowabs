import { DateUtils } from '@barbabrutal/core'
import { View } from 'react-native'
import CampoDia from './CampoDia'
import CampoHorario from './CampoHorario'

export interface CampoDataHoraProps {
    value: Date | null
    qtdeHorarios: number
    horariosOcupados: string[]
    onChange: (data: Date) => void
}

export default function CampoDataHora(props: CampoDataHoraProps) {
    const { qtdeHorarios, onChange } = props
    const data = props.value ?? DateUtils.hojeComHoraZerada()

    return (
        <View>
            <CampoDia value={data} onChange={onChange} />
            <CampoHorario
                value={data}
                qtdeHorarios={qtdeHorarios}
                horariosOcupados={props.horariosOcupados}
                onChange={onChange}
            />
        </View>
    )
}
