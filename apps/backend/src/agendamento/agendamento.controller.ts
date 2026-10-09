import {
  Usuario,
  Agendamento,
  TEMPO_SLOT,
} from '@barbabrutal/core';
import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Req,
  HttpException,
} from '@nestjs/common';

import { UsuarioLogado } from 'src/shared/usuario.decorator';
import { AgendamentoPrisma } from './agendamento.prisma';
import { AvaliarAgendamentoDto } from './agendamento.dto';
import {
  validarData,
  validarNumeroInteiroPositivo,
} from 'src/shared/validacao';
import { PlanoLimitesService } from 'src/saas/plano-limites.service';
import { TenantService } from 'src/shared/tenant.service';
import { MotorAgendaService } from 'src/motor-agenda/motor-agenda.service';
import {
  CriarAgendamentoUniversalDto,
  ReagendarAgendamentoDto,
} from 'src/motor-agenda/motor-agenda.dto';
import { ConflitoAgendaError } from 'src/motor-agenda/conflito-agenda.error';

@Controller('agendamentos')
export class AgendamentoController {
  constructor(
    private readonly repo: AgendamentoPrisma,
    private readonly limites: PlanoLimitesService,
    private readonly tenant: TenantService,
    private readonly motor: MotorAgendaService,
  ) {}

  @Post()
  async novoAgendamento(
    @Body() dados: CriarAgendamentoUniversalDto,
    @UsuarioLogado() usuario: Usuario,
    @Req() req: any,
  ) {
    const barbeariaId = await this.resolverBarbeariaAgendamento(req, usuario);
    await this.limites.validarBarbeariaOperacional(barbeariaId);

    try {
      return await this.motor.criar(barbeariaId, dados, usuario);
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      if (error instanceof ConflitoAgendaError) throw new ConflictException(error.message);
      throw new ConflictException(error?.message ?? 'Não foi possível criar o agendamento');
    }
  }

  @Put(':id/reagendar')
  async reagendar(
    @Param('id') id: string,
    @Body() dados: ReagendarAgendamentoDto,
    @UsuarioLogado() usuario: Usuario,
    @Req() req: any,
  ) {
    validarNumeroInteiroPositivo(id, 'Agendamento');
    const barbeariaId = await this.resolverBarbeariaAgendamento(req, usuario);
    await this.limites.validarBarbeariaOperacional(barbeariaId);

    try {
      return await this.motor.reagendar(Number(id), barbeariaId, dados, usuario);
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      if (error instanceof ConflitoAgendaError) throw new ConflictException(error.message);
      throw new BadRequestException(error?.message ?? 'Não foi possível reagendar');
    }
  }

  @Get()
  async buscarAgendamentosCliente(@UsuarioLogado() usuario: Usuario, @Req() req: any) {
    const barbeariaId = await this.resolverBarbeariaAgendamento(req, usuario);
    return this.repo.buscarPorEmail(usuario.email, barbeariaId);
  }

  @Post(':id/avaliacao')
  async avaliarAgendamento(
    @Param('id') id: string,
    @Body() dados: AvaliarAgendamentoDto,
    @UsuarioLogado() usuario: Usuario,
  ) {
    validarNumeroInteiroPositivo(id, 'Agendamento');
    this.validarAvaliacao(dados);

    try {
      const avaliacao = await this.repo.avaliar(
        Number(id),
        usuario.id!,
        Number(dados.nota),
        dados.comentario,
      );

      if (!avaliacao) throw new NotFoundException('Agendamento não encontrado');
      return avaliacao;
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      if (error?.message?.includes('já foi avaliado')) {
        throw new ConflictException(error.message);
      }
      throw new BadRequestException(error?.message ?? 'Não foi possível avaliar o atendimento');
    }
  }

  @Get(':profissional/:data')
  async buscarAgendaProfissionalPorDia(
    @Param('profissional') profissional: string,
    @Param('data') data: string,
    @UsuarioLogado() usuario: Usuario,
    @Req() req: any,
  ) {
    validarNumeroInteiroPositivo(profissional, 'Profissional');
    validarData(data);
    const barbeariaId = await this.resolverBarbeariaAgendamento(req, usuario);

    return this.repo.buscarPorProfissionalEData(
      +profissional,
      new Date(data),
      barbeariaId,
    );
  }

  @Get('ocupacao/:profissional/:data')
  async buscarOcupacaoPorProfissionalEData(
    @Param('profissional') profissional: string,
    @Param('data') dataParam: string,
    @UsuarioLogado() usuario: Usuario,
    @Req() req: any,
  ) {
    validarNumeroInteiroPositivo(profissional, 'Profissional');
    validarData(dataParam);
    const barbeariaId = await this.resolverBarbeariaAgendamento(req, usuario);

    const agendamentos = await this.repo.buscarPorProfissionalEData(
      +profissional,
      new Date(dataParam),
      barbeariaId,
    );

    return agendamentos
      .map((agendamento) => {
        const inicio = agendamento.inicioOcupacao ?? agendamento.data;
        const fim = agendamento.fimOcupacao
          ?? new Date(
            agendamento.data.getTime()
              + agendamento.servicos.reduce(
                (total, servico) => total + (servico.duracaoMinutos ?? servico.qtdeSlots! * TEMPO_SLOT),
                0,
              ) * 60_000,
          );
        return {
          data: inicio,
          slots: Math.ceil((fim.getTime() - inicio.getTime()) / (TEMPO_SLOT * 60_000)),
        };
      })
      .reduce((horariosOcupados: Date[], dados: any) => {
        const horario = dados.data;
        const slots = dados.slots;
        const horarios = Array.from({ length: slots }, (_, i) =>
          new Date(horario.getTime() + i * TEMPO_SLOT * 60000),
        );
        return [...horariosOcupados, ...horarios];
      }, [])
      .map((data) => this.formatarHorarioLocal(data));
  }

  @Delete(':id')
  async excluirAgendamento(
    @Param('id') id: string,
    @UsuarioLogado() usuario: Usuario,
    @Req() req: any,
  ) {
    validarNumeroInteiroPositivo(id, 'Agendamento');
    const barbeariaId = await this.resolverBarbeariaAgendamento(req, usuario);
    let agendamento: Agendamento | null;
    const podeCancelarComoBarbeiro = !!usuario.barbeiro && usuario.barbeariaId === barbeariaId;

    try {
      agendamento = await this.repo.cancelar(Number(id), usuario.id!, barbeariaId, podeCancelarComoBarbeiro);
    } catch (error: any) {
      throw new BadRequestException(error?.message ?? 'Não foi possível cancelar o agendamento');
    }

    if (!agendamento) {
      throw new NotFoundException('Agendamento não encontrado para cancelamento');
    }

    return agendamento;
  }

  private async resolverBarbeariaAgendamento(req: any, usuario: Usuario) {
    return this.tenant.resolverBarbeariaId(req);
  }

  private formatarHorarioLocal(data: Date) {
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).format(data);
  }

  private validarAvaliacao(dados: AvaliarAgendamentoDto) {
    const nota = Number(dados?.nota);

    if (!Number.isInteger(nota) || nota < 1 || nota > 5) {
      throw new BadRequestException('Nota deve ser um número inteiro entre 1 e 5');
    }

    if (dados?.comentario && dados.comentario.length > 1000) {
      throw new BadRequestException('Comentário deve ter no máximo 1000 caracteres');
    }
  }
}
