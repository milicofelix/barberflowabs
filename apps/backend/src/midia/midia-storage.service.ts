import { BadRequestException, Injectable } from '@nestjs/common';
import { mkdir, readFile, unlink, writeFile } from 'fs/promises';
import { resolve } from 'path';
import sharp = require('sharp');
import { FinalidadeMidia, LIMITE_UPLOAD, VersaoMidia } from './midia.dto';

@Injectable()
export class MidiaStorageService {
  private readonly raiz = resolve(process.env.MIDIA_STORAGE_DIR ?? './storage/midias');
  private readonly galeria = resolve(process.env.MIDIA_GALERIA_DIR ?? '../frontend/public');

  private caminho(id: string, versao: string) {
    if (!/^[a-f0-9-]{36}$/.test(id) || !['miniatura', 'principal'].includes(versao)) throw new BadRequestException('Arquivo inválido');
    return resolve(this.raiz, `${id}-${versao}.webp`);
  }

  async processar(id: string, buffer: Buffer, finalidade: FinalidadeMidia) {
    if (!buffer?.length || buffer.length > LIMITE_UPLOAD) throw new BadRequestException('Envie uma imagem de até 5 MB');
    let metadata: sharp.Metadata;
    try { metadata = await sharp(buffer, { limitInputPixels: 20_000_000 }).metadata(); }
    catch { throw new BadRequestException('Não foi possível ler a imagem'); }
    if (!['jpeg', 'png', 'webp'].includes(metadata.format) || (metadata.pages ?? 1) > 1) {
      throw new BadRequestException('Use JPEG, PNG ou WebP estático. Converta fotos HEIC/HEIF para JPEG antes do envio.');
    }
    await mkdir(this.raiz, { recursive: true });
    const versoes: Record<string, VersaoMidia> = {};
    try {
      for (const [versao, largura, altura] of [['miniatura', 256, 256], ['principal', finalidade === 'CAPA' ? 1600 : 800, finalidade === 'CAPA' ? 900 : 800]] as const) {
        const { data, info } = await sharp(buffer, { limitInputPixels: 20_000_000 })
          .rotate().resize(largura, altura, finalidade === 'SERVICO' ? { fit: 'inside', withoutEnlargement: true } : { fit: 'cover' }).webp({ quality: 82 }).toBuffer({ resolveWithObject: true })
          .catch(() => { throw new BadRequestException('Imagem corrompida ou não suportada'); });
        await writeFile(this.caminho(id, versao), data, { flag: 'wx' });
        versoes[versao] = { url: `/midias/arquivos/${id}/${versao}`, largura: info.width, altura: info.height, bytes: info.size };
      }
    } catch (erro) { await this.remover(id); throw erro; }
    return versoes;
  }

  async ler(midia: any, versao: string) {
    if (!['miniatura', 'principal'].includes(versao)) throw new BadRequestException('Versão inválida');
    if (!midia.arquivoOrigem) return { buffer: await readFile(this.caminho(midia.id, versao)), mime: 'image/webp' };
    const arquivo = midia.arquivoOrigem;
    if (typeof arquivo !== 'string' || !/^\/(servicos|profissionais|estabelecimentos)\/[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/.test(arquivo)) throw new BadRequestException('Imagem da galeria inválida');
    return { buffer: await readFile(resolve(this.galeria, `.${arquivo}`)), mime: arquivo.endsWith('.png') ? 'image/png' : arquivo.endsWith('.webp') ? 'image/webp' : 'image/jpeg' };
  }

  async remover(id: string) {
    for (const versao of ['miniatura', 'principal']) {
      await unlink(this.caminho(id, versao)).catch((erro) => { if (erro.code !== 'ENOENT') throw erro; });
    }
  }
}
