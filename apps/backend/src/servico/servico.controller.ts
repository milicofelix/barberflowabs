import { Controller, Get, Req } from '@nestjs/common';
import { ServicoPrisma } from './servico.prisma';
import { TenantService } from 'src/shared/tenant.service';

@Controller('servicos')
export class ServicoController {
  constructor(
    private readonly repo: ServicoPrisma,
    private readonly tenant: TenantService,
  ) {}

  @Get()
  async obterServicos(@Req() req: any) {
    const barbeariaId = await this.tenant.resolverBarbeariaId(req);
    return this.repo.buscarTodos(barbeariaId);
  }
}
