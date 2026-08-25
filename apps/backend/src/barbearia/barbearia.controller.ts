import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { BarbeariaPrisma } from './barbearia.prisma';
import { CriarBarbeariaDto } from './barbearia.dto';
import { validarEmail, validarTextoObrigatorio } from 'src/shared/validacao';

@Controller('barbearias')
export class BarbeariaController {
  constructor(private readonly repo: BarbeariaPrisma) {}

  @Get()
  listar() {
    return this.repo.listar();
  }

  @Get(':slug')
  buscarPorSlug(@Param('slug') slug: string) {
    return this.repo.buscarPorSlug(slug);
  }

  @Post()
  criar(@Body() dados: CriarBarbeariaDto) {
    validarTextoObrigatorio(dados.nome, 'Nome');
    validarTextoObrigatorio(dados.slug, 'Slug');

    if (dados.email) {
      validarEmail(dados.email);
    }

    return this.repo.criar(dados);
  }
}
