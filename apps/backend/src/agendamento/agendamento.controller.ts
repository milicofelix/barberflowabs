import {
  Usuario,
  TEMPO_SLOT,
} from '@uniflowabs/core';
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
import { FluxoAtendimentoService } from 'src/gestao/fluxo-atendimento.service';

@Controller('agendamentos')
export class AgendamentoController {
  constructor(
    private readonly repo: AgendamentoPrisma,
    private readonly limites: PlanoLimitesService,
    private readonly tenant: TenantService,
    private readonly motor: MotorAgendaService,
    private readonly fluxoAtendimento: FluxoAtendimentoService,
  ) {}

  @Post()
  async novoAgendamento(
    @Body() dados: CriarAgendamentoUniversalDto,
    @UsuarioLogado() usuario: Usuario,
    @Req() req: any,
  ) {
    const estabelecimentoId = await this.resolverEstabelecimentoAgendamento(req, usuario);
    await this.limites.validarEstabelecimentoOperacional(estabelecimentoId);

    try {
      return await this.motor.criar(estabelecimentoId, dados, usuario);
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
    const estabelecimentoId = await this.resolverEstabelecimentoAgendamento(req, usuario);
    await this.limites.validarEstabelecimentoOperacional(estabelecimentoId);

    try {
      return await this.motor.reagendar(Number(id), estabelecimentoId, dados, usuario);
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      if (error instanceof ConflitoAgendaError) throw new ConflictException(error.message);
      throw new BadRequestException(error?.message ?? 'Não foi possível reagendar');
    }
  }

  @Get()
  async buscarAgendamentosCliente(@UsuarioLogado() usuario: Usuario, @Req() req: any) {
    const estabelecimentoId = await this.resolverEstabelecimentoAgendamento(req, usuario);
    return this.repo.buscarPorEmail(usuario.email, estabelecimentoId);
  }

  @Get('ativos')
  buscarAgendamentosAtivos(@UsuarioLogado() usuario: Usuario) {
    return this.repo.buscarAtivosPorUsuario(usuario.id!);
  }

  @Get('meus')
  buscarMeusAgendamentos(@UsuarioLogado() usuario: Usuario) {
    return this.repo.buscarPorUsuario(usuario.id!);
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
    const estabelecimentoId = await this.resolverEstabelecimentoAgendamento(req, usuario);

    return this.repo.buscarPorProfissionalEData(
      +profissional,
      new Date(data),
      estabelecimentoId,
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
    const estabelecimentoId = await this.resolverEstabelecimentoAgendamento(req, usuario);

    const agendamentos = await this.repo.buscarPorProfissionalEData(
      +profissional,
      new Date(dataParam),
      estabelecimentoId,
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
    const estabelecimentoId = await this.resolverEstabelecimentoAgendamento(req, usuario);
    const podeCancelarComoMembro = !!usuario.membroEstabelecimento && usuario.estabelecimentoId === estabelecimentoId;

    try {
      const cancelavel = await this.repo.buscarParaCancelar(
        Number(id), usuario.id!, estabelecimentoId, podeCancelarComoMembro,
      );
      if (!cancelavel) throw new NotFoundException('Agendamento não encontrado para cancelamento');
      return await this.fluxoAtendimento.alterarManual(
        cancelavel.id,
        cancelavel.estabelecimentoId,
        'CANCELADO',
        usuario.id!,
        'Cancelamento solicitado no aplicativo',
      );
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(error?.message ?? 'Não foi possível cancelar o agendamento');
    }
  }

  @Delete('meus/:id')
  async cancelarMeuAgendamento(
    @Param('id') id: string,
    @UsuarioLogado() usuario: Usuario,
  ) {
    validarNumeroInteiroPositivo(id, 'Agendamento');

    try {
      const cancelavel = await this.repo.buscarParaCancelar(Number(id), usuario.id!, undefined, false);
      if (!cancelavel) {
        throw new NotFoundException('Agendamento não encontrado para cancelamento');
      }
      return await this.fluxoAtendimento.alterarManual(
        cancelavel.id,
        cancelavel.estabelecimentoId,
        'CANCELADO',
        usuario.id!,
        'Cancelamento solicitado pelo cliente',
      );
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(error?.message ?? 'Não foi possível cancelar o agendamento');
    }
  }

  private async resolverEstabelecimentoAgendamento(req: any, usuario: Usuario) {
    return this.tenant.resolverEstabelecimentoId(req);
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
