import { BadRequestException, Body, Controller, Delete, ForbiddenException, Get, Param, Post, Put, Req } from '@nestjs/common';
import { ServicoPrisma } from './servico.prisma';
import { TenantService } from 'src/shared/tenant.service';
import { UsuarioLogado } from 'src/shared/usuario.decorator';
import { Usuario } from '@uniflowabs/core';
import { validarNumeroInteiroNaoNegativo, validarNumeroInteiroPositivo, validarTextoObrigatorio } from 'src/shared/validacao';
import { CriarServicoDto } from './servico.dto';
import { PlanoLimitesService } from 'src/saas/plano-limites.service';
import { EquipePolicy } from 'src/equipe/equipe.policy';

@Controller('servicos')
export class ServicoController {
  constructor(
    private readonly repo: ServicoPrisma,
    private readonly tenant: TenantService,
    private readonly limites: PlanoLimitesService,
    private readonly equipePolicy: EquipePolicy,
  ) {}

  @Get()
  async obterServicos(@Req() req: any) {
    const estabelecimentoId = await this.tenant.resolverEstabelecimentoId(req);
    return this.repo.buscarTodos(estabelecimentoId);
  }

  @Post()
  async criarServico(@Body() dados: CriarServicoDto, @UsuarioLogado() usuario: Usuario) {
    await this.validarPermissao(usuario);
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
    await this.validarPermissao(usuario);
    validarNumeroInteiroPositivo(id, 'Serviço');
    this.validarServico(dados);
    await this.limites.validarEstabelecimentoOperacional(usuario.estabelecimentoId);
    return this.repo.atualizar(Number(id), usuario.estabelecimentoId, dados);
  }

  @Delete(':id')
  async excluirServico(@Param('id') id: string, @UsuarioLogado() usuario: Usuario) {
    await this.validarPermissao(usuario);
    validarNumeroInteiroPositivo(id, 'Serviço');
    await this.limites.validarEstabelecimentoOperacional(usuario.estabelecimentoId);
    return this.repo.excluir(Number(id), usuario.estabelecimentoId);
  }

  private async validarPermissao(usuario: Usuario) {
    if (!usuario?.membroEstabelecimento) {
      throw new ForbiddenException('Apenas membroEstabelecimentos podem gerenciar serviços');
    }
    await this.equipePolicy.validarPermissao(usuario, 'CONFIGURACOES_GERENCIAR');
  }

  private validarServico(dados: CriarServicoDto) {
    validarTextoObrigatorio(dados?.nome, 'Nome');
    validarTextoObrigatorio(dados?.descricao, 'Descrição');
    validarTextoObrigatorio(dados?.imagemURL, 'Imagem');
    validarNumeroInteiroPositivo(dados?.qtdeSlots, 'Quantidade de slots');

    const duracao = Number(dados?.duracaoMinutos ?? Number(dados?.qtdeSlots) * 15);
    validarNumeroInteiroPositivo(duracao, 'Duração');
    const modelo = dados?.modeloAtendimento ?? 'PRESENCIAL';
    if (!['PRESENCIAL', 'DOMICILIAR', 'HIBRIDO'].includes(modelo)) {
      throw new BadRequestException('Modelo de atendimento inválido');
    }
    validarNumeroInteiroNaoNegativo(dados?.preparoAntesMinutos ?? 0, 'Preparo anterior');
    validarNumeroInteiroNaoNegativo(dados?.preparoDepoisMinutos ?? 0, 'Preparo posterior');
    validarNumeroInteiroNaoNegativo(dados?.deslocamentoMinutos ?? 0, 'Deslocamento');
    if (dados?.profissionalIds !== undefined && (!Array.isArray(dados.profissionalIds)
      || dados.profissionalIds.some((id) => !Number.isInteger(Number(id)) || Number(id) <= 0))) {
      throw new BadRequestException('Profissionais habilitados inválidos');
    }

    if (!Number.isFinite(Number(dados?.preco)) || Number(dados.preco) <= 0) {
      throw new BadRequestException('Preço inválido');
    }
  }
}
