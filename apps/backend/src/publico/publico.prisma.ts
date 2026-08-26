import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';

@Injectable()
export class PublicoPrisma {
  constructor(private readonly prisma: PrismaService) {}

  async listarBarbearias(filtros: any = {}) {
    const latitude = this.numero(filtros.lat);
    const longitude = this.numero(filtros.lng);
    const raioKm = this.numero(filtros.raioKm) ?? 10;
    const termo = typeof filtros.q === 'string' ? filtros.q.trim() : '';
    const cidade = typeof filtros.cidade === 'string' ? filtros.cidade.trim() : '';
    const estado = typeof filtros.estado === 'string' ? filtros.estado.trim() : '';
    const servico = typeof filtros.servico === 'string' ? filtros.servico.trim() : '';
    const abertaAgora = filtros.abertaAgora === 'true' || filtros.status === 'ABERTA';
    const where: any = {
      reviewStatus: 'APPROVED',
      status: { notIn: ['SUSPENDED', 'CANCELED'] },
      ...(termo
        ? {
            OR: [
              { nome: { contains: termo } },
              { nomePublico: { contains: termo } },
              { bairro: { contains: termo } },
              { cidade: { contains: termo } },
            ],
          }
        : {}),
      ...(cidade ? { cidade: { contains: cidade } } : {}),
      ...(estado ? { estado: { contains: estado } } : {}),
      ...(servico
        ? {
            servicos: {
              some: {
                nome: { contains: servico },
              },
            },
          }
        : {}),
    };
    const include: any = {
      servicos: {
        orderBy: { nome: 'asc' },
        select: {
          id: true,
          nome: true,
          preco: true,
          qtdeSlots: true,
        },
      },
      profissionais: {
        select: {
          id: true,
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
    };

    const barbearias: any[] = await this.prisma.barbearia.findMany({
      where,
      include,
    });

    return barbearias
      .map((barbearia) => this.resumoBarbearia(barbearia, latitude, longitude))
      .filter((barbearia) => {
        if (latitude !== null && longitude !== null && barbearia.distanciaKm !== null && barbearia.distanciaKm > raioKm) {
          return false;
        }
        if (abertaAgora && barbearia.statusOperacional.status !== 'ABERTA') {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.destaque !== b.destaque) return a.destaque ? -1 : 1;
        if (a.distanciaKm !== null && b.distanciaKm !== null) return a.distanciaKm - b.distanciaKm;
        if (a.statusOperacional.status !== b.statusOperacional.status) {
          return a.statusOperacional.status === 'ABERTA' ? -1 : 1;
        }
        return a.nome.localeCompare(b.nome);
      });
  }

  async buscarBarbeariaPorSlug(slug: string) {
    const barbearia: any = await this.prisma.barbearia.findFirst({
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
      imagemCapaURL: this.imagemCapa(barbearia.imagemCapaURL),
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
      statusOperacional: this.statusOperacional(barbearia.horariosFuncionamento ?? []),
      servicos: (barbearia.servicos ?? []).map((servico: any) => ({
        ...servico,
        preco: Number(servico.preco),
        duracaoMinutos: servico.qtdeSlots * 15,
      })),
      profissionais: barbearia.profissionais ?? [],
      horariosFuncionamento: barbearia.horariosFuncionamento ?? [],
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

  private resumoBarbearia(barbearia: any, latitude: number | null, longitude: number | null) {
    const distanciaKm =
      latitude !== null && longitude !== null && barbearia.latitude !== null && barbearia.longitude !== null
        ? this.distanciaKm(latitude, longitude, barbearia.latitude, barbearia.longitude)
        : null;

    const avaliacoes = (barbearia.profissionais ?? []).reduce(
      (total: any, profissional: any) => ({
        soma: total.soma + Number(profissional.avaliacao ?? 0) * Number(profissional.quantidadeAvaliacoes ?? 0),
        quantidade: total.quantidade + Number(profissional.quantidadeAvaliacoes ?? 0),
      }),
      { soma: 0, quantidade: 0 },
    );

    return {
      id: barbearia.id,
      nome: barbearia.nomePublico ?? barbearia.nome,
      slug: barbearia.slug,
      telefone: barbearia.telefone,
      email: barbearia.email,
      descricao: barbearia.descricaoPublica,
      imagemCapaURL: this.imagemCapa(barbearia.imagemCapaURL),
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
      distanciaKm: distanciaKm === null ? null : Number(distanciaKm.toFixed(1)),
      statusOperacional: this.statusOperacional(barbearia.horariosFuncionamento ?? []),
      avaliacaoMedia: avaliacoes.quantidade > 0 ? Number((avaliacoes.soma / avaliacoes.quantidade).toFixed(1)) : null,
      quantidadeAvaliacoes: avaliacoes.quantidade,
      servicos: (barbearia.servicos ?? []).map((servico: any) => ({
        ...servico,
        preco: Number(servico.preco),
        duracaoMinutos: servico.qtdeSlots * 15,
      })),
    };
  }

  private numero(valor: any) {
    if (valor === undefined || valor === null || valor === '') return null;
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : null;
  }

  private distanciaKm(lat1: number, lng1: number, lat2: number, lng2: number) {
    const raioTerraKm = 6371;
    const dLat = this.rad(lat2 - lat1);
    const dLng = this.rad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.rad(lat1)) * Math.cos(this.rad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

    return raioTerraKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private rad(valor: number) {
    return (valor * Math.PI) / 180;
  }

  private imagemCapa(imagem?: string | null) {
    return imagem && imagem !== '/banner.png' ? imagem : '/banners/principal.webp';
  }
}
