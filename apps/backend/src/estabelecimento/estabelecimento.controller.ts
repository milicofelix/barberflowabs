import { BadRequestException, Body, Controller, ForbiddenException, Get, Param, Post, Put } from '@nestjs/common';
import { Usuario } from '@uniflowabs/core';
import { UsuarioLogado } from 'src/shared/usuario.decorator';
import { EstabelecimentoPrisma } from './estabelecimento.prisma';
import { AtualizarPerfilPublicoEstabelecimentoDto, CriarEstabelecimentoDto } from './estabelecimento.dto';
import { validarEmail, validarTextoObrigatorio } from 'src/shared/validacao';
import { LogoEstabelecimentoRepository } from './logo-estabelecimento.repository';

@Controller('estabelecimentos')
export class EstabelecimentoController {
  constructor(private readonly repo: EstabelecimentoPrisma, private readonly logos: LogoEstabelecimentoRepository) {}

  @Get('minha/logo')
  obterLogo(@UsuarioLogado() u: Usuario) { this.validarDono(u); return this.logos.obter(u.estabelecimentoId); }

  @Put('minha/logo')
  salvarLogo(@UsuarioLogado() u: Usuario, @Body() d: { logoModo: string; midiaId?: string }) { this.validarDono(u); return this.logos.salvar(u.estabelecimentoId, u.id, d); }

  private validarDono(u: Usuario) {
    if (!u?.estabelecimentoId || String(u.papel ?? (u as any).role).toUpperCase() !== 'ESTABLISHMENT_OWNER') throw new ForbiddenException('Apenas o dono pode configurar o logo da unidade');
  }

  @Get()
  listar() {
    return this.repo.listar();
  }

  @Get('minha/perfil-publico')
  buscarMeuPerfilPublico(@UsuarioLogado() usuario: Usuario) {
    this.validarPermissao(usuario);
    return this.repo.buscarPerfilPublico(usuario.estabelecimentoId!);
  }

  @Get('minha/prontidao-publicacao')
  buscarMinhaProntidaoPublicacao(@UsuarioLogado() usuario: Usuario) {
    this.validarPermissao(usuario);
    return this.repo.buscarProntidaoPublicacao(usuario.estabelecimentoId!);
  }

  @Put('minha/perfil-publico')
  atualizarMeuPerfilPublico(
    @Body() dados: AtualizarPerfilPublicoEstabelecimentoDto,
    @UsuarioLogado() usuario: Usuario,
  ) {
    this.validarPermissao(usuario);
    this.validarPerfilPublico(dados);
    return this.repo.atualizarPerfilPublico(usuario.estabelecimentoId!, usuario.id!, dados);
  }

  @Get(':slug')
  buscarPorSlug(@Param('slug') slug: string) {
    return this.repo.buscarPorSlug(slug);
  }

  @Post()
  criar(@Body() dados: CriarEstabelecimentoDto) {
    validarTextoObrigatorio(dados.nome, 'Nome');
    validarTextoObrigatorio(dados.slug, 'Slug');

    if (dados.email) {
      validarEmail(dados.email);
    }

    return this.repo.criar(dados);
  }

  private validarPermissao(usuario: Usuario) {
    if (!usuario?.membroEstabelecimento) {
      throw new ForbiddenException('Apenas responsáveis pelo estabelecimento podem alterar o perfil público');
    }
  }

  private validarPerfilPublico(dados: AtualizarPerfilPublicoEstabelecimentoDto) {
    validarTextoObrigatorio(dados.nomePublico, 'Nome público');

    if (dados.email) {
      validarEmail(dados.email);
    }

    if (dados.estado && !/^[A-Za-z]{2}$/.test(String(dados.estado).trim())) {
      throw new BadRequestException('Estado deve conter a UF com 2 letras');
    }

    this.validarCoordenada(dados.latitude, -90, 90, 'Latitude');
    this.validarCoordenada(dados.longitude, -180, 180, 'Longitude');

    const temLatitude = dados.latitude !== null && dados.latitude !== undefined && dados.latitude !== '';
    const temLongitude = dados.longitude !== null && dados.longitude !== undefined && dados.longitude !== '';
    if (temLatitude !== temLongitude) {
      throw new BadRequestException('Latitude e longitude devem ser preenchidas juntas');
    }
  }

  private validarCoordenada(valor: unknown, minimo: number, maximo: number, campo: string) {
    if (valor === null || valor === undefined || valor === '') return;

    const numero = Number(valor);
    if (!Number.isFinite(numero) || numero < minimo || numero > maximo) {
      throw new BadRequestException(`${campo} inválida`);
    }
  }
}
