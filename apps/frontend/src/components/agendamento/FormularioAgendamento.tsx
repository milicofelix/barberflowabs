import CampoDataHora from '../shared/formulario/CampoDataHora'
import CampoProfissional from '../profissional/CampoProfissional'
import CampoServicos from '../servico/CampoServicos'
import useAgendamento from '@/data/hooks/useAgendamento'
import Passos from '../shared/Passos'
import Sumario from './Sumario'

export default function FormularioAgendamento() {
    const {
        profissional,
        servicos,
        data,
        horariosOcupados,
        selecionarProfissional,
        selecionarServicos,
        selecionarData,
        agendar,
        podeAgendar,
        qtdeHorarios,
    } = useAgendamento()

    return (
        <div className="flex gap-10">
            <Passos
                labels={['Selecione o Profissional', 'Selecione os Serviços', 'Escolha o Horário']}
                permiteProximoPasso={[!!profissional, servicos.length > 0, podeAgendar()]}
                acao={agendar}
                labelAcao="Agendar"
            >
                <CampoProfissional
                    label="Profissionais disponíveis"
                    value={profissional}
                    onChange={selecionarProfissional}
                    className="input"
                />
                <CampoServicos
                    label="Serviços disponíveis"
                    value={servicos}
                    onChange={selecionarServicos}
                    className="input"
                />
                <CampoDataHora
                    label="Data e Hora"
                    value={data}
                    onChange={(d) => selecionarData(d!)}
                    horariosOcupados={horariosOcupados}
                    className="input"
                    qtdeHorarios={qtdeHorarios()}
                />
            </Passos>
            <Sumario />
        </div>
    )
}
