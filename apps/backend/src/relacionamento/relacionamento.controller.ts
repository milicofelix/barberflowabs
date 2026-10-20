import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { Usuario } from '@uniflowabs/core';
import { EquipePolicy } from 'src/equipe/equipe.policy';
import { validarNumeroInteiroPositivo } from 'src/shared/validacao';
import { UsuarioLogado } from 'src/shared/usuario.decorator';
import { AtualizarClienteDto, EnfileirarComunicacaoDto, ListarEnviosDto, ReprocessarEnvioDto, SalvarPreferenciasDto, SalvarTemplateDto } from './relacionamento.dto';
import { RelacionamentoService } from './relacionamento.service';

@Controller('relacionamento')
export class RelacionamentoController {
  constructor(private readonly service: RelacionamentoService, private readonly policy: EquipePolicy) {}

  @Get('clientes')
  async listarClientes(@Query('q') busca: string, @UsuarioLogado() usuario: Usuario) {
    await this.visualizar(usuario); return this.service.listarClientes(usuario.estabelecimentoId!, busca);
  }

  @Get('clientes/:id')
  async obterCliente(@Param('id') id: string, @UsuarioLogado() usuario: Usuario) {
    await this.visualizar(usuario); validarNumeroInteiroPositivo(id, 'Cliente');
    return this.service.obterCliente(Number(id), usuario.estabelecimentoId!);
  }

  @Put('clientes/:id')
  async atualizarCliente(@Param('id') id: string, @Body() dados: AtualizarClienteDto, @UsuarioLogado() usuario: Usuario) {
    await this.gerenciar(usuario); validarNumeroInteiroPositivo(id, 'Cliente');
    return this.service.atualizarCliente(Number(id), usuario.estabelecimentoId!, dados, usuario.id);
  }

  @Get('clientes/:id/preferencias')
  async listarPreferencias(@Param('id') id: string, @UsuarioLogado() usuario: Usuario) {
    await this.visualizar(usuario); validarNumeroInteiroPositivo(id, 'Cliente');
    return this.service.listarPreferencias(Number(id), usuario.estabelecimentoId!);
  }

  @Put('clientes/:id/preferencias')
  async salvarPreferencias(@Param('id') id: string, @Body() dados: SalvarPreferenciasDto, @UsuarioLogado() usuario: Usuario) {
    await this.gerenciar(usuario); validarNumeroInteiroPositivo(id, 'Cliente');
    return this.service.salvarPreferencias(Number(id), usuario.estabelecimentoId!, dados, usuario.id);
  }

  @Get('templates')
  async listarTemplates(@UsuarioLogado() usuario: Usuario) {
    await this.visualizar(usuario); return this.service.listarTemplates(usuario.estabelecimentoId!);
  }

  @Post('templates')
  async criarTemplate(@Body() dados: SalvarTemplateDto, @UsuarioLogado() usuario: Usuario) {
    await this.gerenciar(usuario); return this.service.salvarTemplate(usuario.estabelecimentoId!, dados, undefined, usuario.id);
  }

  @Put('templates/:id')
  async atualizarTemplate(@Param('id') id: string, @Body() dados: SalvarTemplateDto, @UsuarioLogado() usuario: Usuario) {
    await this.gerenciar(usuario); validarNumeroInteiroPositivo(id, 'Template');
    return this.service.salvarTemplate(usuario.estabelecimentoId!, dados, Number(id), usuario.id);
  }

  @Post('envios')
  async enfileirar(@Body() dados: EnfileirarComunicacaoDto, @UsuarioLogado() usuario: Usuario) {
    await this.gerenciar(usuario); return this.service.enfileirar(usuario.estabelecimentoId!, dados, usuario.id);
  }

  @Get('envios')
  async listarEnvios(@Query() filtros: ListarEnviosDto, @UsuarioLogado() usuario: Usuario) {
    await this.visualizar(usuario); return this.service.listarEnvios(usuario.estabelecimentoId!, filtros);
  }

  @Get('envios/:id')
  async obterEnvio(@Param('id') id: string, @UsuarioLogado() usuario: Usuario) {
    await this.visualizar(usuario); validarNumeroInteiroPositivo(id, 'Envio');
    return this.service.obterEnvio(Number(id), usuario.estabelecimentoId!);
  }

  @Post('envios/:id/reprocessar')
  async reprocessar(@Param('id') id: string, @Body() dados: ReprocessarEnvioDto, @UsuarioLogado() usuario: Usuario) {
    await this.gerenciar(usuario); validarNumeroInteiroPositivo(id, 'Envio');
    return this.service.reprocessarEnvio(Number(id), usuario.estabelecimentoId!, dados, usuario.id);
  }

  private visualizar(usuario: Usuario) { return this.policy.validarPermissao(usuario, 'RELACIONAMENTO_VISUALIZAR'); }
  private gerenciar(usuario: Usuario) { return this.policy.validarPermissao(usuario, 'RELACIONAMENTO_GERENCIAR'); }
}
