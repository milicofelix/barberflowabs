import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { AgendaAtualizacaoService } from 'src/motor-agenda/agenda-atualizacao.service';
import { AlocacaoRecurso, MotorAgendaDisponibilidadePrisma } from 'src/motor-agenda/motor-agenda.disponibilidade.prisma';
import { MotorAgendaConsultaPrisma } from 'src/motor-agenda/motor-agenda.consulta.prisma';
import { ConflitoAgendaError } from 'src/motor-agenda/conflito-agenda.error';
import { OrquestradorAtendimentoService } from './orquestrador-atendimento.service';

@Injectable()
export class RetomarAutomacaoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly disponibilidade: MotorAgendaDisponibilidadePrisma,
    private readonly consulta: MotorAgendaConsultaPrisma,
    private readonly orquestrador: OrquestradorAtendimentoService,
    private readonly atualizacoes: AgendaAtualizacaoService,
  ) {}

  async executar(id: number, estabelecimentoId: number, usuarioId: number, agora = new Date()) {
    const resultado = await this.prisma.$transaction(async (transacao) => {
      const tx = transacao as any;
      await tx.$queryRawUnsafe('SELECT id FROM agendamentos WHERE id = ? AND estabelecimentoId = ? FOR UPDATE', id, estabelecimentoId);
      const atual = await tx.agendamento.findFirst({ where: { id, estabelecimentoId }, include: {
        estabelecimento: true, servicos: { include: { recursosNecessarios: true } },
        itens: { orderBy: { ordem: 'asc' } },
      } });
      if (!atual) throw new NotFoundException('Atendimento não encontrado nesta unidade');
      if (['CONCLUIDO', 'CANCELADO', 'NO_SHOW'].includes(atual.status)) throw new BadRequestException('Atendimento encerrado não pode retomar automação');
      if (!['AGENDADO', 'CONFIRMADO', 'ATRASADO', 'CHECKIN'].includes(atual.status)) throw new BadRequestException('Estado do atendimento não permite retomar automação');
      if (!atual.estabelecimento.fluxoAtendimentoAutomaticoAtivo) throw new BadRequestException('O fluxo automático está desativado nas configurações da unidade');
      if (!atual.controleManualEm && atual.automacaoAtendimentoAtiva && atual.status !== 'ATRASADO') return { alterado: false };

      const inicio = atual.iniciadoEm ?? (atual.data > agora ? atual.data : agora);
      const jaIniciou = !!atual.iniciadoEm || atual.status === 'CHECKIN';
      if (!jaIniciou && atual.data <= agora && !atual.estabelecimento.inicioAtendimentoAutomaticoAtivo) {
        throw new BadRequestException('O início automático está desativado. Inicie o atendimento manualmente antes de retomar.');
      }
      const duracao = atual.itens.length
        ? atual.itens.reduce((total: number, item: any) => total + Number(item.duracaoMinutos), 0)
        : atual.servicos.reduce((total: number, servico: any) => total + Number(servico.duracaoMinutos ?? servico.qtdeSlots * 15), 0);
      if (!Number.isFinite(duracao) || duracao <= 0) throw new BadRequestException('O atendimento não possui duração válida');
      const fim = new Date(inicio.getTime() + duracao * 60_000);
      const deslocamento = Math.max(0, Number(atual.deslocamentoMinutos ?? 0));
      const periodo = {
        data: inicio, dataFim: fim, inicioOcupacao: new Date(inicio.getTime() - deslocamento * 60_000),
        fimOcupacao: new Date(fim.getTime() + deslocamento * 60_000), duracaoMinutos: duracao,
        preparoAntesMinutos: 0, preparoDepoisMinutos: 0, deslocamentoMinutos: deslocamento, valorTotal: Number(atual.valorTotal),
      };
      await tx.$queryRawUnsafe('SELECT id FROM profissionais WHERE id = ? AND estabelecimentoId = ? FOR UPDATE', atual.profissionalId, estabelecimentoId);
      await tx.$queryRawUnsafe('SELECT id FROM recursos WHERE estabelecimentoId = ? AND ativo = true FOR UPDATE', estabelecimentoId);
      let recursos: AlocacaoRecurso[];
      try {
        await this.consulta.validarHorarioFuncionamento(estabelecimentoId, atual.unidadeId, periodo.inicioOcupacao, periodo.fimOcupacao);
        recursos = await this.disponibilidade.verificar(tx, {
          estabelecimentoId, profissionalId: atual.profissionalId, unidadeId: atual.unidadeId,
          modeloAtendimento: atual.modeloAtendimento, modeloEstabelecimento: atual.estabelecimento.modeloAtendimento,
          servicos: atual.servicos,
        }, periodo, id);
      } catch (erro) {
        if (erro instanceof ConflitoAgendaError) throw new ConflictException(erro.message);
        throw erro;
      }
      const status = jaIniciou || atual.data <= agora ? 'CHECKIN' : atual.status === 'ATRASADO' ? 'CONFIRMADO' : atual.status;
      const atualizado = await tx.agendamento.updateMany({
        where: { id, estabelecimentoId, status: atual.status, revisaoFluxo: atual.revisaoFluxo },
        data: {
          status, automacaoAtendimentoAtiva: true, controleManualEm: null, controleManualPorId: null,
          iniciadoEm: status === 'CHECKIN' ? inicio : atual.iniciadoEm,
          dataFim: fim, inicioOcupacao: periodo.inicioOcupacao, fimOcupacao: periodo.fimOcupacao,
          revisaoFluxo: { increment: 1 },
        },
      });
      if (atualizado.count !== 1) throw new ConflictException('O atendimento foi alterado. Atualize a agenda.');
      await tx.agendamentoRecurso.deleteMany({ where: { agendamentoId: id } });
      if (recursos.length) await tx.agendamentoRecurso.createMany({ data: recursos.map((recurso) => ({
        ...recurso, agendamentoId: id, inicio: periodo.inicioOcupacao, fim: periodo.fimOcupacao,
      })) });
      await tx.transicaoAgendamento.updateMany({
        where: { agendamentoId: id, status: { in: ['AGENDADA', 'PROCESSANDO'] } },
        data: { status: 'CANCELADA', processadoEm: agora, bloqueadoEm: null, bloqueadoPor: null },
      });
      await tx.logAuditoria.create({ data: {
        usuarioId, estabelecimentoId, entidade: 'Agendamento', entidadeId: String(id), acao: 'AGENDAMENTO_AUTOMACAO_RETOMADA',
        detalhes: { anterior: atual.status, novo: status, origem: 'MANUAL', revisaoFluxo: atual.revisaoFluxo + 1, dataEfetiva: agora.toISOString(), terminoPrevisto: fim.toISOString() },
      } });
      return { alterado: true };
    });
    if (resultado.alterado) this.atualizacoes.publicar(estabelecimentoId);
    await this.orquestrador.programar(id, agora);
    return { id, retomada: true };
  }
}
