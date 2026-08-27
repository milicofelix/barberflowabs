import { BadRequestException, Controller, ForbiddenException, Get, Param, Put, Query, Body, Req } from '@nestjs/common';
import { UsuarioLogado } from 'src/shared/usuario.decorator';
import { Usuario } from '@barbabrutal/core';
import {
  validarData,
  validarHorario,
  validarNumeroInteiroNaoNegativo,
  validarNumeroInteiroPositivo,
} from 'src/shared/validacao';
import { AgendaPrisma } from './agenda.prisma';
import { ConfiguracaoAgendaDto } from './agenda.dto';
import { TenantService } from 'src/shared/tenant.service';

@Controller('agenda')
export class AgendaController {
  constructor(
    private readonly repo: AgendaPrisma,
    private readonly tenant: TenantService,
  ) {}

  @Get('configuracao/horarios')
  buscarConfiguracao(@UsuarioLogado() usuario: Usuario) {
    this.validarPermissaoConfiguracao(usuario);
    return this.repo.buscarConfiguracao(usuario.barbeariaId);
  }

  @Put('configuracao/horarios')
  salvarConfiguracao(
    @Body() dados: ConfiguracaoAgendaDto,
    @UsuarioLogado() usuario: Usuario,
  ) {
    this.validarPermissaoConfiguracao(usuario);
    this.validarConfiguracao(dados);
    return this.repo.salvarConfiguracao(usuario.barbeariaId, dados);
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

    const barbeariaId = await this.resolverBarbeariaAgenda(req, usuario);

    return this.repo.buscarHorariosDisponiveis({
      barbeariaId,
      data,
      profissionalId: profissionalId ? Number(profissionalId) : undefined,
      unidadeId: unidadeId ? Number(unidadeId) : undefined,
    });
  }

  private validarPermissaoConfiguracao(usuario: Usuario) {
    if (!usuario.barbeiro) {
      throw new ForbiddenException('Apenas barbeiros podem alterar configurações da agenda');
    }
  }

  private async resolverBarbeariaAgenda(req: any, usuario: Usuario) {
    return this.tenant.resolverBarbeariaId(req);
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
