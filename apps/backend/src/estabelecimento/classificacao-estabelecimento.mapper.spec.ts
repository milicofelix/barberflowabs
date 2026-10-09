import { mapearClassificacaoEstabelecimento } from './classificacao-estabelecimento.mapper';

describe('mapearClassificacaoEstabelecimento', () => {
  it('mantem os padroes legados quando a classificacao ainda nao existe', () => {
    expect(mapearClassificacaoEstabelecimento({})).toEqual({
      tipoEstabelecimento: 'BARBEARIA',
      modeloAtendimento: 'PRESENCIAL',
      segmentos: [],
      especialidades: [],
    });
  });

  it('expoe segmentos e especialidades sem vazar a estrutura das tabelas de associacao', () => {
    const segmento = { id: 2, slug: 'estetica', nome: 'Estetica' };
    const classificacao = mapearClassificacaoEstabelecimento({
      tipoEstabelecimento: 'CLINICA_ESTETICA',
      modeloAtendimento: 'HIBRIDO',
      segmentos: [{ principal: true, segmento }],
      especialidades: [
        {
          especialidade: {
            id: 3,
            slug: 'limpeza-de-pele',
            nome: 'Limpeza de pele',
            segmento,
          },
        },
      ],
    });

    expect(classificacao.segmentos).toEqual([{ ...segmento, principal: true }]);
    expect(classificacao.especialidades[0]).toEqual({
      id: 3,
      slug: 'limpeza-de-pele',
      nome: 'Limpeza de pele',
      segmento,
    });
  });
});
