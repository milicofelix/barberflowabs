import { Body, Controller, Delete, Get, Param, Post, Put, Req } from '@nestjs/common';
import { ProfissionalPrisma } from './profissional.prisma';
import { TenantService } from 'src/shared/tenant.service';
import { UsuarioLogado } from 'src/shared/usuario.decorator';
import { Usuario } from '@uniflowabs/core';
import { validarNumeroInteiroPositivo, validarTextoObrigatorio } from 'src/shared/validacao';
import { CriarProfissionalDto } from './profissional.dto';
import { PlanoLimitesService } from 'src/saas/plano-limites.service';
import { EquipePolicy } from 'src/equipe/equipe.policy';

@Controller('profissionais')
export class ProfissionalController {
  constructor(
    private readonly repo: ProfissionalPrisma,
    private readonly tenant: TenantService,
    private readonly limites: PlanoLimitesService,
    private readonly equipePolicy: EquipePolicy,
  ) {}

  @Get()
  async obterProfissionais(@Req() req: any) {
    const estabelecimentoId = await this.tenant.resolverEstabelecimentoId(req);
    return this.repo.buscarTodos(estabelecimentoId);
  }

  @Post()
  async criarProfissional(
    @Body() dados: CriarProfissionalDto,
    @UsuarioLogado() usuario: Usuario,
  ) {
    await this.equipePolicy.validarPermissao(usuario, 'EQUIPE_GERENCIAR');
    this.validarProfissional(dados);
    await this.limites.validarEstabelecimentoOperacional(usuario.estabelecimentoId);
    await this.limites.validarNovoProfissional(usuario.estabelecimentoId);
    return this.repo.criar(usuario.estabelecimentoId, dados);
  }

  @Put(':id')
  async atualizarProfissional(
    @Param('id') id: string,
    @Body() dados: CriarProfissionalDto,
    @UsuarioLogado() usuario: Usuario,
  ) {
    await this.equipePolicy.validarPermissao(usuario, 'EQUIPE_GERENCIAR');
    validarNumeroInteiroPositivo(id, 'Profissional');
    this.validarProfissional(dados);
    await this.limites.validarEstabelecimentoOperacional(usuario.estabelecimentoId);
    return this.repo.atualizar(Number(id), usuario.estabelecimentoId, dados);
  }

  @Delete(':id')
  async excluirProfissional(@Param('id') id: string, @UsuarioLogado() usuario: Usuario) {
    await this.equipePolicy.validarPermissao(usuario, 'EQUIPE_GERENCIAR');
    validarNumeroInteiroPositivo(id, 'Profissional');
    await this.limites.validarEstabelecimentoOperacional(usuario.estabelecimentoId);
    return this.repo.excluir(Number(id), usuario.estabelecimentoId);
  }

  private validarProfissional(dados: CriarProfissionalDto) {
    validarTextoObrigatorio(dados?.nome, 'Nome');
    validarTextoObrigatorio(dados?.descricao, 'Descrição');
    validarTextoObrigatorio(dados?.imagemURL, 'Imagem');
  }
}
