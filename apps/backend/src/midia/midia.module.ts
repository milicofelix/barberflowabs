import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { AuthMiddleware } from 'src/auth/auth.middleware';
import { DbModule } from 'src/db/db.module';
import { EquipeModule } from 'src/equipe/equipe.module';
import { MidiaController, MidiaArquivoController } from './midia.controller';
import { MidiaService } from './midia.service';
import { MidiaStorageService } from './midia-storage.service';

@Module({ imports: [AuthModule, DbModule, EquipeModule], controllers: [MidiaController, MidiaArquivoController], providers: [MidiaService, MidiaStorageService] })
export class MidiaModule {
  configure(consumer: MiddlewareConsumer) { consumer.apply(AuthMiddleware).forRoutes(MidiaController); }
}
