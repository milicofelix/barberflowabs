import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { AtualizarClienteDto, EnfileirarComunicacaoDto, ListarEnviosDto, PreferenciaComunicacaoDto, SalvarTemplateDto } from './relacionamento.dto';

@Injectable()
export class RelacionamentoRepository {
  constructor(private readonly prisma: PrismaService) {}

  listarClientes(estabelecimentoId: number, busca = '') {
    const termo = busca.trim();
    return (this.prisma as any).clienteEstabelecimento.findMany({
      where: {
        estabelecimentoId,
        ...(termo ? { usuario: { OR: [{ nome: { contains: termo } }, { email: { contains: termo } }, { telefone: { contains: termo } }] } } : {}),
      },
      orderBy: [{ ultimoAgendamentoEm: 'desc' }, { createdAt: 'desc' }],
      include: {
        usuario: { select: { id: true, nome: true, email: true, telefone: true, dataNascimento: true } },
      },
    });
  }

  async obterCliente(id: number, estabelecimentoId: number) {
    const cliente = await (this.prisma as any).clienteEstabelecimento.findFirst({
      where: { id, estabelecimentoId },
      include: {
        usuario: { select: { id: true, nome: true, email: true, telefone: true, dataNascimento: true } },
      },
    });
    if (!cliente) throw new NotFoundException('Cliente não encontrado');
    return cliente;
  }

  async atualizarCliente(id: number, estabelecimentoId: number, dados: AtualizarClienteDto) {
    await this.obterCliente(id, estabelecimentoId);
    return (this.prisma as any).clienteEstabelecimento.update({
      where: { id },
      data: {
        ...(dados.status !== undefined ? { status: dados.status } : {}),
        ...(dados.tags !== undefined ? { tags: dados.tags } : {}),
        ...(dados.observacoes !== undefined ? { observacoes: dados.observacoes?.trim() || null } : {}),
        ultimaInteracaoEm: new Date(),
      },
    });
  }

  async listarPreferencias(clienteId: number, estabelecimentoId: number) {
    const cliente = await this.obterCliente(clienteId, estabelecimentoId);
    return (this.prisma as any).preferenciaComunicacao.findMany({
      where: { estabelecimentoId, usuarioId: cliente.usuarioId },
      orderBy: { canal: 'asc' },
    });
  }

  async salvarPreferencias(clienteId: number, estabelecimentoId: number, preferencias: PreferenciaComunicacaoDto[]) {
    const cliente = await this.obterCliente(clienteId, estabelecimentoId);
    const agora = new Date();
    await this.prisma.$transaction(preferencias.map((preferencia) =>
      (this.prisma as any).preferenciaComunicacao.upsert({
        where: { estabelecimentoId_usuarioId_canal: { estabelecimentoId, usuarioId: cliente.usuarioId, canal: preferencia.canal } },
        create: {
          estabelecimentoId, usuarioId: cliente.usuarioId, canal: preferencia.canal,
          consentido: preferencia.consentido, origem: preferencia.origem ?? 'USUARIO',
          versaoTermos: preferencia.versaoTermos?.trim() || null,
          consentidoEm: preferencia.consentido ? agora : null, revogadoEm: preferencia.consentido ? null : agora,
        },
        update: {
          consentido: preferencia.consentido, origem: preferencia.origem ?? 'USUARIO',
          versaoTermos: preferencia.versaoTermos?.trim() || null,
          consentidoEm: preferencia.consentido ? agora : null, revogadoEm: preferencia.consentido ? null : agora,
        },
      }),
    ));
    return this.listarPreferencias(clienteId, estabelecimentoId);
  }

  listarTemplates(estabelecimentoId: number) {
    return (this.prisma as any).templateComunicacao.findMany({ where: { estabelecimentoId }, orderBy: [{ evento: 'asc' }, { nome: 'asc' }] });
  }

  async salvarTemplate(estabelecimentoId: number, dados: SalvarTemplateDto, id?: number) {
    const data = { ...dados, nome: dados.nome.trim(), conteudo: dados.conteudo.trim(), assunto: dados.assunto?.trim() || null };
    if (!id) return (this.prisma as any).templateComunicacao.create({ data: { estabelecimentoId, ...data } });
    const template = await (this.prisma as any).templateComunicacao.findFirst({ where: { id, estabelecimentoId }, select: { id: true } });
    if (!template) throw new NotFoundException('Template não encontrado');
    return (this.prisma as any).templateComunicacao.update({ where: { id }, data });
  }

  async prepararEnvio(estabelecimentoId: number, dados: EnfileirarComunicacaoDto) {
    const [cliente, template] = await Promise.all([
      (this.prisma as any).clienteEstabelecimento.findFirst({
        where: { id: Number(dados.clienteId), estabelecimentoId, status: 'ATIVO' },
        include: {
          usuario: { select: { id: true, email: true, emailContato: true, emailTecnico: true, telefone: true } },
        },
      }),
      (this.prisma as any).templateComunicacao.findFirst({
        where: { id: Number(dados.templateId), estabelecimentoId, ativo: true },
      }),
    ]);
    if (!cliente) throw new NotFoundException('Cliente ativo não encontrado');
    if (!template) throw new NotFoundException('Template ativo não encontrado');
    const preferencia = await (this.prisma as any).preferenciaComunicacao.findUnique({
      where: { estabelecimentoId_usuarioId_canal: { estabelecimentoId, usuarioId: cliente.usuarioId, canal: template.canal } },
    });
    return {
      cliente: {
        ...cliente,
        usuario: {
          ...cliente.usuario,
          email: cliente.usuario.emailTecnico ? null : (cliente.usuario.emailContato ?? cliente.usuario.email),
          emailContato: undefined,
          emailTecnico: undefined,
        },
      },
      template,
      preferencia,
    };
  }

  criarEnvio(data: Record<string, unknown>) {
    return (this.prisma as any).envioComunicacao.create({ data, include: { template: true } });
  }

  async obterEnvio(id: number, estabelecimentoId: number) {
    const envio = await (this.prisma as any).envioComunicacao.findFirst({
      where: { id, estabelecimentoId },
      include: { template: true, tentativas: { orderBy: { numero: 'desc' } }, callbacks: { orderBy: { recebidoEm: 'desc' } } },
    });
    if (!envio) throw new NotFoundException('Envio não encontrado');
    return envio;
  }

  listarEnvios(estabelecimentoId: number, filtros: ListarEnviosDto) {
    const pagina = Math.max(1, Number(filtros.pagina) || 1);
    const limite = Math.min(100, Math.max(1, Number(filtros.limite) || 25));
    const where = {
      estabelecimentoId,
      ...(filtros.status ? { status: filtros.status } : {}),
      ...(filtros.canal ? { canal: filtros.canal } : {}),
    };
    return this.prisma.$transaction([
      (this.prisma as any).envioComunicacao.findMany({
        where, skip: (pagina - 1) * limite, take: limite, orderBy: { createdAt: 'desc' },
        include: { tentativas: { orderBy: { numero: 'desc' }, take: 1 } },
      }),
      (this.prisma as any).envioComunicacao.count({ where }),
    ]).then(([itens, total]) => ({ itens, total, pagina, limite }));
  }

  async reprocessarEnvio(id: number, estabelecimentoId: number, tentativasAdicionais: number) {
    const envio = await this.obterEnvio(id, estabelecimentoId);
    if (envio.campanhaId || envio.tipo === 'CAMPANHA') throw new ConflictException('Campanha encerrada/falha exige nova campanha; não reprocessar fora do controle de frequência e audiência');
    if (!['FILA_MORTA', 'FALHA_PERMANENTE'].includes(envio.status)) {
      throw new ConflictException('Somente envios na fila morta ou com falha permanente podem ser reprocessados');
    }
    return (this.prisma as any).envioComunicacao.update({
      where: { id },
      data: {
        status: 'AGENDADO', agendadoPara: new Date(), proximaTentativaEm: null,
        maximoTentativas: envio.tentativasRealizadas + tentativasAdicionais,
        bloqueadoEm: null, bloqueadoPor: null, erro: null,
      },
    });
  }

  async reivindicarProximo(workerId: string) {
    const agora = new Date();
    const lockExpirado = new Date(agora.getTime() - 5 * 60_000);
    const candidatos = await (this.prisma as any).envioComunicacao.findMany({
      where: {
        status: { in: ['AGENDADO', 'RETENTATIVA', 'PROCESSANDO'] },
        OR: [
          { status: { in: ['AGENDADO', 'RETENTATIVA'] }, agendadoPara: { lte: agora }, OR: [{ proximaTentativaEm: null }, { proximaTentativaEm: { lte: agora } }] },
          { status: 'PROCESSANDO', bloqueadoEm: { lt: lockExpirado } },
        ],
      },
      orderBy: [{ proximaTentativaEm: 'asc' }, { agendadoPara: 'asc' }],
      take: 10,
      select: { id: true },
    });
    for (const candidato of candidatos) {
      const atualizado = await (this.prisma as any).envioComunicacao.updateMany({
        where: {
          id: candidato.id,
          OR: [
            { status: { in: ['AGENDADO', 'RETENTATIVA'] }, bloqueadoEm: null },
            { status: 'PROCESSANDO', bloqueadoEm: { lt: lockExpirado } },
          ],
        },
        data: { status: 'PROCESSANDO', bloqueadoEm: agora, bloqueadoPor: workerId },
      });
      if (atualizado.count) return (this.prisma as any).envioComunicacao.findUnique({ where: { id: candidato.id } });
    }
    return null;
  }

  async iniciarTentativa(envioId: number, provedor: string) {
    const ultima = await (this.prisma as any).tentativaEnvioComunicacao.aggregate({ where: { envioId }, _max: { numero: true } });
    return (this.prisma as any).tentativaEnvioComunicacao.create({
      data: { envioId, numero: (ultima._max.numero ?? 0) + 1, status: 'PROCESSANDO', provedor },
    });
  }

  concluirEnvio(envioId: number, tentativaId: number, resultado: any) {
    const agora = new Date();
    return this.prisma.$transaction([
      (this.prisma as any).tentativaEnvioComunicacao.update({
        where: { id: tentativaId }, data: { status: 'ACEITO', referenciaExterna: resultado.referenciaExterna, resposta: resultado.resposta, finalizadaEm: agora },
      }),
      (this.prisma as any).envioComunicacao.update({
        where: { id: envioId }, data: {
          status: 'ENVIADO', tentativasRealizadas: { increment: 1 }, enviadoEm: agora,
          provedor: resultado.provedor, referenciaExterna: resultado.referenciaExterna,
          bloqueadoEm: null, bloqueadoPor: null, proximaTentativaEm: null, erro: null,
        },
      }),
    ]);
  }

  falharEnvio(envio: any, tentativaId: number, erro: string, permanente: boolean) {
    const tentativas = envio.tentativasRealizadas + 1;
    const filaMorta = permanente || tentativas >= envio.maximoTentativas;
    const atrasoMinutos = Math.min(60, 2 ** Math.max(0, tentativas - 1));
    const proximaTentativaEm = filaMorta ? null : new Date(Date.now() + atrasoMinutos * 60_000);
    return this.prisma.$transaction([
      (this.prisma as any).tentativaEnvioComunicacao.update({
        where: { id: tentativaId }, data: { status: filaMorta ? 'FALHOU' : 'RETENTATIVA', erro, finalizadaEm: new Date() },
      }),
      (this.prisma as any).envioComunicacao.update({
        where: { id: envio.id }, data: {
          status: permanente ? 'FALHA_PERMANENTE' : (filaMorta ? 'FILA_MORTA' : 'RETENTATIVA'),
          tentativasRealizadas: tentativas, proximaTentativaEm, erro, bloqueadoEm: null, bloqueadoPor: null,
        },
      }),
    ]);
  }

  async registrarCallback(provedor: string, dados: any) {
    const existente = await (this.prisma as any).callbackEnvioComunicacao.findUnique({
      where: { provedor_eventoExternoId: { provedor, eventoExternoId: dados.eventoId } },
    });
    if (existente) return { callback: existente, duplicado: true };
    const envio = dados.referenciaExterna ? await (this.prisma as any).envioComunicacao.findFirst({
      where: { provedor, referenciaExterna: dados.referenciaExterna }, select: { id: true, metadados: true },
    }) : null;
    let callback: any;
    try {
      callback = await this.prisma.$transaction(async (tx) => {
        const criado = await (tx as any).callbackEnvioComunicacao.create({
          data: {
            envioId: envio?.id ?? null, provedor, eventoExternoId: dados.eventoId,
            referenciaExterna: dados.referenciaExterna || null, tipo: dados.tipo,
            payload: dados.payload ?? {}, processadoEm: new Date(),
          },
        });
        if (envio) {
          await (tx as any).envioComunicacao.update({
            where: { id: envio.id },
            data: {
              ...(dados.tipo === 'FALHOU' ? { status: 'FALHA_PERMANENTE', erro: 'Falha informada pelo provedor' } : {}),
              metadados: { ...(envio.metadados ?? {}), ultimoCallback: { tipo: dados.tipo, recebidoEm: new Date().toISOString() } },
            },
          });
        }
        return criado;
      });
    } catch (error: any) {
      if (error?.code !== 'P2002') throw error;
      callback = await (this.prisma as any).callbackEnvioComunicacao.findUnique({
        where: { provedor_eventoExternoId: { provedor, eventoExternoId: dados.eventoId } },
      });
      return { callback, duplicado: true };
    }
    return { callback, duplicado: false };
  }
}
