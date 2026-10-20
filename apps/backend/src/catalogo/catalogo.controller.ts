import { BadRequestException, Body, Controller, Get, Param, Put, Query, Req } from '@nestjs/common';
import { UsuarioLogado } from 'src/shared/usuario.decorator';
import { validarNumeroInteiroPositivo } from 'src/shared/validacao';
import { TenantService } from 'src/shared/tenant.service';
import {
  AtualizarCatalogoEstabelecimentoDto,
  AtualizarCatalogoServicoDto,
  AtualizarEspecialidadesProfissionalDto,
} from './catalogo.dto';
import { CatalogoService } from './catalogo.service';

@Controller('catalogo')
export class CatalogoController {
  constructor(
    private readonly catalogo: CatalogoService,
    private readonly tenant: TenantService,
  ) {}

  @Get('segmentos')
  listarSegmentos() {
    return this.catalogo.listarSegmentos();
  }

  @Get('requisitos')
  listarRequisitos() {
    return this.catalogo.listarRequisitos();
  }

  @Get('servicos-sugeridos')
  listarServicosSugeridos(
    @Query('segmentoIds') segmentoIds?: string,
    @Query('especialidadeIds') especialidadeIds?: string,
    @Query('busca') busca?: string,
  ) {
    return this.catalogo.listarServicosSugeridos({
      segmentoIds: this.idsDaQuery(segmentoIds, 'Segmentos'),
      especialidadeIds: this.idsDaQuery(especialidadeIds, 'Especialidades'),
      busca,
    });
  }

  @Get('estabelecimento')
  async obterEstabelecimento(@Req() req: any) {
    const estabelecimentoId = await this.tenant.resolverEstabelecimentoId(req);
    return this.catalogo.obterConfiguracao(estabelecimentoId);
  }

  @Put('estabelecimento')
  atualizarEstabelecimento(
    @Body() dados: AtualizarCatalogoEstabelecimentoDto,
    @UsuarioLogado() usuario: any,
  ) {
    return this.catalogo.atualizarEstabelecimento(usuario, dados);
  }

  @Put('profissionais/:id/especialidades')
  atualizarProfissional(
    @Param('id') id: string,
    @Body() dados: AtualizarEspecialidadesProfissionalDto,
    @UsuarioLogado() usuario: any,
  ) {
    validarNumeroInteiroPositivo(id, 'Profissional');
    return this.catalogo.atualizarProfissional(usuario, Number(id), dados);
  }

  @Put('servicos/:id')
  atualizarServico(
    @Param('id') id: string,
    @Body() dados: AtualizarCatalogoServicoDto,
    @UsuarioLogado() usuario: any,
  ) {
    validarNumeroInteiroPositivo(id, 'Serviço');
    return this.catalogo.atualizarServico(usuario, Number(id), dados);
  }

  private idsDaQuery(valor: string | undefined, campo: string) {
    if (!valor?.trim()) return undefined;
    const ids = [...new Set(valor.split(',').map(Number))];
    if (ids.some((id) => !Number.isInteger(id) || id <= 0)) {
      throw new BadRequestException(`${campo} inválidos`);
    }
    return ids;
  }
}
