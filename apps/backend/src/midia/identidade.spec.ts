import { categoriaIdentidade, capaPersonalizada, iniciaisUsuario, resolverURLMidia } from '@uniflowabs/core';

describe('Identidade multissegmento compartilhada', () => {
  it('prioriza segmento principal sobre o tipo e aceita formato da API privada', () => {
    expect(categoriaIdentidade({ tipoEstabelecimento: 'BARBEARIA', segmentos: [{ principal: true, segmento: { slug: 'clinica-estetica' } }] })).toBe('clinica-estetica');
  });
  it('resolve os seis tipos estruturados e classificação indefinida é neutra', () => {
    for (const tipo of ['BARBEARIA', 'SALAO_BELEZA', 'CLINICA_ESTETICA', 'ESTUDIO_BELEZA', 'ESMALTERIA', 'SPA_BEM_ESTAR']) expect(categoriaIdentidade({ tipoEstabelecimento: tipo })).toBeTruthy();
    expect(categoriaIdentidade({ segmentos: [{ slug: 'barbearia' }, { slug: 'beleza' }] })).toBeNull();
    expect(categoriaIdentidade({ tipoEstabelecimento: 'OUTRO' })).toBeNull();
    expect(categoriaIdentidade(null)).toBeNull();
  });
  it('usa segmento único, ignora capas antigas e rejeita protocolos inválidos', () => {
    expect(categoriaIdentidade({ segmentos: [{ slug: 'manicure-pedicure' }] })).toBe('manicure-pedicure');
    expect(capaPersonalizada({ imagemCapaURL: '/banners/principal.png' })).toBeNull();
    expect(capaPersonalizada({ imagemCapaURL: 'javascript:alert(1)' })).toBeNull();
    expect(capaPersonalizada({ imagemCapaURL: '/midias/arquivos/id/principal' })).toBe('/midias/arquivos/id/principal');
  });
  it('normaliza URL da API e fornece iniciais inclusive para nome vazio', () => {
    expect(resolverURLMidia('/midias/arquivo', 'http://api/')).toBe('http://api/midias/arquivo');
    expect(iniciaisUsuario(' Adriano  Freitas ')).toBe('AF');
    expect(iniciaisUsuario('')).toBe('U');
  });
});
