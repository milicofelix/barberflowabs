import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { BarbeariaPrisma } from './barbearia.prisma';

type NovaBarbeariaDTO = {
  nome: string;
  slug: string;
  email?: string;
  telefone?: string;
};

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
  criar(@Body() dados: NovaBarbeariaDTO) {
    return this.repo.criar(dados);
  }
}
