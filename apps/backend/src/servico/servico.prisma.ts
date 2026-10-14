import { RepositorioServico, Servico } from '@uniflowabs/core';
import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { DEFAULT_ESTABELECIMENTO_ID } from 'src/shared/tenant';
import { CriarServicoDto, ImportarServicosSugeridosDto } from './servico.dto';

@Injectable()
export class ServicoPrisma implements RepositorioServico {
  constructor(private readonly prisma: PrismaService) {}

  async buscarTodos(estabelecimentoId = DEFAULT_ESTABELECIMENTO_ID): Promise<Servico[]> {
    const servicos = await this.prisma.servico.findMany({
      where: { estabelecimentoId },
      include: { profissionaisHabilitados: { where: { ativo: true }, select: { profissionalId: true } } },
    });
    return servicos.map((servico) => this.normalizar(servico));
  }

  async criar(estabelecimentoId: number, dados: CriarServicoDto): Promise<Servico> {
    const { profissionalIds, ...dadosServico } = dados;
    await this.validarProfissionais(estabelecimentoId, profissionalIds);
    const servico = await this.prisma.servico.create({
      data: {
        ...dadosServico,
        estabelecimentoId,
        profissionaisHabilitados: profissionalIds?.length ? {
          create: profissionalIds.map((profissionalId) => ({ estabelecimentoId, profissionalId, ativo: true })),
        } : undefined,
      } as any,
      include: { profissionaisHabilitados: { where: { ativo: true }, select: { profissionalId: true } } },
    });

    return this.normalizar(servico);
  }

  async atualizar(id: number, estabelecimentoId: number, dados: CriarServicoDto): Promise<Servico> {
    const { profissionalIds, ...dadosServico } = dados;
    await this.validarProfissionais(estabelecimentoId, profissionalIds);
    const servico = await this.prisma.$transaction(async (tx) => {
      if (profissionalIds !== undefined) {
        await (tx as any).profissionalServico.deleteMany({ where: { estabelecimentoId, servicoId: id } });
      }
      return (tx as any).servico.update({
        where: { id, estabelecimentoId },
        data: {
          ...dadosServico,
          profissionaisHabilitados: profissionalIds?.length ? {
            create: profissionalIds.map((profissionalId) => ({ estabelecimentoId, profissionalId, ativo: true })),
          } : undefined,
        },
        include: { profissionaisHabilitados: { where: { ativo: true }, select: { profissionalId: true } } },
      });
    });

    return this.normalizar(servico);
  }

  async excluir(id: number, estabelecimentoId: number): Promise<void> {
    await this.prisma.servico.delete({
      where: { id, estabelecimentoId },
    });
  }

  async contarSugeridosNovos(estabelecimentoId: number, ids: number[]) {
    const estabelecimento = await (this.prisma as any).estabelecimento.findUnique({
      where: { id: estabelecimentoId }, select: { segmentos: { select: { segmentoId: true } } },
    });
    const segmentoIds = estabelecimento?.segmentos.map((item: any) => item.segmentoId) ?? [];
    const [sugestoes, existentes] = await Promise.all([
      (this.prisma as any).servicoSugerido.findMany({
        where: { id: { in: ids }, segmentoId: { in: segmentoIds }, ativo: true }, select: { id: true, nome: true },
      }),
      (this.prisma as any).servico.findMany({ where: { estabelecimentoId }, select: { nome: true, servicoSugeridoId: true } }),
    ]);
    const importados = new Set(existentes.map((item: any) => item.servicoSugeridoId).filter(Boolean));
    const nomes = new Set(existentes.map((item: any) => item.nome.toLocaleLowerCase('pt-BR')));
    return sugestoes.filter((item: any) => !importados.has(item.id) && !nomes.has(item.nome.toLocaleLowerCase('pt-BR'))).length;
  }

  async importarSugeridos(estabelecimentoId: number, dados: ImportarServicosSugeridosDto) {
    return this.prisma.$transaction(async (transacao) => {
      const tx = transacao as any;
      await tx.$queryRawUnsafe('SELECT id FROM estabelecimentos WHERE id = ? FOR UPDATE', estabelecimentoId);
      const estabelecimento = await tx.estabelecimento.findUnique({
        where: { id: estabelecimentoId },
        select: {
          modeloAtendimento: true,
          segmentos: { select: { segmentoId: true } },
          especialidades: { select: { especialidadeId: true } },
          assinatura: { select: { plano: { select: { limiteServicos: true } } } },
          _count: { select: { servicos: true } },
        },
      });
      const segmentoIds = estabelecimento?.segmentos.map((item: any) => item.segmentoId) ?? [];
      const especialidadeIds = new Set(estabelecimento?.especialidades.map((item: any) => item.especialidadeId) ?? []);
      const ids = [...new Set(dados.itens.map((item) => Number(item.servicoSugeridoId)))];
      const [sugestoes, existentes] = await Promise.all([
        tx.servicoSugerido.findMany({
          where: { id: { in: ids }, segmentoId: { in: segmentoIds }, ativo: true },
          include: { especialidades: true },
        }),
        tx.servico.findMany({
          where: { estabelecimentoId, OR: [{ servicoSugeridoId: { in: ids } }] },
          select: { id: true, nome: true, servicoSugeridoId: true },
        }),
      ]);
      const sugestaoPorId = new Map(sugestoes.map((item: any) => [item.id, item]));
      const importados = new Map(existentes.map((item: any) => [item.servicoSugeridoId, item]));
      const nomesExistentes = new Set((await tx.servico.findMany({ where: { estabelecimentoId }, select: { nome: true } })).map((item: any) => item.nome.toLocaleLowerCase('pt-BR')));
      const candidatos = dados.itens.filter((item) => {
        const sugestao: any = sugestaoPorId.get(Number(item.servicoSugeridoId));
        return sugestao && !importados.has(sugestao.id) && !nomesExistentes.has(sugestao.nome.toLocaleLowerCase('pt-BR'));
      });
      const limite = estabelecimento?.assinatura?.plano?.limiteServicos;
      if (limite && estabelecimento._count.servicos + candidatos.length > limite) {
        throw new ForbiddenException(`O plano permite adicionar somente mais ${Math.max(0, limite - estabelecimento._count.servicos)} serviço(s)`);
      }
      const criados: any[] = [];
      const ignorados: any[] = [];

      for (const item of dados.itens) {
        const sugestao: any = sugestaoPorId.get(Number(item.servicoSugeridoId));
        if (!sugestao) { ignorados.push({ servicoSugeridoId: item.servicoSugeridoId, motivo: 'Sugestão incompatível com o estabelecimento' }); continue; }
        if (importados.has(sugestao.id)) { ignorados.push({ servicoSugeridoId: sugestao.id, nome: sugestao.nome, motivo: 'Serviço já adicionado' }); continue; }
        if (nomesExistentes.has(sugestao.nome.toLocaleLowerCase('pt-BR'))) { ignorados.push({ servicoSugeridoId: sugestao.id, nome: sugestao.nome, motivo: 'Já existe um serviço com este nome' }); continue; }
        await this.validarProfissionaisComCliente(tx, estabelecimentoId, item.profissionalIds);
        const duracao = Number(item.duracaoMinutos ?? sugestao.duracaoMinutos);
        const modalidade = item.modeloAtendimento ?? sugestao.modeloAtendimento;
        if (estabelecimento.modeloAtendimento !== 'HIBRIDO' && modalidade !== estabelecimento.modeloAtendimento) {
          throw new BadRequestException(`O serviço ${sugestao.nome} não é compatível com a modalidade do estabelecimento`);
        }
        const especialidadesCompativeis = sugestao.especialidades.filter((relacao: any) => especialidadeIds.has(relacao.especialidadeId));
        const criado = await tx.servico.create({
          data: {
            estabelecimentoId, servicoSugeridoId: sugestao.id, nome: sugestao.nome,
            descricao: sugestao.descricao, imagemURL: sugestao.imagemURL, preco: Number(item.preco),
            duracaoMinutos: duracao, qtdeSlots: Math.ceil(duracao / 15),
            modeloAtendimento: modalidade,
            preparoAntesMinutos: Number(item.preparoAntesMinutos ?? sugestao.preparoAntesMinutos),
            preparoDepoisMinutos: Number(item.preparoDepoisMinutos ?? sugestao.preparoDepoisMinutos),
            deslocamentoMinutos: Number(item.deslocamentoMinutos ?? sugestao.deslocamentoMinutos),
            especialidades: especialidadesCompativeis.length ? { create: especialidadesCompativeis.map((relacao: any) => ({ estabelecimentoId, especialidadeId: relacao.especialidadeId })) } : undefined,
            profissionaisHabilitados: item.profissionalIds?.length ? { create: [...new Set(item.profissionalIds.map(Number))].map((profissionalId) => ({ estabelecimentoId, profissionalId, ativo: true })) } : undefined,
          },
          include: { profissionaisHabilitados: { where: { ativo: true }, select: { profissionalId: true } } },
        });
        nomesExistentes.add(sugestao.nome.toLocaleLowerCase('pt-BR'));
        criados.push(this.normalizar(criado));
      }
      return { criados, ignorados };
    });
  }

  private normalizar(servico: any): Servico {
    return {
      ...servico,
      preco: Number(servico.preco),
      modeloAtendimento: servico.modeloAtendimento as Servico['modeloAtendimento'],
      profissionalIds: servico.profissionaisHabilitados?.map((item: any) => item.profissionalId) ?? [],
    };
  }

  private async validarProfissionais(estabelecimentoId: number, profissionalIds?: number[]) {
    if (profissionalIds === undefined) return;
    const ids = [...new Set(profissionalIds.map(Number))];
    const total = await this.prisma.profissional.count({ where: { estabelecimentoId, id: { in: ids } } });
    if (total !== ids.length) throw new BadRequestException('Um ou mais profissionais não pertencem ao estabelecimento');
  }

  private async validarProfissionaisComCliente(cliente: any, estabelecimentoId: number, profissionalIds?: number[]) {
    if (profissionalIds === undefined) return;
    const ids = [...new Set(profissionalIds.map(Number))];
    const total = await cliente.profissional.count({ where: { estabelecimentoId, id: { in: ids } } });
    if (total !== ids.length) throw new BadRequestException('Um ou mais profissionais não pertencem ao estabelecimento');
  }
}
