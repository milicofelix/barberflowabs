import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';

@Catch(Error)
export default class ErrorFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response: any = ctx.getResponse<Response>();

    const status = (exception as any).getStatus
      ? (exception as any).getStatus()
      : 500;

    // Não grave payloads ou a representação integral de erros do ORM: eles podem
    // conter nome, telefone, e-mail ou outros dados pessoais recebidos na API.
    console.error({
      tipo: exception?.name ?? 'Error',
      status,
      rota: request.url,
      codigo: (exception as any)?.code,
    });

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: status >= 500
        ? 'Erro interno. Tente novamente em instantes.'
        : exception instanceof Error ? exception.message : exception,
    });
  }
}
