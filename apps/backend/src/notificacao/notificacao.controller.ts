import { Controller, Get, Param, Put } from '@nestjs/common';
import { Usuario } from '@uniflowabs/core';
import { validarNumeroInteiroPositivo } from 'src/shared/validacao';
import { UsuarioLogado } from 'src/shared/usuario.decorator';
import { NotificacaoService } from './notificacao.service';

@Controller('notificacoes')
export class NotificacaoController {
  constructor(private readonly service: NotificacaoService) {}
  @Get() listar(@UsuarioLogado() usuario: Usuario) { return this.service.listar(usuario.id!); }
  @Get('nao-lidas/total') total(@UsuarioLogado() usuario: Usuario) { return this.service.totalNaoLidas(usuario.id!); }
  @Put('ler-todas') lerTodas(@UsuarioLogado() usuario: Usuario) { return this.service.marcarTodasComoLidas(usuario.id!); }
  @Put(':id/ler') ler(@Param('id') id: string, @UsuarioLogado() usuario: Usuario) {
    validarNumeroInteiroPositivo(id, 'Notificação'); return this.service.marcarComoLida(Number(id), usuario.id!);
  }
}
