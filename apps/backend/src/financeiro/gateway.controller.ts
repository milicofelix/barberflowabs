import { BadRequestException, Body, Controller, Headers, Param, Post, UnauthorizedException } from '@nestjs/common';
import { timingSafeEqual } from 'crypto';
import { FinanceiroService } from './financeiro.service';

@Controller('pagamentos/gateway')
export class GatewayController {
  constructor(private readonly service: FinanceiroService) {}

  @Post('webhooks/:provedor')
  webhook(
    @Param('provedor') provedor: string,
    @Headers('x-webhook-secret') segredo: string,
    @Body() dados: any,
  ) {
    this.validarSegredo(segredo);
    if (!dados?.eventoId || !dados?.referencia || !dados?.status) {
      throw new BadRequestException('Evento, referência e status são obrigatórios');
    }
    if (!['PENDENTE', 'PAGO', 'FALHOU', 'CANCELADO', 'ATRASADA'].includes(dados.status)) {
      throw new BadRequestException('Status do pagamento inválido');
    }
    return this.service.processarEventoGateway({
      provedor: provedor.toUpperCase(),
      eventoExternoId: String(dados.eventoId),
      referenciaExterna: String(dados.referencia),
      tipo: String(dados.tipo ?? 'PAYMENT_UPDATED'),
      status: dados.status,
      pagoEm: dados.pagoEm,
      payload: dados,
    });
  }

  private validarSegredo(recebido: string) {
    const esperado = process.env.PAYMENT_WEBHOOK_SECRET;
    if (!esperado || !recebido) throw new UnauthorizedException('Webhook não configurado');
    const a = Buffer.from(recebido);
    const b = Buffer.from(esperado);
    if (a.length !== b.length || !timingSafeEqual(a, b)) throw new UnauthorizedException('Assinatura do webhook inválida');
  }
}
