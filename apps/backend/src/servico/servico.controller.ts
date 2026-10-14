import { BadRequestException, Body, Controller, Delete, ForbiddenException, Get, Param, Post, Put, Req } from '@nestjs/common';
import { ServicoPrisma } from './servico.prisma';
import { TenantService } from 'src/shared/tenant.service';
import { UsuarioLogado } from 'src/shared/usuario.decorator';
import { Usuario } from '@uniflowabs/core';
import { validarNumeroInteiroNaoNegativo, validarNumeroInteiroPositivo, validarTextoObrigatorio } from 'src/shared/validacao';
import { CriarServicoDto, ImportarServicosSugeridosDto } from './servico.dto';
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

  @Post('sugeridos/importar')
  async importarSugeridos(@Body() dados: ImportarServicosSugeridosDto, @UsuarioLogado() usuario: Usuario) {
    await this.validarPermissao(usuario);
    this.validarImportacaoSugeridos(dados);
    await this.limites.validarEstabelecimentoOperacional(usuario.estabelecimentoId);
    const ids = [...new Set(dados.itens.map((item) => Number(item.servicoSugeridoId)))];
    const quantidade = await this.repo.contarSugeridosNovos(usuario.estabelecimentoId, ids);
    await this.limites.validarNovosServicos(usuario.estabelecimentoId, quantidade);
    return this.repo.importarSugeridos(usuario.estabelecimentoId, dados);
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

  private validarImportacaoSugeridos(dados: ImportarServicosSugeridosDto) {
    if (!Array.isArray(dados?.itens) || dados.itens.length === 0 || dados.itens.length > 50) {
      throw new BadRequestException('Selecione entre 1 e 50 serviços sugeridos');
    }
    const ids = dados.itens.map((item) => Number(item.servicoSugeridoId));
    if (ids.some((id) => !Number.isInteger(id) || id <= 0) || new Set(ids).size !== ids.length) {
      throw new BadRequestException('A seleção contém serviços sugeridos inválidos ou repetidos');
    }
    dados.itens.forEach((item) => {
      if (!Number.isFinite(Number(item.preco)) || Number(item.preco) <= 0) throw new BadRequestException('Informe um preço válido para todos os serviços');
      if (item.duracaoMinutos !== undefined) validarNumeroInteiroPositivo(item.duracaoMinutos, 'Duração');
      if (item.modeloAtendimento && !['PRESENCIAL', 'DOMICILIAR', 'HIBRIDO'].includes(item.modeloAtendimento)) throw new BadRequestException('Modelo de atendimento inválido');
      validarNumeroInteiroNaoNegativo(item.preparoAntesMinutos ?? 0, 'Preparo anterior');
      validarNumeroInteiroNaoNegativo(item.preparoDepoisMinutos ?? 0, 'Preparo posterior');
      validarNumeroInteiroNaoNegativo(item.deslocamentoMinutos ?? 0, 'Deslocamento');
      if (item.profissionalIds !== undefined && (!Array.isArray(item.profissionalIds)
        || item.profissionalIds.some((id) => !Number.isInteger(Number(id)) || Number(id) <= 0))) {
        throw new BadRequestException('Profissionais inválidos');
      }
    });
  }
}
