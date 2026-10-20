import { AgendaUtils, Horarios } from '@uniflowabs/core';
import { AgendaPrisma } from './agenda.prisma';

describe('Intervalo opcional da agenda', () => {
  const agenda = new AgendaPrisma({} as any);
  it('a grade padrão inclui meio-dia e permite 90 minutos a partir das 11h', () => {
    expect(AgendaUtils.horariosDoDia().tardeNoite).toContain('12:00');
    expect(new Horarios('11:00', 6, []).completo).toBe(true);
  });
  it('sem intervalo cadastrado oferece 11h–12h30 sem cortar às 12h', () => {
    const slots = (agenda as any).gerarSlots({ inicio: '11:00', fim: '19:00', intervaloInicio: null, intervaloFim: null });
    expect(new Horarios('11:00', 6, [], slots).completo).toBe(true);
  });
  it('intervalo explicitamente configurado bloqueia travessia e permite retorno às 13h', () => {
    const slots = (agenda as any).gerarSlots({ inicio: '11:00', fim: '19:00', intervaloInicio: '12:00', intervaloFim: '13:00' });
    expect(new Horarios('11:00', 6, [], slots).incompleto).toBe(true);
    expect(new Horarios('13:00', 6, [], slots).completo).toBe(true);
  });
});
