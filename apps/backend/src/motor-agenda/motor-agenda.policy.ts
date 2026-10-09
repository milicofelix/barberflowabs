import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { MODELOS_ATENDIMENTO, ModeloAtendimento } from 'src/estabelecimento/estabelecimento.constants';
import { ConsultarDisponibilidadeDto, CriarAgendamentoUniversalDto, ServicoAgenda } from './motor-agenda.dto';

@Injectable()
export class MotorAgendaPolicy {
  validarCriacao(dados: CriarAgendamentoUniversalDto, usuario: any) {
    if (Number(dados?.usuario?.id) !== Number(usuario?.id)) {
      throw new ForbiddenException('Não é possível criar um agendamento para outro usuário');
    }
    this.validarData(dados?.data);
    this.validarId(dados?.profissional?.id, 'Profissional');
    const ids = dados?.servicos?.map((servico) => servico?.id);
    this.validarIds(ids, 'Serviços');
    this.validarDeslocamento(dados?.deslocamentoMinutos);
  }

  validarDisponibilidade(dados: ConsultarDisponibilidadeDto) {
    this.validarData(dados?.data);
    this.validarId(dados?.profissionalId, 'Profissional');
    this.validarIds(dados?.servicoIds, 'Serviços');
    this.validarDeslocamento(dados?.deslocamentoMinutos);
  }

  validarModelo(
    modelo: ModeloAtendimento,
    modeloEstabelecimento: ModeloAtendimento,
    servicos: ServicoAgenda[],
    endereco?: string | null,
  ) {
    if (!MODELOS_ATENDIMENTO.includes(modelo as any)) {
      throw new BadRequestException('Modelo de atendimento inválido');
    }
    if (modeloEstabelecimento !== 'HIBRIDO' && modeloEstabelecimento !== modelo) {
      throw new BadRequestException('Modelo de atendimento indisponível no estabelecimento');
    }
    if (servicos.some((servico) => servico.modeloAtendimento !== 'HIBRIDO' && servico.modeloAtendimento !== modelo)) {
      throw new BadRequestException('Um dos serviços não atende na modalidade selecionada');
    }
    if (modelo === 'DOMICILIAR' && !endereco?.trim()) {
      throw new BadRequestException('Endereço é obrigatório para atendimento domiciliar');
    }
  }

  validarProfissional(profissionalId: number, servicos: ServicoAgenda[]) {
    const naoHabilitado = servicos.some(
      (servico) => !servico.profissionaisHabilitados?.some(
        (vinculo) => vinculo.profissionalId === profissionalId && vinculo.ativo,
      ),
    );
    if (naoHabilitado) throw new BadRequestException('Profissional não habilitado para todos os serviços');
  }

  validarReagendamento(agendamento: any, usuario: any) {
    const gestor = usuario?.barbeiro && usuario?.barbeariaId === agendamento.barbeariaId;
    if (agendamento.usuarioId !== usuario?.id && !gestor) {
      throw new ForbiddenException('Usuário sem permissão para reagendar');
    }
    if (!['AGENDADO', 'CONFIRMADO'].includes(agendamento.status)) {
      throw new BadRequestException('Somente agendamentos ativos podem ser reagendados');
    }
  }

  validarData(valor: unknown) {
    const data = new Date(String(valor));
    if (Number.isNaN(data.getTime()) || data.getTime() <= Date.now()) {
      throw new BadRequestException('Data do agendamento deve estar no futuro');
    }
    return data;
  }

  validarDeslocamento(valor?: number) {
    if (valor === undefined) return;
    if (!Number.isInteger(Number(valor)) || Number(valor) < 0) {
      throw new BadRequestException('Tempo de deslocamento inválido');
    }
  }

  private validarId(valor: unknown, campo: string) {
    if (!Number.isInteger(Number(valor)) || Number(valor) <= 0) {
      throw new BadRequestException(`${campo} inválido`);
    }
  }

  private validarIds(valores: unknown, campo: string) {
    if (!Array.isArray(valores) || valores.length === 0) throw new BadRequestException(`${campo} inválidos`);
    valores.forEach((valor) => this.validarId(valor, campo));
    if (new Set(valores.map(Number)).size !== valores.length) {
      throw new BadRequestException(`${campo} não podem ser repetidos`);
    }
  }
}
