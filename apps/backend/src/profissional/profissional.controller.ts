import { Controller, Get } from '@nestjs/common';
import { ProfissionalPrisma } from './profissional.prisma';
import { BuscarProfissionais } from '@barbabrutal/core';

@Controller('profissionais')
export class ProfissionalController {
  constructor(private readonly repo: ProfissionalPrisma) {}

  @Get()
  obterProfissionais() {
    const casoDeUso = new BuscarProfissionais(this.repo);
    return casoDeUso.executar();
  }
}
