import { Controller, Get } from '@nestjs/common';
import { ServicoPrisma } from './servico.prisma';
import { BuscarServicos } from '@barbabrutal/core';

@Controller('servicos')
export class ServicoController {
  constructor(private readonly repo: ServicoPrisma) {}

  @Get()
  obterServicos() {
    const casoDeUso = new BuscarServicos(this.repo);
    return casoDeUso.executar();
  }
}
