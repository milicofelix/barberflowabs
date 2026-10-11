import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { Usuario } from '@uniflowabs/core';
import { validarNumeroInteiroPositivo } from 'src/shared/validacao';
import { UsuarioLogado } from 'src/shared/usuario.decorator';
import { EnviarSolicitacaoEstabelecimentoDto, SalvarSolicitacaoEstabelecimentoDto } from './solicitacao-estabelecimento.dto';
import { SolicitacaoEstabelecimentoService } from './solicitacao-estabelecimento.service';

@Controller('solicitacoes-estabelecimento')
export class SolicitacaoEstabelecimentoController {
  constructor(private readonly service: SolicitacaoEstabelecimentoService) {}

  @Get()
  listar(@UsuarioLogado() usuario: Usuario) {
    return this.service.listar(usuario.id!);
  }

  @Post()
  criarRascunho(@UsuarioLogado() usuario: Usuario) {
    return this.service.criarRascunho(usuario.id!);
  }

  @Get('configuracao')
  configuracao() {
    return this.service.configuracao();
  }

  @Get(':id')
  obter(@Param('id') id: string, @UsuarioLogado() usuario: Usuario) {
    validarNumeroInteiroPositivo(id, 'Solicitação');
    return this.service.obter(Number(id), usuario.id!);
  }

  @Put(':id')
  salvar(@Param('id') id: string, @Body() dados: SalvarSolicitacaoEstabelecimentoDto, @UsuarioLogado() usuario: Usuario) {
    validarNumeroInteiroPositivo(id, 'Solicitação');
    return this.service.salvar(Number(id), usuario.id!, dados);
  }

  @Post(':id/enviar')
  enviar(@Param('id') id: string, @Body() dados: EnviarSolicitacaoEstabelecimentoDto, @UsuarioLogado() usuario: Usuario) {
    validarNumeroInteiroPositivo(id, 'Solicitação');
    return this.service.enviar(Number(id), usuario.id!, dados);
  }
}
