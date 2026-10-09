import { Body, Controller, Delete, ForbiddenException, Get, Param, Post, Put, Req } from '@nestjs/common';
import { ProfissionalPrisma } from './profissional.prisma';
import { TenantService } from 'src/shared/tenant.service';
import { UsuarioLogado } from 'src/shared/usuario.decorator';
import { Usuario } from '@barbabrutal/core';
import { validarNumeroInteiroPositivo, validarTextoObrigatorio } from 'src/shared/validacao';
import { CriarProfissionalDto } from './profissional.dto';
import { PlanoLimitesService } from 'src/saas/plano-limites.service';

@Controller('profissionais')
export class ProfissionalController {
  constructor(
    private readonly repo: ProfissionalPrisma,
    private readonly tenant: TenantService,
    private readonly limites: PlanoLimitesService,
  ) {}

  @Get()
  async obterProfissionais(@Req() req: any) {
    const barbeariaId = await this.tenant.resolverBarbeariaId(req);
    return this.repo.buscarTodos(barbeariaId);
  }

  @Post()
  async criarProfissional(
    @Body() dados: CriarProfissionalDto,
    @UsuarioLogado() usuario: Usuario,
  ) {
    this.validarPermissao(usuario);
    this.validarProfissional(dados);
    await this.limites.validarBarbeariaOperacional(usuario.barbeariaId);
    await this.limites.validarNovoProfissional(usuario.barbeariaId);
    return this.repo.criar(usuario.barbeariaId, dados);
  }

  @Put(':id')
  async atualizarProfissional(
    @Param('id') id: string,
    @Body() dados: CriarProfissionalDto,
    @UsuarioLogado() usuario: Usuario,
  ) {
    this.validarPermissao(usuario);
    validarNumeroInteiroPositivo(id, 'Profissional');
    this.validarProfissional(dados);
    await this.limites.validarBarbeariaOperacional(usuario.barbeariaId);
    return this.repo.atualizar(Number(id), usuario.barbeariaId, dados);
  }

  @Delete(':id')
  async excluirProfissional(@Param('id') id: string, @UsuarioLogado() usuario: Usuario) {
    this.validarPermissao(usuario);
    validarNumeroInteiroPositivo(id, 'Profissional');
    await this.limites.validarBarbeariaOperacional(usuario.barbeariaId);
    return this.repo.excluir(Number(id), usuario.barbeariaId);
  }

  private validarPermissao(usuario: Usuario) {
    if (!usuario?.barbeiro) {
      throw new ForbiddenException('Apenas barbeiros podem gerenciar profissionais');
    }
  }

  private validarProfissional(dados: CriarProfissionalDto) {
    validarTextoObrigatorio(dados?.nome, 'Nome');
    validarTextoObrigatorio(dados?.descricao, 'Descrição');
    validarTextoObrigatorio(dados?.imagemURL, 'Imagem');
  }
}
