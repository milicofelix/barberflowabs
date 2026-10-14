import { inferirDddPadrao, normalizarTelefoneBrasil, opcoesUnicas, chaveTelefone } from '../../../mobile/src/data/contatos/opcoesContato';

describe('Opções de contato no mobile', () => {
  it('remove telefones repetidos com ou sem máscara e preserva a primeira apresentação', () => {
    const telefones = [{ numero: '+55 11 90000-0001', rotulo: 'Celular' }, { numero: '+5511900000001' }, { numero: '11900000001' }, { numero: '+5511900000002' }];
    const unicos = opcoesUnicas(telefones, (t) => chaveTelefone(t.numero));
    expect(unicos).toEqual([telefones[0], telefones[3]]);
    expect(new Set(unicos.map((t) => t.numero)).size).toBe(unicos.length);
  });
  it('remove e-mails repetidos independentemente de espaços e caixa', () => {
    expect(opcoesUnicas([' TESTE@example.invalid ', 'teste@example.invalid'], (v) => v.trim().toLowerCase())).toEqual([' TESTE@example.invalid ']);
  });
  it('não mistura contatos diferentes com o mesmo telefone', () => {
    const pessoas = [{ referencia: 'A', telefones: ['+5511900000001'] }, { referencia: 'B', telefones: ['+5511900000001'] }];
    expect(pessoas.map((p) => ({ ...p, telefones: opcoesUnicas(p.telefones, chaveTelefone) }))).toHaveLength(2);
  });
  it('completa celular local com o DDD informado', () => {
    expect(normalizarTelefoneBrasil('98049-7003', '11')).toBe('+5511980497003');
    expect(normalizarTelefoneBrasil('98049-7003')).toBe('');
  });
  it('infere o DDD mais recorrente sem considerar números locais incompletos', () => {
    expect(inferirDddPadrao(['98049-7003', '+55 11 99999-0001', '(11) 98888-0002', '+55 21 97777-0003'])).toBe('11');
  });
});
