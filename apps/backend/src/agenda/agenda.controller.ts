import { Controller, Get, Param, Query } from '@nestjs/common';
import { UsuarioLogado } from 'src/shared/usuario.decorator';
import { Usuario } from '@barbabrutal/core';
import { validarData, validarNumeroInteiroPositivo } from 'src/shared/validacao';
import { AgendaPrisma } from './agenda.prisma';

@Controller('agenda')
export class AgendaController {
  constructor(private readonly repo: AgendaPrisma) {}

  @Get('horarios/:data')
  buscarHorariosDisponiveis(
    @Param('data') data: string,
    @Query('profissionalId') profissionalId: string | undefined,
    @Query('unidadeId') unidadeId: string | undefined,
    @UsuarioLogado() usuario: Usuario,
  ) {
    validarData(data);

    if (profissionalId) {
      validarNumeroInteiroPositivo(profissionalId, 'Profissional');
    }

    if (unidadeId) {
      validarNumeroInteiroPositivo(unidadeId, 'Unidade');
    }

    return this.repo.buscarHorariosDisponiveis({
      barbeariaId: usuario.barbeariaId,
      data,
      profissionalId: profissionalId ? Number(profissionalId) : undefined,
      unidadeId: unidadeId ? Number(unidadeId) : undefined,
    });
  }
}
