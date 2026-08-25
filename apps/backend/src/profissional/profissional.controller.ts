import { Body, Controller, Delete, ForbiddenException, Get, Param, Post, Put, Req } from '@nestjs/common';
import { ProfissionalPrisma } from './profissional.prisma';
import { TenantService } from 'src/shared/tenant.service';
import { UsuarioLogado } from 'src/shared/usuario.decorator';
import { Usuario } from '@barbabrutal/core';
import { validarNumeroInteiroPositivo, validarTextoObrigatorio } from 'src/shared/validacao';
import { CriarProfissionalDto } from './profissional.dto';

@Controller('profissionais')
export class ProfissionalController {
  constructor(
    private readonly repo: ProfissionalPrisma,
    private readonly tenant: TenantService,
  ) {}

  @Get()
  async obterProfissionais(@Req() req: any) {
    const barbeariaId = await this.tenant.resolverBarbeariaId(req);
    return this.repo.buscarTodos(barbeariaId);
  }

  @Post()
  criarProfissional(
    @Body() dados: CriarProfissionalDto,
    @UsuarioLogado() usuario: Usuario,
  ) {
    this.validarPermissao(usuario);
    this.validarProfissional(dados);
    return this.repo.criar(usuario.barbeariaId, dados);
  }

  @Put(':id')
  atualizarProfissional(
    @Param('id') id: string,
    @Body() dados: CriarProfissionalDto,
    @UsuarioLogado() usuario: Usuario,
  ) {
    this.validarPermissao(usuario);
    validarNumeroInteiroPositivo(id, 'Profissional');
    this.validarProfissional(dados);
    return this.repo.atualizar(Number(id), usuario.barbeariaId, dados);
  }

  @Delete(':id')
  excluirProfissional(@Param('id') id: string, @UsuarioLogado() usuario: Usuario) {
    this.validarPermissao(usuario);
    validarNumeroInteiroPositivo(id, 'Profissional');
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
