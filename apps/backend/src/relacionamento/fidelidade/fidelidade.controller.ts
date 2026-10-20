import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { Usuario } from '@uniflowabs/core';
import { UsuarioLogado } from 'src/shared/usuario.decorator';
import { EquipePolicy } from 'src/equipe/equipe.policy';
import { ProgramaFidelidadeRepository } from './programa-fidelidade.repository';
import { CarteiraFidelidadeRepository } from './carteira-fidelidade.repository';
import { BeneficioFidelidadeRepository } from './beneficio-fidelidade.repository';
import { IndicacaoFidelidadeRepository } from './indicacao-fidelidade.repository';
import { AplicarBeneficioDto, CupomDto, idFidelidade, inteiro, ProgramaDto, RecompensaDto } from './fidelidade.dto';

@Controller('relacionamento/fidelidade')
export class FidelidadeController {
  constructor(private readonly programas: ProgramaFidelidadeRepository, private readonly carteiras: CarteiraFidelidadeRepository, private readonly beneficios: BeneficioFidelidadeRepository, private readonly indicacoes: IndicacaoFidelidadeRepository, private readonly policy: EquipePolicy) {}
  @Get('programa') async programa(@UsuarioLogado() u: Usuario) { await this.ler(u); return this.programas.obter(u.estabelecimentoId); }
  @Put('programa') async salvar(@UsuarioLogado() u: Usuario, @Body() d: ProgramaDto) { await this.gerenciar(u); return this.programas.salvar(u.estabelecimentoId, u.id, d); }
  @Post('recompensas') async recompensa(@UsuarioLogado() u: Usuario, @Body() d: RecompensaDto) { await this.gerenciar(u); return this.programas.salvarRecompensa(u.estabelecimentoId, u.id, d); }
  @Put('recompensas/:id') async editarRecompensa(@UsuarioLogado() u: Usuario, @Param('id') id: string, @Body() d: RecompensaDto) { await this.gerenciar(u); return this.programas.salvarRecompensa(u.estabelecimentoId, u.id, d, idFidelidade(id)); }
  @Post('cupons') async cupom(@UsuarioLogado() u: Usuario, @Body() d: CupomDto) { await this.gerenciar(u); return this.programas.salvarCupom(u.estabelecimentoId, u.id, d); }
  @Put('cupons/:id') async editarCupom(@UsuarioLogado() u: Usuario, @Param('id') id: string, @Body() d: CupomDto) { await this.gerenciar(u); return this.programas.salvarCupom(u.estabelecimentoId, u.id, d, idFidelidade(id)); }
  @Get('clientes/:id') async saldo(@UsuarioLogado() u: Usuario, @Param('id') id: string, @Query('pagina') pagina?: string) { await this.ler(u); return this.carteiras.consultar(u.estabelecimentoId, idFidelidade(id), pagina === undefined ? 1 : inteiro(idFidelidade(pagina), 1, 10000)); }
  @Post('agendamentos/:id/beneficio') async aplicar(@UsuarioLogado() u: Usuario, @Param('id') id: string, @Body() d: AplicarBeneficioDto) { await this.operar(u); return this.beneficios.aplicar(u.estabelecimentoId, u.id, idFidelidade(id), d); }
  @Get('agendamentos/:id/beneficio') async obterBeneficio(@UsuarioLogado() u: Usuario, @Param('id') id: string) { await this.ler(u); await this.policy.validarPermissao(u, 'AGENDA_GERENCIAR'); return this.beneficios.obter(u.estabelecimentoId, idFidelidade(id)); }
  @Post('agendamentos/:id/beneficio/cancelar') async cancelar(@UsuarioLogado() u: Usuario, @Param('id') id: string) { await this.operar(u); return this.beneficios.cancelar(u.estabelecimentoId, u.id, idFidelidade(id)); }
  @Get('indicacoes') async listarIndicacoes(@UsuarioLogado() u: Usuario, @Query('pagina') pagina?: string) { await this.ler(u); return this.indicacoes.listar(u.estabelecimentoId, pagina === undefined ? 1 : inteiro(idFidelidade(pagina), 1, 10000)); }
  @Post('indicacoes') async indicar(@UsuarioLogado() u: Usuario, @Body() d: { indicadorId: number; indicadoId: number }) { await this.gerenciar(u); return this.indicacoes.registrar(u.estabelecimentoId, u.id, inteiro(d?.indicadorId), inteiro(d?.indicadoId)); }
  @Post('indicacoes/:id/aprovar') async aprovar(@UsuarioLogado() u: Usuario, @Param('id') id: string) { await this.gerenciar(u); return this.indicacoes.aprovar(u.estabelecimentoId, u.id, idFidelidade(id)); }
  private ler(u: Usuario) { return this.policy.validarPermissao(u, 'RELACIONAMENTO_VISUALIZAR'); }
  private gerenciar(u: Usuario) { return this.policy.validarPermissao(u, 'RELACIONAMENTO_GERENCIAR'); }
  private async operar(u: Usuario) { await this.gerenciar(u); await this.policy.validarPermissao(u, 'AGENDA_GERENCIAR'); }
}
