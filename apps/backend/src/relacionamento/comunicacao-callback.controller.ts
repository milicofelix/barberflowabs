import { Body, Controller, Headers, Param, Post, UnauthorizedException } from '@nestjs/common';
import { CallbackComunicacaoDto } from './relacionamento.dto';
import { RelacionamentoService } from './relacionamento.service';

@Controller('relacionamento/callbacks')
export class ComunicacaoCallbackController {
  constructor(private readonly service: RelacionamentoService) {}

  @Post(':provedor')
  receber(
    @Param('provedor') provedor: string,
    @Headers('x-uniflow-callback-secret') segredo: string,
    @Body() dados: CallbackComunicacaoDto,
  ) {
    const esperado = process.env.NOTIFICACOES_CALLBACK_SECRET || 'uniflow-simulado-local';
    if (!segredo || segredo !== esperado) throw new UnauthorizedException('Callback não autorizado');
    return this.service.registrarCallback(provedor, dados);
  }
}
