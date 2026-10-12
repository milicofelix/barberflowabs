import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { Usuario } from '@uniflowabs/core';
import { validarNumeroInteiroPositivo } from 'src/shared/validacao';
import { UsuarioLogado } from 'src/shared/usuario.decorator';
import { RevisarSolicitacaoEstabelecimentoDto } from './solicitacao-estabelecimento.dto';
import { SolicitacaoEstabelecimentoService } from './solicitacao-estabelecimento.service';

@Controller('admin/solicitacoes-estabelecimento')
export class SolicitacaoEstabelecimentoAdminController {
  constructor(private readonly service: SolicitacaoEstabelecimentoService) {}

  @Get() listar(@UsuarioLogado() usuario: Usuario) { return this.service.listarPendentes(usuario.id!); }
  @Get(':id') obter(@Param('id') id: string, @UsuarioLogado() usuario: Usuario) {
    validarNumeroInteiroPositivo(id, 'Solicitação'); return this.service.obterParaRevisao(Number(id), usuario.id!);
  }
  @Put(':id/aprovar') aprovar(@Param('id') id: string, @Body() dados: RevisarSolicitacaoEstabelecimentoDto, @UsuarioLogado() usuario: Usuario) {
    validarNumeroInteiroPositivo(id, 'Solicitação'); return this.service.revisar(Number(id), usuario.id!, 'APPROVED', dados?.motivo);
  }
  @Put(':id/solicitar-correcao') corrigir(@Param('id') id: string, @Body() dados: RevisarSolicitacaoEstabelecimentoDto, @UsuarioLogado() usuario: Usuario) {
    validarNumeroInteiroPositivo(id, 'Solicitação'); return this.service.revisar(Number(id), usuario.id!, 'CORRECTION_REQUESTED', dados?.motivo);
  }
  @Put(':id/reprovar') reprovar(@Param('id') id: string, @Body() dados: RevisarSolicitacaoEstabelecimentoDto, @UsuarioLogado() usuario: Usuario) {
    validarNumeroInteiroPositivo(id, 'Solicitação'); return this.service.revisar(Number(id), usuario.id!, 'REJECTED', dados?.motivo);
  }
}
