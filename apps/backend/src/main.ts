import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import ErrorFilter from './error.filter';

async function bootstrap() {
  const origens = (process.env.CORS_ORIGINS ?? '').split(',').map(origem => origem.trim()).filter(Boolean);
  if (process.env.NODE_ENV === 'production' && !origens.length) {
    throw new Error('Configure CORS_ORIGINS antes de iniciar em produção');
  }
  const portaConfigurada = process.env.PORT ?? '4000';
  const isPassenger = portaConfigurada === 'passenger';
  const portaNumerica = Number(portaConfigurada);

  if (
    !isPassenger &&
    (!Number.isInteger(portaNumerica) ||
      portaNumerica < 1 ||
      portaNumerica > 65535)
  ) {
    throw new Error('PORT inválida');
  }
  const app = await NestFactory.create(AppModule, { cors: { origin: origens.length ? origens : true } });
  app.useGlobalFilters(new ErrorFilter());
  app.enableShutdownHooks();
  if (isPassenger) {
    await app.listen('passenger');
  } else {
    await app.listen(portaNumerica, process.env.HOST ?? '0.0.0.0');
  }
}
void bootstrap().catch(() => {
  console.error('Falha ao iniciar o backend. Confira configuração, banco e logs anteriores.');
  // Não deixar timers dos workers mantendo uma inicialização inválida em execução.
  process.exit(1);
});
