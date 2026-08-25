import { Controller, Get, Req } from '@nestjs/common';
import { ProfissionalPrisma } from './profissional.prisma';
import { TenantService } from 'src/shared/tenant.service';

@Controller('profissionais')
export class ProfissionalController {
  constructor(
    private readonly repo: ProfissionalPrisma,
    private readonly tenant: TenantService,
  ) {}

  @Get()
  async obterProfissionais(@Req() req: any) {
    const barbeariaId = await this.tenant.resolverBarbeariaId(req);
    return this.repo.buscarTodos(barbeariaId);
  }
}
