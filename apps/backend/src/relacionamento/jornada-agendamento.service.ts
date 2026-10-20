import { BadRequestException, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { sign, verify } from 'jsonwebtoken';
import { PrismaService } from 'src/db/prisma.service';
import { FluxoAtendimentoService } from 'src/gestao/fluxo-atendimento.service';
import { bloquearClienteComunicacao } from './governanca/privacidade-comunicacao';

type AcaoAgendamento = 'CONFIRMAR' | 'CANCELAR' | 'REAGENDAR';

interface TokenAcao {
  scope: 'AGENDAMENTO_ACAO';
  acao: AcaoAgendamento;
  agendamentoId: number;
  estabelecimentoId: number;
  usuarioId: number;
}

@Injectable()
export class JornadaAgendamentoService {
  private readonly logger = new Logger(JornadaAgendamentoService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly fluxoAtendimento: FluxoAtendimentoService,
  ) {}

  async registrarCriacao(agendamentoId: number) {
    await this.executarSemInterromperAgenda('criação', async () => {
      const agendamento = await this.carregarAgendamento(agendamentoId);
      if (!agendamento) return;
      await this.enfileirarEvento(agendamento, 'CONFIRMACAO_AGENDAMENTO', 'criado');
      await this.recriarLembretes(agendamento);
    });
  }

  async registrarReagendamento(agendamentoId: number) {
    await this.executarSemInterromperAgenda('reagendamento', async () => {
      await this.cancelarPendentes(agendamentoId, ['LEMBRETE_AGENDAMENTO']);
      const agendamento = await this.carregarAgendamento(agendamentoId);
      if (!agendamento) return;
      await this.enfileirarEvento(
        agendamento,
        'CONFIRMACAO_AGENDAMENTO',
        `reagendado:${agendamento.data.toISOString()}`,
      );
      await this.recriarLembretes(agendamento);
    });
  }

  async registrarConfirmacao(agendamentoId: number) {
    await this.executarSemInterromperAgenda('confirmação', async () => {
      const agendamento = await this.carregarAgendamento(agendamentoId);
      if (agendamento) await this.enfileirarEvento(agendamento, 'CONFIRMACAO_AGENDAMENTO', 'confirmado');
    });
  }

  async registrarCancelamento(agendamentoId: number) {
    await this.executarSemInterromperAgenda('cancelamento', () => this.cancelarPendentes(agendamentoId));
  }

  async obterAcao(token: string) {
    const payload = this.validarToken(token);
    const agendamento = await this.carregarAgendamento(payload.agendamentoId);
    this.validarVinculoToken(payload, agendamento);
    return {
      acao: payload.acao,
      agendamentoId: agendamento.id,
      estabelecimentoId: agendamento.estabelecimentoId,
      estabelecimento: agendamento.estabelecimento.nomePublico ?? agendamento.estabelecimento.nome,
      profissional: agendamento.profissional.nome,
      servicos: agendamento.servicos.map((servico: any) => servico.nome),
      data: agendamento.data,
      fusoHorario: agendamento.estabelecimento.fusoHorario,
      status: agendamento.status,
    };
  }

  async confirmarPorToken(token: string) {
    const payload = this.validarToken(token, 'CONFIRMAR');
    const agendamento = await this.carregarAgendamento(payload.agendamentoId);
    this.validarVinculoToken(payload, agendamento);
    if (agendamento.status === 'CONFIRMADO') return this.obterAcao(token);
    if (agendamento.status !== 'AGENDADO') throw new BadRequestException('Este agendamento não pode mais ser confirmado');
    await this.fluxoAtendimento.alterarManual(
      agendamento.id,
      agendamento.estabelecimentoId,
      'CONFIRMADO',
      agendamento.usuarioId,
      'Confirmação pelo cliente',
    );
    await this.registrarConfirmacao(agendamento.id);
    return { ...(await this.obterAcao(token)), status: 'CONFIRMADO' };
  }

  async cancelarPorToken(token: string) {
    const payload = this.validarToken(token, 'CANCELAR');
    const agendamento = await this.carregarAgendamento(payload.agendamentoId);
    this.validarVinculoToken(payload, agendamento);
    if (agendamento.status === 'CANCELADO') return this.obterAcao(token);
    if (!['AGENDADO', 'CONFIRMADO'].includes(agendamento.status) || agendamento.data <= new Date()) {
      throw new BadRequestException('Este agendamento não pode mais ser cancelado');
    }
    await this.fluxoAtendimento.alterarManual(
      agendamento.id,
      agendamento.estabelecimentoId,
      'CANCELADO',
      agendamento.usuarioId,
      'Cancelamento pelo cliente',
    );
    await this.registrarCancelamento(agendamento.id);
    return { ...(await this.obterAcao(token)), status: 'CANCELADO' };
  }

  private async recriarLembretes(agendamento: any) {
    const estabelecimento = agendamento.estabelecimento;
    if (!estabelecimento.lembreteAgendamentoAtivo) return;
    const desejado = new Date(agendamento.data.getTime() - estabelecimento.lembreteAntecedenciaMinutos * 60_000);
    const agendadoPara = this.ajustarJanelaSilenciosa(
      desejado < new Date() ? new Date() : desejado,
      estabelecimento.fusoHorario,
      estabelecimento.janelaSilenciosaInicio,
      estabelecimento.janelaSilenciosaFim,
    );
    if (agendadoPara >= agendamento.data) return;
    await this.enfileirarEvento(
      agendamento,
      'LEMBRETE_AGENDAMENTO',
      agendamento.data.toISOString(),
      agendadoPara,
    );
  }

  private async enfileirarEvento(agendamento: any, evento: string, revisao: string, dataBase = new Date()) {
    const templates = await this.obterTemplates(agendamento.estabelecimentoId, evento);
    const preferencias = await this.prisma.preferenciaComunicacao.findMany({
      where: { estabelecimentoId: agendamento.estabelecimentoId, usuarioId: agendamento.usuarioId, consentido: true },
    });
    const canaisPermitidos = new Set(preferencias.map((item) => item.canal));
    const variaveis = this.variaveis(agendamento);
    const agendadoPara = this.ajustarJanelaSilenciosa(
      dataBase,
      agendamento.estabelecimento.fusoHorario,
      agendamento.estabelecimento.janelaSilenciosaInicio,
      agendamento.estabelecimento.janelaSilenciosaFim,
    );

    for (const template of templates) {
      if (!canaisPermitidos.has(template.canal)) continue;
      const destinatario = this.destinatario(template.canal, agendamento.usuario);
      if (!destinatario) continue;
      try {
        await this.prisma.$transaction(async (tx: any) => {
        await bloquearClienteComunicacao(tx, agendamento.estabelecimentoId, agendamento.usuarioId);
        await tx.envioComunicacao.create({
          data: {
            estabelecimentoId: agendamento.estabelecimentoId,
            usuarioId: agendamento.usuarioId,
            agendamentoId: agendamento.id,
            templateId: template.id,
            canal: template.canal,
            tipo: evento,
            destinatario,
            assunto: template.assunto ? this.renderizar(template.assunto, variaveis) : null,
            conteudo: this.renderizar(template.conteudo, variaveis),
            chaveIdempotencia: `jornada:${agendamento.id}:${evento}:${template.canal}:${revisao}`,
            agendadoPara,
            metadados: { origem: 'JORNADA_AGENDAMENTO', evento, fusoHorario: agendamento.estabelecimento.fusoHorario },
          },
        });
        }, { isolationLevel: 'ReadCommitted' });
      } catch (erro: any) {
        if (erro?.code !== 'P2002') throw erro;
      }
    }
  }

  private async obterTemplates(estabelecimentoId: number, evento: string) {
    const existentes = await this.prisma.templateComunicacao.findMany({
      where: { estabelecimentoId, evento }, orderBy: { id: 'asc' },
    });
    const canais = ['PUSH', 'EMAIL', 'WHATSAPP'];
    for (const canal of canais) {
      if (existentes.some((item) => item.canal === canal)) continue;
      const lembrete = evento === 'LEMBRETE_AGENDAMENTO';
      existentes.push(await this.prisma.templateComunicacao.create({ data: {
        estabelecimentoId,
        nome: `${lembrete ? 'Lembrete' : 'Confirmação'} automático de agendamento`,
        evento,
        canal,
        assunto: lembrete ? 'Lembrete do seu agendamento' : 'Seu agendamento foi registrado',
        conteudo: lembrete
          ? 'Olá, {{nome}}. Seu horário em {{estabelecimento}} é {{data}} às {{hora}}. Reagendar: {{linkReagendar}} | Cancelar: {{linkCancelar}}'
          : 'Olá, {{nome}}. Seu horário em {{estabelecimento}} foi registrado para {{data}} às {{hora}}. Confirmar: {{linkConfirmar}} | Reagendar: {{linkReagendar}} | Cancelar: {{linkCancelar}}',
      }}));
    }
    return canais.flatMap((canal) => existentes.filter((item) => item.canal === canal && item.ativo).slice(0, 1));
  }

  private async carregarAgendamento(id: number) {
    return (this.prisma as any).agendamento.findUnique({ where: { id }, include: {
      usuario: true, profissional: true, servicos: true,
      estabelecimento: { select: {
        id: true, nome: true, nomePublico: true, fusoHorario: true,
        lembreteAgendamentoAtivo: true, lembreteAntecedenciaMinutos: true,
        janelaSilenciosaInicio: true, janelaSilenciosaFim: true,
      } },
    } });
  }

  private async cancelarPendentes(agendamentoId: number, tipos?: string[]) {
    await this.prisma.envioComunicacao.updateMany({
      where: { agendamentoId, status: { in: ['AGENDADO', 'RETENTATIVA'] }, ...(tipos ? { tipo: { in: tipos } } : {}) },
      data: { status: 'CANCELADO', erro: 'Cancelado automaticamente pela jornada do agendamento' },
    });
  }

  private variaveis(agendamento: any) {
    const formato = new Intl.DateTimeFormat('pt-BR', {
      timeZone: agendamento.estabelecimento.fusoHorario, day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(agendamento.data);
    const parte = (tipo: string) => formato.find((item) => item.type === tipo)?.value ?? '';
    const base = (process.env.PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
    const link = (acao: AcaoAgendamento) => `${base}/agendamento/acao?token=${encodeURIComponent(this.criarToken(agendamento, acao))}`;
    return {
      nome: agendamento.usuario.nome,
      estabelecimento: agendamento.estabelecimento.nomePublico ?? agendamento.estabelecimento.nome,
      profissional: agendamento.profissional.nome,
      servicos: agendamento.servicos.map((servico: any) => servico.nome).join(', '),
      data: `${parte('day')}/${parte('month')}/${parte('year')}`,
      hora: `${parte('hour')}:${parte('minute')}`,
      linkConfirmar: link('CONFIRMAR'), linkReagendar: link('REAGENDAR'), linkCancelar: link('CANCELAR'),
    };
  }

  private criarToken(agendamento: any, acao: AcaoAgendamento) {
    return sign({
      scope: 'AGENDAMENTO_ACAO', acao, agendamentoId: agendamento.id,
      estabelecimentoId: agendamento.estabelecimentoId, usuarioId: agendamento.usuarioId,
    }, this.segredo(), { expiresIn: Math.max(3600, Math.floor((agendamento.data.getTime() - Date.now()) / 1000) + 3600) });
  }

  private validarToken(token: string, acao?: AcaoAgendamento): TokenAcao {
    try {
      const payload = verify(token, this.segredo()) as TokenAcao;
      if (payload.scope !== 'AGENDAMENTO_ACAO' || (acao && payload.acao !== acao)) throw new Error();
      return payload;
    } catch {
      throw new UnauthorizedException('Link inválido ou expirado');
    }
  }

  private validarVinculoToken(payload: TokenAcao, agendamento: any) {
    if (!agendamento || agendamento.estabelecimentoId !== payload.estabelecimentoId || agendamento.usuarioId !== payload.usuarioId) {
      throw new NotFoundException('Agendamento não encontrado');
    }
  }

  private segredo() {
    const segredo = process.env.AGENDAMENTO_ACAO_SECRET ?? process.env.JWT_SECRET;
    if (!segredo) throw new Error('AGENDAMENTO_ACAO_SECRET ou JWT_SECRET não configurado');
    return segredo;
  }

  private destinatario(canal: string, usuario: any) {
    if (canal === 'PUSH') return `push:usuario:${usuario.id}`;
    if (canal === 'EMAIL') return usuario.emailTecnico ? null : (usuario.emailContato ?? usuario.email);
    if (canal === 'WHATSAPP') return usuario.telefoneNormalizado ?? usuario.telefone;
    return null;
  }

  private renderizar(texto: string, variaveis: Record<string, string>) {
    return texto.replace(/\{\{(\w+)\}\}/g, (_, chave) => variaveis[chave] ?? '');
  }

  private ajustarJanelaSilenciosa(data: Date, fuso: string, inicio: string, fim: string) {
    let ajustada = new Date(data);
    for (let tentativa = 0; tentativa < 3; tentativa += 1) {
      const partes = new Intl.DateTimeFormat('en-GB', { timeZone: fuso, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(ajustada);
      const minutos = Number(partes.find((p) => p.type === 'hour')?.value) * 60 + Number(partes.find((p) => p.type === 'minute')?.value);
      const [hi, mi] = inicio.split(':').map(Number); const [hf, mf] = fim.split(':').map(Number);
      const comeco = hi * 60 + mi; const termino = hf * 60 + mf;
      const dentro = comeco < termino ? minutos >= comeco && minutos < termino : minutos >= comeco || minutos < termino;
      if (!dentro) return ajustada;
      const avance = comeco < termino ? termino - minutos : minutos >= comeco ? 1440 - minutos + termino : termino - minutos;
      ajustada = new Date(ajustada.getTime() + Math.max(avance, 1) * 60_000);
    }
    return ajustada;
  }

  private async executarSemInterromperAgenda(contexto: string, acao: () => Promise<void>) {
    try { await acao(); } catch (erro: any) {
      this.logger.warn(`Não foi possível sincronizar a comunicação de ${contexto}: ${erro?.message ?? 'erro desconhecido'}`);
    }
  }
}
