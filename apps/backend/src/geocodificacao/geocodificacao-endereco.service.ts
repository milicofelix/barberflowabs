import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { extrairCoordenadasGoogleMaps } from './google-maps-coordinates';

export interface EnderecoGeocodificavel {
  endereco?: string | null;
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
}

@Injectable()
export class GeocodificacaoEnderecoService {
  async resolver(endereco: EnderecoGeocodificavel, googleMapsUrl?: string | null) {
    const coordenadasDaUrl = extrairCoordenadasGoogleMaps(googleMapsUrl);
    const enderecoCompleto = this.formatarEndereco(endereco);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(enderecoCompleto)}`;

    if (coordenadasDaUrl) {
      return { ...coordenadasDaUrl, origem: 'GOOGLE_MAPS_URL', enderecoCompleto, mapsUrl };
    }

    const coordenadas = await this.geocodificar(endereco);
    return { ...coordenadas, origem: 'ENDERECO', enderecoCompleto, mapsUrl };
  }

  private async geocodificar(endereco: EnderecoGeocodificavel) {
    const consultas = this.consultas(endereco);
    if (!consultas.length) throw new BadRequestException('O endereço completo é necessário para validar a localização');

    try {
      for (const consulta of consultas) {
        const resultado = await this.consultarNominatim(consulta);
        if (resultado) return resultado;
      }
    } catch (erro) {
      if (erro instanceof BadRequestException) throw erro;
      throw new ServiceUnavailableException('Não foi possível consultar o serviço de localização agora');
    }
    throw new BadRequestException('Endereço não localizado. Confira os dados ou cole uma URL do Google Maps que contenha as coordenadas');
  }

  private async consultarNominatim(consulta: string) {
    const controlador = new AbortController();
    const timeout = setTimeout(() => controlador.abort(), 8_000);
    try {
      const parametros = new URLSearchParams({ q: consulta, format: 'jsonv2', limit: '1', countrycodes: 'br' });
      const resposta = await fetch(`https://nominatim.openstreetmap.org/search?${parametros}`, {
        headers: { 'User-Agent': 'UniFlowABS/1.0 (geocodificacao administrativa)' },
        signal: controlador.signal,
      });
      if (!resposta.ok) throw new Error(`Nominatim respondeu ${resposta.status}`);
      const itens = await resposta.json() as Array<{ lat: string; lon: string }>;
      const latitude = Number(itens[0]?.lat);
      const longitude = Number(itens[0]?.lon);
      return Number.isFinite(latitude) && Number.isFinite(longitude) ? { latitude, longitude } : null;
    } finally {
      clearTimeout(timeout);
    }
  }

  private consultas(endereco: EnderecoGeocodificavel) {
    const rua = endereco.endereco || [endereco.logradouro, endereco.numero].filter(Boolean).join(', ');
    const local = [endereco.bairro, endereco.cidade, endereco.estado, 'Brasil'].filter(Boolean).join(', ');
    const cep = endereco.cep?.replace(/\D/g, '');
    return [...new Set([
      [rua, local, cep].filter(Boolean).join(', '),
      [rua, endereco.cidade, endereco.estado, cep, 'Brasil'].filter(Boolean).join(', '),
      [cep, endereco.cidade, endereco.estado, 'Brasil'].filter(Boolean).join(', '),
    ].filter((valor) => valor.replace(/[, ]/g, '').length > 8))];
  }

  private formatarEndereco(endereco: EnderecoGeocodificavel) {
    const cep = endereco.cep?.replace(/\D/g, '').replace(/^(\d{5})(\d{3})$/, '$1-$2');
    return [endereco.endereco || endereco.logradouro, endereco.endereco ? null : endereco.numero, endereco.complemento, endereco.bairro, endereco.cidade, endereco.estado, cep, 'Brasil']
      .filter(Boolean).join(', ');
  }
}
