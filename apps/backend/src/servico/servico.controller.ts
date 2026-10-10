import { BadRequestException, Body, Controller, Delete, ForbiddenException, Get, Param, Post, Put, Req } from '@nestjs/common';
import { ServicoPrisma } from './servico.prisma';
import { TenantService } from 'src/shared/tenant.service';
import { UsuarioLogado } from 'src/shared/usuario.decorator';
import { Usuario } from '@uniflowabs/core';
import { validarNumeroInteiroPositivo, validarTextoObrigatorio } from 'src/shared/validacao';
import { CriarServicoDto } from './servico.dto';
import { PlanoLimitesService } from 'src/saas/plano-limites.service';

@Controller('servicos')
export class ServicoController {
  constructor(
    private readonly repo: ServicoPrisma,
    private readonly tenant: TenantService,
    private readonly limites: PlanoLimitesService,
  ) {}

  @Get()
  async obterServicos(@Req() req: any) {
    const estabelecimentoId = await this.tenant.resolverEstabelecimentoId(req);
    return this.repo.buscarTodos(estabelecimentoId);
  }

  @Post()
  async criarServico(@Body() dados: CriarServicoDto, @UsuarioLogado() usuario: Usuario) {
    this.validarPermissao(usuario);
    this.validarServico(dados);
    await this.limites.validarEstabelecimentoOperacional(usuario.estabelecimentoId);
    await this.limites.validarNovoServico(usuario.estabelecimentoId);
    return this.repo.criar(usuario.estabelecimentoId, dados);
  }

  @Put(':id')
  async atualizarServico(
    @Param('id') id: string,
    @Body() dados: CriarServicoDto,
    @UsuarioLogado() usuario: Usuario,
  ) {
    this.validarPermissao(usuario);
    validarNumeroInteiroPositivo(id, 'Serviço');
    this.validarServico(dados);
    await this.limites.validarEstabelecimentoOperacional(usuario.estabelecimentoId);
    return this.repo.atualizar(Number(id), usuario.estabelecimentoId, dados);
  }

  @Delete(':id')
  async excluirServico(@Param('id') id: string, @UsuarioLogado() usuario: Usuario) {
    this.validarPermissao(usuario);
    validarNumeroInteiroPositivo(id, 'Serviço');
    await this.limites.validarEstabelecimentoOperacional(usuario.estabelecimentoId);
    return this.repo.excluir(Number(id), usuario.estabelecimentoId);
  }

  private validarPermissao(usuario: Usuario) {
    if (!usuario?.membroEstabelecimento) {
      throw new ForbiddenException('Apenas membroEstabelecimentos podem gerenciar serviços');
    }
  }

  private validarServico(dados: CriarServicoDto) {
    validarTextoObrigatorio(dados?.nome, 'Nome');
    validarTextoObrigatorio(dados?.descricao, 'Descrição');
    validarTextoObrigatorio(dados?.imagemURL, 'Imagem');
    validarNumeroInteiroPositivo(dados?.qtdeSlots, 'Quantidade de slots');

    if (!Number.isFinite(Number(dados?.preco)) || Number(dados.preco) <= 0) {
      throw new BadRequestException('Preço inválido');
    }
  }
}
