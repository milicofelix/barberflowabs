import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from 'src/db/prisma.service';
import { mapearClassificacaoEstabelecimento } from 'src/estabelecimento/classificacao-estabelecimento.mapper';

const TIME_ZONE_PADRAO = 'America/Sao_Paulo';

@Injectable()
export class PublicoPrisma {
  constructor(private readonly prisma: PrismaService) {}

  listarProfissionaisPublicos() {
    return this.prisma.profissional.findMany({
      where: {
        estabelecimento: this.criteriosPublicacao(),
        servicosHabilitados: { some: { ativo: true } },
      },
      orderBy: [
        { avaliacao: 'desc' },
        { quantidadeAvaliacoes: 'desc' },
        { nome: 'asc' },
      ],
      select: {
        id: true,
        nome: true,
        sexo: true,
        descricao: true,
        imagemURL: true,
        avaliacao: true,
        quantidadeAvaliacoes: true,
        estabelecimento: {
          select: {
            id: true,
            nome: true,
            nomePublico: true,
            slug: true,
          },
        },
      },
    });
  }

  async listarEstabelecimentos(filtros: any = {}) {
    const latitude = this.numero(filtros.lat);
    const longitude = this.numero(filtros.lng);
    const raioKm = this.numero(filtros.raioKm) ?? 10;
    const semLimiteDistancia = filtros.semLimiteDistancia === 'true';
    const termo = typeof filtros.q === 'string' ? filtros.q.trim() : '';
    const cidade = typeof filtros.cidade === 'string' ? filtros.cidade.trim() : '';
    const estado = typeof filtros.estado === 'string' ? filtros.estado.trim() : '';
    const servico = typeof filtros.servico === 'string' ? filtros.servico.trim() : '';
    const abertaAgora = filtros.abertaAgora === 'true' || filtros.status === 'ABERTA';
    const where: any = {
      ...this.criteriosPublicacao(),
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
          duracaoMinutos: true,
          preparoAntesMinutos: true,
          preparoDepoisMinutos: true,
          deslocamentoMinutos: true,
          observacoes: true,
          modeloAtendimento: true,
          requisitos: {
            where: { requisito: { ativo: true } },
            select: {
              obrigatorio: true,
              observacao: true,
              requisito: { select: { id: true, slug: true, nome: true, tipo: true } },
            },
          },
          especialidades: {
            select: {
              especialidade: { select: { id: true, slug: true, nome: true } },
            },
          },
        },
      },
      profissionais: {
        select: {
          id: true,
          avaliacao: true,
          quantidadeAvaliacoes: true,
          especialidades: {
            select: {
              principal: true,
              especialidade: { select: { id: true, slug: true, nome: true } },
            },
          },
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
      segmentos: {
        where: { segmento: { ativo: true } },
        select: {
          principal: true,
          segmento: { select: { id: true, slug: true, nome: true } },
        },
      },
      especialidades: {
        where: { especialidade: { ativo: true } },
        select: {
          especialidade: {
            select: {
              id: true,
              slug: true,
              nome: true,
              segmento: { select: { id: true, slug: true, nome: true } },
            },
          },
        },
      },
    };

    const estabelecimentos: any[] = await this.prisma.estabelecimento.findMany({
      where,
      include,
    });

    return estabelecimentos
      .map((estabelecimento) => this.resumoEstabelecimento(estabelecimento, latitude, longitude))
      .filter((estabelecimento) => {
        if (!semLimiteDistancia && latitude !== null && longitude !== null && estabelecimento.distanciaKm !== null && estabelecimento.distanciaKm > raioKm) {
          return false;
        }
        if (abertaAgora && estabelecimento.statusOperacional.status !== 'ABERTA') {
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

  async buscarEstabelecimentoPorSlug(slug: string) {
    const estabelecimento: any = await this.prisma.estabelecimento.findFirst({
      where: {
        slug,
        ...this.criteriosPublicacao(),
      },
      include: {
        servicos: {
          orderBy: { nome: 'asc' },
          select: {
            id: true,
            nome: true,
            descricao: true,
            preco: true,
            qtdeSlots: true,
            duracaoMinutos: true,
            preparoAntesMinutos: true,
            preparoDepoisMinutos: true,
            deslocamentoMinutos: true,
            imagemURL: true,
            observacoes: true,
            modeloAtendimento: true,
            requisitos: {
              where: { requisito: { ativo: true } },
              select: {
                obrigatorio: true,
                observacao: true,
                requisito: { select: { id: true, slug: true, nome: true, tipo: true } },
              },
            },
            especialidades: {
              select: {
                especialidade: { select: { id: true, slug: true, nome: true } },
              },
            },
          },
        },
        profissionais: {
          orderBy: { nome: 'asc' },
          select: {
            id: true,
            nome: true,
            sexo: true,
            descricao: true,
            imagemURL: true,
            avaliacao: true,
            quantidadeAvaliacoes: true,
            especialidades: {
              select: {
                principal: true,
                especialidade: { select: { id: true, slug: true, nome: true } },
              },
            },
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
        segmentos: {
          where: { segmento: { ativo: true } },
          select: {
            principal: true,
            segmento: { select: { id: true, slug: true, nome: true } },
          },
        },
        especialidades: {
          where: { especialidade: { ativo: true } },
          select: {
            especialidade: {
              select: {
                id: true,
                slug: true,
                nome: true,
                segmento: { select: { id: true, slug: true, nome: true } },
              },
            },
          },
        },
      },
    });

    if (!estabelecimento) return null;

    return {
      ...mapearClassificacaoEstabelecimento(estabelecimento),
      id: estabelecimento.id,
      nome: estabelecimento.nomePublico ?? estabelecimento.nome,
      slug: estabelecimento.slug,
      telefone: estabelecimento.telefone,
      email: estabelecimento.email,
      descricao: estabelecimento.descricaoPublica,
      imagemCapaURL: this.imagemCapa(estabelecimento.imagemCapaURL),
      endereco: {
        logradouro: estabelecimento.endereco,
        bairro: estabelecimento.bairro,
        cidade: estabelecimento.cidade,
        estado: estabelecimento.estado,
        latitude: estabelecimento.latitude,
        longitude: estabelecimento.longitude,
      },
      aceitaAgendamentoOnline: estabelecimento.aceitaAgendamentoOnline,
      destaque: estabelecimento.destaque,
      statusOperacional: this.statusOperacional(estabelecimento.horariosFuncionamento ?? []),
      servicos: (estabelecimento.servicos ?? []).map((servico: any) => this.mapearServicoPublico(servico)),
      profissionais: (estabelecimento.profissionais ?? []).map((profissional: any) =>
        this.mapearProfissionalPublico(profissional),
      ),
      avaliacaoMedia: this.mediaAvaliacoes(estabelecimento.avaliacoes ?? []),
      quantidadeAvaliacoes: estabelecimento.avaliacoes?.length ?? 0,
      avaliacoes: (estabelecimento.avaliacoes ?? []).map((avaliacao: any) => ({
        id: avaliacao.id,
        nota: avaliacao.nota,
        comentario: avaliacao.comentario,
        criadoEm: avaliacao.createdAt,
        cliente: avaliacao.usuario?.nome,
        profissional: avaliacao.profissional?.nome,
      })),
      horariosFuncionamento: estabelecimento.horariosFuncionamento ?? [],
    };
  }

  async denunciarPerfil(slug: string, dados: any) {
    const estabelecimento = await this.prisma.estabelecimento.findFirst({
      where: {
        slug,
        ...this.criteriosPublicacao(),
      } as any,
      select: { id: true, nome: true, slug: true },
    });

    if (!estabelecimento) throw new NotFoundException('Estabelecimento não encontrado');

    const denuncia = await (this.prisma as any).denunciaPerfilPublico.create({
      data: {
        estabelecimentoId: estabelecimento.id,
        nome: this.textoOuNulo(dados.nome),
        email: this.textoOuNulo(dados.email),
        motivo: dados.motivo.trim(),
        mensagem: dados.mensagem.trim(),
        status: 'PENDENTE',
      },
    });

    await this.prisma.logAuditoria.create({
      data: {
        estabelecimentoId: null,
        usuarioId: null,
        acao: 'PUBLIC_PROFILE_REPORT',
        entidade: 'DenunciaPerfilPublico',
        entidadeId: String(denuncia.id),
        detalhes: {
          tipo: 'DENUNCIA_PERFIL_PUBLICO',
          titulo: 'Denúncia de perfil público recebida',
          mensagem: `${estabelecimento.nome} recebeu uma denúncia pública para revisão.`,
          estabelecimentoId: estabelecimento.id,
          estabelecimentoSlug: estabelecimento.slug,
          denunciaId: denuncia.id,
          motivo: denuncia.motivo,
        },
      },
    });

    return {
      id: denuncia.id,
      status: denuncia.status,
      mensagem: 'Denúncia recebida para revisão.',
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

  private criteriosPublicacao(): Prisma.EstabelecimentoWhereInput {
    return {
      reviewStatus: 'APPROVED',
      status: { notIn: ['PAST_DUE', 'SUSPENDED', 'CANCELED'] },
      servicos: { some: {} },
      profissionais: { some: {} },
      profissionaisServicos: { some: { ativo: true } },
      horariosFuncionamento: { some: { ativo: true } },
      AND: [{ OR: [
          { modeloAtendimento: 'DOMICILIAR' },
          { endereco: { not: null }, bairro: { not: null }, cidade: { not: null }, estado: { not: null } },
      ] }],
    };
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

  private resumoEstabelecimento(estabelecimento: any, latitude: number | null, longitude: number | null) {
    const distanciaKm =
      latitude !== null && longitude !== null && estabelecimento.latitude !== null && estabelecimento.longitude !== null
        ? this.distanciaKm(latitude, longitude, estabelecimento.latitude, estabelecimento.longitude)
        : null;

    const avaliacaoMedia = this.mediaAvaliacoes(estabelecimento.avaliacoes ?? []);
    const quantidadeAvaliacoes = estabelecimento.avaliacoes?.length ?? 0;

    return {
      ...mapearClassificacaoEstabelecimento(estabelecimento),
      id: estabelecimento.id,
      nome: estabelecimento.nomePublico ?? estabelecimento.nome,
      slug: estabelecimento.slug,
      telefone: estabelecimento.telefone,
      email: estabelecimento.email,
      descricao: estabelecimento.descricaoPublica,
      imagemCapaURL: this.imagemCapa(estabelecimento.imagemCapaURL),
      endereco: {
        logradouro: estabelecimento.endereco,
        bairro: estabelecimento.bairro,
        cidade: estabelecimento.cidade,
        estado: estabelecimento.estado,
        latitude: estabelecimento.latitude,
        longitude: estabelecimento.longitude,
      },
      aceitaAgendamentoOnline: estabelecimento.aceitaAgendamentoOnline,
      destaque: estabelecimento.destaque,
      distanciaKm: distanciaKm === null ? null : Number(distanciaKm.toFixed(1)),
      statusOperacional: this.statusOperacional(estabelecimento.horariosFuncionamento ?? []),
      avaliacaoMedia,
      quantidadeAvaliacoes,
      servicos: (estabelecimento.servicos ?? []).map((servico: any) => this.mapearServicoPublico(servico)),
    };
  }

  private mapearServicoPublico(servico: any) {
    const { requisitos = [], especialidades = [], ...dadosServico } = servico;

    return {
      ...dadosServico,
      preco: Number(servico.preco),
      duracaoMinutos: servico.duracaoMinutos ?? servico.qtdeSlots * 15,
      requisitos: requisitos.map(({ requisito, obrigatorio, observacao }) => ({
        ...requisito,
        obrigatorio,
        observacao,
      })),
      especialidades: especialidades.map(({ especialidade }) => especialidade),
    };
  }

  private mapearProfissionalPublico(profissional: any) {
    const { especialidades = [], ...dadosProfissional } = profissional;
    return {
      ...dadosProfissional,
      especialidades: especialidades.map(({ especialidade, principal }) => ({
        ...especialidade,
        principal,
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

  private textoOuNulo(valor?: string | null) {
    const texto = typeof valor === 'string' ? valor.trim() : '';
    return texto || null;
  }
}
