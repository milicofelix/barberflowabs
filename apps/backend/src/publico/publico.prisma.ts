import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';

const TIME_ZONE_PADRAO = 'America/Sao_Paulo';

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
      avaliacoes: {
        where: { status: 'APPROVED' },
        select: { nota: true },
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
        if (a.distanciaKm !== null && b.distanciaKm !== null) return a.distanciaKm - b.distanciaKm;
        if (a.distanciaKm !== null && b.distanciaKm === null) return -1;
        if (a.distanciaKm === null && b.distanciaKm !== null) return 1;
        if (a.statusOperacional.status !== b.statusOperacional.status) {
          return a.statusOperacional.status === 'ABERTA' ? -1 : 1;
        }
        if (a.destaque !== b.destaque) return a.destaque ? -1 : 1;
        if ((a.avaliacaoMedia ?? 0) !== (b.avaliacaoMedia ?? 0)) {
          return (b.avaliacaoMedia ?? 0) - (a.avaliacaoMedia ?? 0);
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
        avaliacoes: {
          where: { status: 'APPROVED' },
          orderBy: { createdAt: 'desc' },
          take: 6,
          select: {
            id: true,
            nota: true,
            comentario: true,
            createdAt: true,
            usuario: { select: { nome: true } },
            profissional: { select: { nome: true } },
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
      avaliacaoMedia: this.mediaAvaliacoes(barbearia.avaliacoes ?? []),
      quantidadeAvaliacoes: barbearia.avaliacoes?.length ?? 0,
      avaliacoes: (barbearia.avaliacoes ?? []).map((avaliacao: any) => ({
        id: avaliacao.id,
        nota: avaliacao.nota,
        comentario: avaliacao.comentario,
        criadoEm: avaliacao.createdAt,
        cliente: avaliacao.usuario?.nome,
        profissional: avaliacao.profissional?.nome,
      })),
      horariosFuncionamento: barbearia.horariosFuncionamento ?? [],
    };
  }

  private statusOperacional(horarios: any[]) {
    const agora = this.obterAgoraLocal();
    const diaSemana = agora.diaSemana;
    const minutosAgora = agora.minutos;
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

  private obterAgoraLocal() {
    const partes = new Intl.DateTimeFormat('pt-BR', {
      timeZone: TIME_ZONE_PADRAO,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(new Date());

    const valor = (tipo: string) => partes.find((parte) => parte.type === tipo)?.value ?? '00';
    const ano = Number(valor('year'));
    const mes = Number(valor('month'));
    const dia = Number(valor('day'));

    return {
      diaSemana: new Date(ano, mes - 1, dia).getDay(),
      minutos: Number(valor('hour')) * 60 + Number(valor('minute')),
    };
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

    const avaliacaoMedia = this.mediaAvaliacoes(barbearia.avaliacoes ?? []);
    const quantidadeAvaliacoes = barbearia.avaliacoes?.length ?? 0;

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
      avaliacaoMedia,
      quantidadeAvaliacoes,
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

  private mediaAvaliacoes(avaliacoes: any[]) {
    if (!avaliacoes.length) return null;

    const soma = avaliacoes.reduce((total, avaliacao) => total + Number(avaliacao.nota ?? 0), 0);
    return Number((soma / avaliacoes.length).toFixed(1));
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
    if (imagem === '/banners/principal.webp') return '/banners/principal.png';
    return imagem && imagem !== '/banner.png' ? imagem : '/banners/principal.png';
  }
}
