import { BadRequestException, Controller, Get, Param, Put, Query, Body, Req, Post } from '@nestjs/common';
import { UsuarioLogado } from 'src/shared/usuario.decorator';
import { Usuario } from '@uniflowabs/core';
import {
  validarData,
  validarHorario,
  validarNumeroInteiroNaoNegativo,
  validarNumeroInteiroPositivo,
} from 'src/shared/validacao';
import { AgendaPrisma } from './agenda.prisma';
import { ConfiguracaoAgendaDto } from './agenda.dto';
import { TenantService } from 'src/shared/tenant.service';
import { MotorAgendaService } from 'src/motor-agenda/motor-agenda.service';
import { ConsultarDisponibilidadeDto } from 'src/motor-agenda/motor-agenda.dto';
import { ConflitoAgendaError } from 'src/motor-agenda/conflito-agenda.error';
import { EquipePolicy } from 'src/equipe/equipe.policy';

@Controller('agenda')
export class AgendaController {
  constructor(
    private readonly repo: AgendaPrisma,
    private readonly tenant: TenantService,
    private readonly motor: MotorAgendaService,
    private readonly equipePolicy: EquipePolicy,
  ) {}

  @Post('disponibilidade')
  async consultarDisponibilidade(
    @Body() dados: ConsultarDisponibilidadeDto,
    @UsuarioLogado() usuario: Usuario,
    @Req() req: any,
  ) {
    const estabelecimentoId = await this.resolverEstabelecimentoAgenda(req, usuario);
    try {
      return await this.motor.consultarDisponibilidade(estabelecimentoId, dados);
    } catch (error: any) {
      if (error instanceof ConflitoAgendaError) {
        return { disponivel: false, motivo: error.message };
      }
      throw error;
    }
  }

  @Get('configuracao/horarios')
  async buscarConfiguracao(@UsuarioLogado() usuario: Usuario) {
    await this.validarPermissaoConfiguracao(usuario);
    return this.repo.buscarConfiguracao(usuario.estabelecimentoId);
  }

  @Put('configuracao/horarios')
  async salvarConfiguracao(
    @Body() dados: ConfiguracaoAgendaDto,
    @UsuarioLogado() usuario: Usuario,
  ) {
    await this.validarPermissaoConfiguracao(usuario);
    this.validarConfiguracao(dados);
    return this.repo.salvarConfiguracao(usuario.estabelecimentoId, dados);
  }

  @Get('horarios/:data')
  async buscarHorariosDisponiveis(
    @Param('data') data: string,
    @Query('profissionalId') profissionalId: string | undefined,
    @Query('unidadeId') unidadeId: string | undefined,
    @UsuarioLogado() usuario: Usuario,
    @Req() req: any,
  ) {
    validarData(data);

    if (profissionalId) {
      validarNumeroInteiroPositivo(profissionalId, 'Profissional');
    }

    if (unidadeId) {
      validarNumeroInteiroPositivo(unidadeId, 'Unidade');
    }

    const estabelecimentoId = await this.resolverEstabelecimentoAgenda(req, usuario);

    return this.repo.buscarHorariosDisponiveis({
      estabelecimentoId,
      data,
      profissionalId: profissionalId ? Number(profissionalId) : undefined,
      unidadeId: unidadeId ? Number(unidadeId) : undefined,
    });
  }

  private validarPermissaoConfiguracao(usuario: Usuario) {
    return this.equipePolicy.validarPermissao(usuario, 'CONFIGURACOES_GERENCIAR');
  }

  private async resolverEstabelecimentoAgenda(req: any, usuario: Usuario) {
    return this.tenant.resolverEstabelecimentoId(req);
  }

  private validarConfiguracao(dados: ConfiguracaoAgendaDto) {
    validarNumeroInteiroNaoNegativo(dados?.antecedenciaMinutos, 'Antecedência');

    if (!Array.isArray(dados?.horarios)) {
      throw new BadRequestException('Horários de funcionamento são obrigatórios');
    }

    dados.horarios.forEach((horario) => {
      validarNumeroInteiroNaoNegativo(horario.diaSemana, 'Dia da semana');
      if (horario.diaSemana > 6) {
        throw new BadRequestException('Dia da semana inválido');
      }

      validarHorario(horario.inicio, 'Início');
      validarHorario(horario.fim, 'Fim');

      if (horario.intervaloInicio || horario.intervaloFim) {
        validarHorario(horario.intervaloInicio, 'Início do intervalo');
        validarHorario(horario.intervaloFim, 'Fim do intervalo');
      }

      if (horario.inicio >= horario.fim) {
        throw new BadRequestException('Horário de início deve ser menor que o fim');
      }
    });
  }
}
