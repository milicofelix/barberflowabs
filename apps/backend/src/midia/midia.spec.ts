import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { randomUUID } from 'crypto';
import sharp = require('sharp');
import { MidiaStorageService } from './midia-storage.service';
import { MidiaService } from './midia.service';
import { LIMITE_UPLOAD } from './midia.dto';

describe('Processamento de mídia', () => {
  let pasta: string;
  let storage: MidiaStorageService;
  const anterior = process.env.MIDIA_STORAGE_DIR;
  beforeEach(async () => { pasta = await mkdtemp(join(tmpdir(), 'uniflow-midia-test-')); process.env.MIDIA_STORAGE_DIR = pasta; storage = new MidiaStorageService(); });
  afterEach(async () => { await rm(pasta, { recursive: true, force: true }); if (anterior === undefined) delete process.env.MIDIA_STORAGE_DIR; else process.env.MIDIA_STORAGE_DIR = anterior; });

  it('gera principal e miniatura WebP, normaliza orientação e remove EXIF', async () => {
    const entrada = await sharp({ create: { width: 120, height: 80, channels: 3, background: '#0033ff' } }).jpeg().withMetadata({ orientation: 6 }).toBuffer();
    const id = randomUUID();
    const versoes = await storage.processar(id, entrada, 'CAPA');
    expect(versoes.miniatura.largura).toBe(256);
    expect(versoes.principal.largura).toBe(1600);
    expect(versoes.principal.altura).toBe(900);
    const arquivo = await storage.ler({ id }, 'principal');
    const meta = await sharp(arquivo.buffer).metadata();
    expect(meta.format).toBe('webp'); expect(meta.exif).toBeUndefined(); expect(meta.orientation).toBeUndefined();
  });
  it('não aceita arquivo de texto como imagem nem upload acima de 5 MB', async () => {
    await expect(storage.processar(randomUUID(), Buffer.from('<svg></svg>'), 'AVATAR')).rejects.toBeInstanceOf(BadRequestException);
    await expect(storage.processar(randomUUID(), Buffer.alloc(LIMITE_UPLOAD + 1), 'AVATAR')).rejects.toBeInstanceOf(BadRequestException);
  });
  it('preserva proporção e bordas de serviços horizontais e verticais, sem ampliar', async () => {
    for (const [width, height, largura, altura] of [[1600, 900, 800, 450], [900, 1600, 450, 800], [160, 90, 160, 90]]) {
      const entrada = await sharp({ create: { width, height, channels: 3, background: '#0033ff' } }).png().toBuffer();
      const versoes = await storage.processar(randomUUID(), entrada, 'SERVICO');
      expect(versoes.principal.largura).toBe(largura);
      expect(versoes.principal.altura).toBe(altura);
      expect(versoes.miniatura.largura / versoes.miniatura.altura).toBeCloseTo(width / height, 1);
    }
  });
  it('não permite leitura fora do diretório de mídia', async () => {
    await expect(storage.ler({ id: '../../.env' }, 'principal')).rejects.toBeInstanceOf(BadRequestException);
    await expect(storage.ler({ id: randomUUID() }, '../principal')).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('Propriedade e associação de mídia', () => {
  const usuario = { id: 7, estabelecimentoId: 9, papel: 'ESTABLISHMENT_OWNER' };
  function ambiente(midia: any) {
    const tx = {
      $queryRawUnsafe: jest.fn(),
      usuario: { findFirst: jest.fn().mockResolvedValue({ id: 7 }), update: jest.fn() },
      servico: { findFirst: jest.fn().mockResolvedValue({ id: 10 }), update: jest.fn() },
      midia: { findUnique: jest.fn().mockResolvedValue(midia), create: jest.fn() },
      midiaVinculo: { deleteMany: jest.fn(), create: jest.fn() }, logAuditoria: { create: jest.fn() },
    };
    const prisma = { $transaction: jest.fn((acao) => acao(tx)) };
    const policy = { validarPermissao: jest.fn() };
    const storage = { processar: jest.fn(), remover: jest.fn() };
    return { service: new MidiaService(prisma as any, policy as any, storage as any), tx, policy, storage };
  }
  it('impede alterar avatar de outra pessoa', async () => {
    const { service, tx } = ambiente(null);
    await expect(service.associar(usuario, { entidade: 'USUARIO', entidadeId: 8, midiaId: null })).rejects.toBeInstanceOf(ForbiddenException);
    expect(tx.usuario.update).not.toHaveBeenCalled();
  });
  it('impede associar imagem de outra unidade', async () => {
    const { service, tx } = ambiente({ id: randomUUID(), ativo: true, status: 'DISPONIVEL', finalidade: 'SERVICO', escopo: 'ESTABELECIMENTO', estabelecimentoId: 11 });
    await expect(service.associar(usuario, { entidade: 'SERVICO', entidadeId: 10, midiaId: randomUUID() })).rejects.toBeInstanceOf(ForbiddenException);
    expect(tx.servico.update).not.toHaveBeenCalled();
  });
  it('associa versão principal e registra auditoria sem remover o arquivo compartilhado', async () => {
    const id = randomUUID();
    const { service, tx, storage } = ambiente({ id, ativo: true, status: 'DISPONIVEL', finalidade: 'SERVICO', escopo: 'GLOBAL', versoes: { principal: { url: `/midias/arquivos/${id}/principal` } } });
    const resultado = await service.associar(usuario, { entidade: 'SERVICO', entidadeId: 10, midiaId: id });
    expect(resultado.midiaId).toBe(id);
    expect(tx.servico.findFirst).toHaveBeenCalledWith({ where: { id: 10, estabelecimentoId: 9 } });
    expect(tx.midiaVinculo.create).toHaveBeenCalled(); expect(tx.logAuditoria.create).toHaveBeenCalled(); expect(storage.remover).not.toHaveBeenCalled();
  });
  it('mídia desativada não pode ser selecionada', async () => {
    const { service } = ambiente({ ativo: false, finalidade: 'SERVICO', status: 'DISPONIVEL' });
    await expect(service.associar(usuario, { entidade: 'SERVICO', entidadeId: 10, midiaId: randomUUID() })).rejects.toBeInstanceOf(BadRequestException);
  });
  it('verifica permissão antes de processar upload da unidade', async () => {
    const { service, policy, storage } = ambiente(null); policy.validarPermissao.mockRejectedValue(new ForbiddenException());
    await expect(service.upload(usuario, 'CAPA', { buffer: Buffer.from('foto') })).rejects.toBeInstanceOf(ForbiddenException);
    expect(storage.processar).not.toHaveBeenCalled();
  });
  it('limpeza é somente simulação por padrão', async () => {
    const prisma = { midia: { findMany: jest.fn().mockResolvedValue([{ id: randomUUID() }]) }, $transaction: jest.fn() };
    const storage = { remover: jest.fn() };
    const service = new MidiaService(prisma as any, {} as any, storage as any);
    const resultado = await service.limparOrfas({ id: 7, papel: 'SUPER_ADMIN' });
    expect(resultado).toEqual({ simulacao: true, candidatas: 1, removidas: 0 });
    expect(prisma.$transaction).not.toHaveBeenCalled(); expect(storage.remover).not.toHaveBeenCalled();
  });
  it('limpeza preserva arquivo com referência de foto em campo legado', async () => {
    const id = randomUUID();
    const tx = {
      $queryRawUnsafe: jest.fn(),
      midia: { findFirst: jest.fn().mockResolvedValue({ id, versoes: { principal: { url: `/midias/arquivos/${id}/principal` } } }), update: jest.fn() },
      usuario: { count: jest.fn().mockResolvedValue(1) },
    };
    const prisma = { midia: { findMany: jest.fn().mockResolvedValue([{ id }]) }, $transaction: jest.fn((acao) => acao(tx)) };
    const storage = { remover: jest.fn() };
    const resultado = await new MidiaService(prisma as any, {} as any, storage as any).limparOrfas({ id: 7, papel: 'SUPER_ADMIN' }, true);
    expect(resultado.removidas).toBe(0); expect(tx.midia.update).not.toHaveBeenCalled(); expect(storage.remover).not.toHaveBeenCalled();
  });
});
