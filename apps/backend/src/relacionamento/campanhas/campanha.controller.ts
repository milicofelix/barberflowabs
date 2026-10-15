import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { Usuario } from '@uniflowabs/core';
import { UsuarioLogado } from 'src/shared/usuario.decorator';
import { EquipePolicy } from 'src/equipe/equipe.policy';
import { CampanhaRepository } from './campanha.repository';
import { inteiroCampanha, SalvarCampanhaDto } from './campanha.dto';
import { SupressaoCampanhaRepository } from './supressao-campanha.repository';

@Controller('relacionamento/campanhas')
export class CampanhaController {
  constructor(private readonly campanhas: CampanhaRepository, private readonly supressoes: SupressaoCampanhaRepository, private readonly policy: EquipePolicy) {}
  @Get() async listar(@UsuarioLogado() u: Usuario, @Query('pagina') pagina?: string, @Query('limite') limite?: string) {
    await this.policy.validarPermissao(u, 'RELACIONAMENTO_VISUALIZAR'); return this.campanhas.listar(u.estabelecimentoId, pagina, limite);
  }
  @Post() async criar(@UsuarioLogado() u: Usuario, @Body() dados: SalvarCampanhaDto) {
    await this.gerenciar(u); return this.campanhas.salvar(u.estabelecimentoId, u.id, dados);
  }
  @Post('supressoes') async suprimir(@UsuarioLogado() u: Usuario, @Body() dados: { clienteId: number; canal: string; motivo: string; ativa: boolean }) {
    await this.gerenciar(u); return this.supressoes.salvar(u.estabelecimentoId, u.id, dados);
  }
  @Get(':id') async obter(@UsuarioLogado() u: Usuario, @Param('id') id: string) {
    await this.policy.validarPermissao(u, 'RELACIONAMENTO_VISUALIZAR'); return this.campanhas.obter(this.id(id), u.estabelecimentoId);
  }
  @Get(':id/audiencia') async audiencia(@UsuarioLogado() u: Usuario, @Param('id') id: string, @Query('pagina') pagina?: string, @Query('limite') limite?: string) {
    await this.policy.validarPermissao(u, 'RELACIONAMENTO_VISUALIZAR'); return this.campanhas.audiencia(this.id(id), u.estabelecimentoId, pagina, limite);
  }
  @Put(':id') async editar(@UsuarioLogado() u: Usuario, @Param('id') id: string, @Body() dados: SalvarCampanhaDto) {
    await this.gerenciar(u); return this.campanhas.salvar(u.estabelecimentoId, u.id, dados, this.id(id));
  }
  @Post(':id/congelar') async congelar(@UsuarioLogado() u: Usuario, @Param('id') id: string) {
    await this.gerenciar(u); return this.campanhas.congelar(this.id(id), u.estabelecimentoId, u.id);
  }
  @Post(':id/agendar') async agendar(@UsuarioLogado() u: Usuario, @Param('id') id: string, @Body() dados: { agendadoPara?: string }) {
    await this.gerenciar(u); return this.campanhas.transicionar(this.id(id), u.estabelecimentoId, u.id, 'agendar', dados?.agendadoPara);
  }
  @Post(':id/pausar') async pausar(@UsuarioLogado() u: Usuario, @Param('id') id: string) {
    await this.gerenciar(u); return this.campanhas.transicionar(this.id(id), u.estabelecimentoId, u.id, 'pausar');
  }
  @Post(':id/retomar') async retomar(@UsuarioLogado() u: Usuario, @Param('id') id: string) {
    await this.gerenciar(u); return this.campanhas.transicionar(this.id(id), u.estabelecimentoId, u.id, 'retomar');
  }
  private id(id: string) { return inteiroCampanha(/^\d+$/.test(id) ? Number(id) : NaN, 1, 2147483647); }
  private gerenciar(u: Usuario) { return this.policy.validarPermissao(u, 'RELACIONAMENTO_GERENCIAR'); }
}
