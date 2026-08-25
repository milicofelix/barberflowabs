import { DateUtils } from '@barbabrutal/core'
import CampoDia from './CampoDia'
import CampoHorario from './CampoHorario'

export interface CampoDataHoraProps
    extends Omit<React.SelectHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
    label?: string
    value: Date | null
    qtdeHorarios: number
    horariosOcupados: string[]
    onChange: (value: Date | null) => void
}

export default function CampoDataHora(props: CampoDataHoraProps) {
    const data = props.value ?? DateUtils.hojeComHoraZerada()
    return (
        <div className="flex flex-col gap-6">
            <CampoDia label="Dias Disponíveis" value={data} onChange={props.onChange} />
            <CampoHorario
                label="Horários Disponíveis"
                qtdeHorarios={props.qtdeHorarios}
                horariosOcupados={props.horariosOcupados}
                value={data}
                onChange={props.onChange}
            />
        </div>
    )
}
