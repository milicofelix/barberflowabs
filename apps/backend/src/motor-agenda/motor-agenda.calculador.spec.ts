import { MotorAgendaCalculador } from './motor-agenda.calculador';
import { MotorAgendaConsultaPrisma } from './motor-agenda.consulta.prisma';

describe('Agenda sem preparação', () => {
  const calculador = new MotorAgendaCalculador();
  const servico = { id: 63, nome: 'Limpeza de pele', preco: 100, duracaoMinutos: 90, preparoAntesMinutos: 10, preparoDepoisMinutos: 10, deslocamentoMinutos: 0 } as any;
  const data = new Date('2026-10-14T11:00:00-03:00');
  it('limpeza de pele às 11h ocupa exatamente até 12h30', () => {
    const periodo = calculador.calcular(data, [servico], 'PRESENCIAL');
    expect(periodo.inicioOcupacao).toEqual(data);
    expect(periodo.dataFim).toEqual(new Date('2026-10-14T12:30:00-03:00'));
    expect(periodo.fimOcupacao).toEqual(periodo.dataFim);
    expect(periodo.preparoAntesMinutos).toBe(0);
    expect(periodo.preparoDepoisMinutos).toBe(0);
  });
  it('soma apenas duração dos serviços, sem preparação entre eles', () => {
    expect(calculador.calcular(data, [servico, { ...servico, duracaoMinutos: 30 }], 'PRESENCIAL').duracaoMinutos).toBe(120);
  });
  it('preserva deslocamento domiciliar, que é uma regra distinta', () => {
    const periodo = calculador.calcular(data, [servico], 'DOMICILIAR', 15);
    expect(periodo.inicioOcupacao).toEqual(new Date('2026-10-14T10:45:00-03:00'));
    expect(periodo.fimOcupacao).toEqual(new Date('2026-10-14T12:45:00-03:00'));
  });
  it('aceita o atendimento na abertura e terminando exatamente no fechamento', async () => {
    const consulta = new MotorAgendaConsultaPrisma({ horarioFuncionamento: { findMany: jest.fn().mockResolvedValue([{ inicio: '11:00', fim: '19:00' }]) } } as any);
    for (const inicio of [data, new Date('2026-10-14T17:30:00-03:00')]) {
      const periodo = calculador.calcular(inicio, [servico], 'PRESENCIAL');
      await expect(consulta.validarHorarioFuncionamento(22, null, periodo.inicioOcupacao, periodo.fimOcupacao)).resolves.toBeUndefined();
    }
    const periodo = calculador.calcular(new Date('2026-10-14T17:45:00-03:00'), [servico], 'PRESENCIAL');
    await expect(consulta.validarHorarioFuncionamento(22, null, periodo.inicioOcupacao, periodo.fimOcupacao)).rejects.toThrow('Período fora do horário de funcionamento');
  });
});
