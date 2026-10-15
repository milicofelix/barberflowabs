import { Body, Controller, Get, Param, Put, Post } from '@nestjs/common';
import { Usuario, ConfiguracaoFluxoAtendimento } from '@uniflowabs/core';
import { UsuarioLogado } from 'src/shared/usuario.decorator';
import { validarNumeroInteiroPositivo } from 'src/shared/validacao';
import { EquipePolicy } from 'src/equipe/equipe.policy';
import { OperacaoFluxoService } from './operacao-fluxo.service';

@Controller('atendimentos/operacao')
export class OperacaoFluxoController {
  constructor(private readonly fluxo: OperacaoFluxoService, private readonly equipe: EquipePolicy) {}
  @Get('configuracao')
  async configuracao(@UsuarioLogado() usuario: Usuario) {
    await this.equipe.validarPermissao(usuario, 'CONFIGURACOES_GERENCIAR');
    return this.fluxo.configuracao(usuario.estabelecimentoId);
  }
  @Put('configuracao')
  async configurar(@UsuarioLogado() usuario: Usuario, @Body() dados: ConfiguracaoFluxoAtendimento) {
    await this.equipe.validarPermissao(usuario, 'CONFIGURACOES_GERENCIAR');
    return this.fluxo.configurar(usuario.estabelecimentoId, usuario.id, dados);
  }
  @Get('monitoramento')
  async monitorar(@UsuarioLogado() usuario: Usuario) {
    await this.equipe.validarPermissao(usuario, 'CONFIGURACOES_GERENCIAR');
    return this.fluxo.monitorar(usuario.estabelecimentoId);
  }
  @Post('tarefas/:id/reprocessar')
  async reprocessar(@UsuarioLogado() usuario: Usuario, @Param('id') id: string) {
    await this.equipe.validarPermissao(usuario, 'CONFIGURACOES_GERENCIAR');
    validarNumeroInteiroPositivo(id, 'Tarefa');
    return this.fluxo.reprocessar(usuario.estabelecimentoId, usuario.id, Number(id));
  }
}
