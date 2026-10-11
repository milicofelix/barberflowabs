import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { AtualizarClienteDto, PreferenciaComunicacaoDto, SalvarTemplateDto } from './relacionamento.dto';

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
}
