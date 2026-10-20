import { Body, Controller, Get, Header, Post, Query } from '@nestjs/common';
import { DescadastroCampanhaService } from './descadastro-campanha.service';
@Controller('public/comunicacoes/descadastro')
export class DescadastroCampanhaController {
  constructor(private readonly descadastro: DescadastroCampanhaService) {}
  @Get() @Header('Cache-Control', 'no-store') consultar(@Query('token') token: string) { return { canal: this.descadastro.consultar(token).canal }; }
  @Post() @Header('Cache-Control', 'no-store') confirmar(@Body() dados: { token: string }) { return this.descadastro.confirmar(dados?.token); }
}
