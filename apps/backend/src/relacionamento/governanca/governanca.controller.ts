import { Body, Controller, Get, Header, Param, Post, Put, Query } from '@nestjs/common';
import { Usuario } from '@uniflowabs/core';
import { UsuarioLogado } from 'src/shared/usuario.decorator';
import { EquipePolicy } from 'src/equipe/equipe.policy';
import { idFidelidade } from '../fidelidade/fidelidade.dto';
import { periodoMetricas, cursorGovernanca } from './governanca.dto';
import { MetricasRelacionamentoRepository } from './metricas-relacionamento.repository';
import { RetencaoRelacionamentoRepository } from './retencao-relacionamento.repository';
import { PrivacidadeSolicitacaoRepository } from './privacidade-solicitacao.repository';
import { PrivacidadeExclusaoRepository } from './privacidade-exclusao.repository';
import { PrivacidadeExportacaoRepository } from './privacidade-exportacao.repository';
import { AuditoriaRelacionamentoRepository } from './auditoria-relacionamento.repository';

@Controller('relacionamento/governanca')
export class GovernancaController {
  constructor(private readonly metricas: MetricasRelacionamentoRepository, private readonly retencao: RetencaoRelacionamentoRepository, private readonly solicitacoes: PrivacidadeSolicitacaoRepository, private readonly exclusao: PrivacidadeExclusaoRepository, private readonly exportacao: PrivacidadeExportacaoRepository, private readonly auditoria: AuditoriaRelacionamentoRepository, private readonly policy: EquipePolicy) {}
  @Get('metricas') @Header('Cache-Control', 'no-store') async medir(@UsuarioLogado() u: Usuario, @Query('inicio') inicio: string, @Query('fim') fim: string, @Query('campanhaId') campanha?: string) { await this.ler(u); await this.policy.validarPermissao(u, 'FINANCEIRO_VISUALIZAR'); return this.metricas.obter(u.estabelecimentoId, periodoMetricas(inicio, fim, campanha)); }
  @Get('auditoria') @Header('Cache-Control', 'no-store') async logs(@UsuarioLogado() u: Usuario, @Query('cursor') cursor?: string) { await this.gerenciar(u); return this.auditoria.listar(u.estabelecimentoId, cursorGovernanca(cursor)); }
  @Get('retencao') async politica(@UsuarioLogado() u: Usuario) { await this.gerenciar(u); return this.retencao.obter(u.estabelecimentoId); }
  @Put('retencao') async salvarPolitica(@UsuarioLogado() u: Usuario, @Body() d: { ativa: boolean; conteudoDias: number; fundamento: string }) { await this.administrar(u); return this.retencao.salvar(u.estabelecimentoId, u.id, d); }
  @Post('retencao/executar') async expurgar(@UsuarioLogado() u: Usuario, @Body() d: { confirmacao: string }) { await this.administrar(u); return this.retencao.executar(u.estabelecimentoId, u.id, d?.confirmacao); }
  @Get('solicitacoes') @Header('Cache-Control', 'no-store') async listar(@UsuarioLogado() u: Usuario, @Query('cursor') cursor?: string) { await this.administrar(u); return this.solicitacoes.listar(u.estabelecimentoId, cursorGovernanca(cursor)); }
  @Post('solicitacoes') async solicitar(@UsuarioLogado() u: Usuario, @Body() d: { clienteId: number; tipo: string; chaveIdempotencia: string }) { await this.administrar(u); return this.solicitacoes.criar(u.estabelecimentoId, u.id, d); }
  @Post('solicitacoes/:id/validar-identidade') async validar(@UsuarioLogado() u: Usuario, @Param('id') id: string, @Body() d: { referenciaVerificacao: string }) { await this.administrar(u); return this.solicitacoes.validarIdentidade(u.estabelecimentoId, u.id, idFidelidade(id), d?.referenciaVerificacao); }
  @Post('solicitacoes/:id/concluir-exportacao') async concluir(@UsuarioLogado() u: Usuario, @Param('id') id: string, @Body() d: { confirmacao: string; referenciaEntrega: string }) { await this.administrar(u); return this.solicitacoes.concluirExportacao(u.estabelecimentoId, u.id, idFidelidade(id), d); }
  @Get('solicitacoes/:id/exportacao') @Header('Cache-Control', 'no-store') @Header('X-Content-Type-Options', 'nosniff') async exportar(@UsuarioLogado() u: Usuario, @Param('id') id: string, @Query('secao') secao: string, @Query('cursor') cursor?: string) { await this.administrar(u); if (secao === 'financeiro') await this.policy.validarPermissao(u, 'FINANCEIRO_VISUALIZAR'); return this.exportacao.exportar(u.estabelecimentoId, u.id, idFidelidade(id), secao, cursorGovernanca(cursor)); }
  @Post('solicitacoes/:id/excluir') async excluir(@UsuarioLogado() u: Usuario, @Param('id') id: string, @Body() d: { confirmacao: string; motivoConservacao: string }) { await this.administrar(u); return this.exclusao.executar(u.estabelecimentoId, u.id, idFidelidade(id), d); }
  private ler(u: Usuario) { return this.policy.validarPermissao(u, 'RELACIONAMENTO_VISUALIZAR'); }
  private gerenciar(u: Usuario) { return this.policy.validarPermissao(u, 'RELACIONAMENTO_GERENCIAR'); }
  private async administrar(u: Usuario) { await this.gerenciar(u); await this.policy.validarPermissao(u, 'CONFIGURACOES_GERENCIAR'); }
}
