import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';

@Injectable()
export class PublicoPrisma {
  constructor(private readonly prisma: PrismaService) {}

  async buscarBarbeariaPorSlug(slug: string) {
    const barbearia = await this.prisma.barbearia.findFirst({
      where: {
        slug,
        reviewStatus: 'APPROVED',
        status: { notIn: ['SUSPENDED', 'CANCELED'] },
      } as any,
      include: {
        servicos: {
          orderBy: { nome: 'asc' },
          select: {
            id: true,
            nome: true,
            descricao: true,
            preco: true,
            qtdeSlots: true,
            imagemURL: true,
          },
        },
        profissionais: {
          orderBy: { nome: 'asc' },
          select: {
            id: true,
            nome: true,
            descricao: true,
            imagemURL: true,
            avaliacao: true,
            quantidadeAvaliacoes: true,
          },
        },
        horariosFuncionamento: {
          where: { ativo: true },
          orderBy: [{ diaSemana: 'asc' }],
          select: {
            diaSemana: true,
            inicio: true,
            fim: true,
            intervaloInicio: true,
            intervaloFim: true,
          },
        },
      },
    } as any);

    if (!barbearia) return null;

    return {
      id: barbearia.id,
      nome: barbearia.nomePublico ?? barbearia.nome,
      slug: barbearia.slug,
      telefone: barbearia.telefone,
      email: barbearia.email,
      descricao: barbearia.descricaoPublica,
      imagemCapaURL: barbearia.imagemCapaURL,
      endereco: {
        logradouro: barbearia.endereco,
        bairro: barbearia.bairro,
        cidade: barbearia.cidade,
        estado: barbearia.estado,
        latitude: barbearia.latitude,
        longitude: barbearia.longitude,
      },
      aceitaAgendamentoOnline: barbearia.aceitaAgendamentoOnline,
      destaque: barbearia.destaque,
      statusOperacional: this.statusOperacional(barbearia.horariosFuncionamento),
      servicos: barbearia.servicos.map((servico: any) => ({
        ...servico,
        preco: Number(servico.preco),
        duracaoMinutos: servico.qtdeSlots * 15,
      })),
      profissionais: barbearia.profissionais,
      horariosFuncionamento: barbearia.horariosFuncionamento,
    };
  }

  private statusOperacional(horarios: any[]) {
    const agora = new Date();
    const diaSemana = agora.getDay();
    const minutosAgora = agora.getHours() * 60 + agora.getMinutes();
    const horarioHoje = horarios.find((horario) => horario.diaSemana === diaSemana);

    if (!horarioHoje) {
      return { status: 'FECHADA', label: 'Fechada hoje' };
    }

    const inicio = this.minutos(horarioHoje.inicio);
    const fim = this.minutos(horarioHoje.fim);
    const intervaloInicio = horarioHoje.intervaloInicio ? this.minutos(horarioHoje.intervaloInicio) : null;
    const intervaloFim = horarioHoje.intervaloFim ? this.minutos(horarioHoje.intervaloFim) : null;
    const emExpediente = minutosAgora >= inicio && minutosAgora < fim;
    const emIntervalo =
      intervaloInicio !== null &&
      intervaloFim !== null &&
      minutosAgora >= intervaloInicio &&
      minutosAgora < intervaloFim;

    if (emExpediente && !emIntervalo) {
      return { status: 'ABERTA', label: `Aberta ate ${horarioHoje.fim}` };
    }

    if (minutosAgora < inicio) {
      return { status: 'ABRE_EM_BREVE', label: `Abre hoje as ${horarioHoje.inicio}` };
    }

    if (emIntervalo) {
      return { status: 'INTERVALO', label: `Em intervalo ate ${horarioHoje.intervaloFim}` };
    }

    return { status: 'FECHADA', label: 'Fechada agora' };
  }

  private minutos(horario: string) {
    const [hora, minuto] = horario.split(':').map(Number);
    return hora * 60 + minuto;
  }
}
