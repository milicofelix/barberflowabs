import { Module } from '@nestjs/common';
import { GeocodificacaoEnderecoService } from './geocodificacao-endereco.service';

@Module({
  providers: [GeocodificacaoEnderecoService],
  exports: [GeocodificacaoEnderecoService],
})
export class GeocodificacaoModule {}
