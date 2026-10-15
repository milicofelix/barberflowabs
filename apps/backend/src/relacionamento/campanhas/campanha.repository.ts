import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { AudienciaCampanhaRepository } from './audiencia-campanha.repository';
import { paginacaoCampanha, SalvarCampanhaDto, validarCampanha } from './campanha.dto';

@Injectable()
export class CampanhaRepository {
  constructor(private readonly prisma: PrismaService, private readonly audiencias: AudienciaCampanhaRepository) {}
  private get db(): any { return this.prisma; }
  async obter(id: number, estabelecimentoId: number) {
    const campanha = await this.db.campanhaComunicacao.findFirst({ where: { id, estabelecimentoId }, include: { _count: { select: { destinatarios: true } } } });
    if (!campanha) throw new NotFoundException('Campanha não encontrada nesta unidade');
    const [audiencia, envios] = await Promise.all([
      this.db.campanhaDestinatario.groupBy({ by: ['status'], where: { campanhaId: id }, _count: { _all: true } }),
      this.db.envioComunicacao.groupBy({ by: ['status'], where: { campanhaId: id, estabelecimentoId }, _count: { _all: true } }),
    ]);
    return { ...campanha, resumo: { audiencia, envios } };
  }
  async listar(estabelecimentoId: number, pagina?: string, limite?: string) {
    const paginacao = paginacaoCampanha(pagina, limite);
    const where = { estabelecimentoId };
    const [itens, total] = await Promise.all([
      this.db.campanhaComunicacao.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip: (paginacao.pagina - 1) * paginacao.limite, take: paginacao.limite, include: { _count: { select: { destinatarios: true } } } }),
      this.db.campanhaComunicacao.count({ where }),
    ]);
    return { itens, total, ...paginacao };
  }
  async salvar(estabelecimentoId: number, usuarioId: number, dados: SalvarCampanhaDto, id?: number) {
    const data = validarCampanha(dados);
    return this.db.$transaction(async (tx: any) => {
      await this.validarReferencias(tx, estabelecimentoId, data);
      if (id) {
        await tx.$queryRaw`SELECT id FROM campanhas_comunicacao WHERE id = ${id} AND estabelecimentoId = ${estabelecimentoId} FOR UPDATE`;
        const atual = await tx.campanhaComunicacao.findFirst({ where: { id, estabelecimentoId } });
        if (!atual) throw new NotFoundException('Campanha não encontrada');
        if (atual.status !== 'RASCUNHO' || atual.audienciaCongeladaEm) throw new ConflictException('Campanha congelada não pode ser editada; crie outro rascunho');
      }
      const campanha = id ? await tx.campanhaComunicacao.update({ where: { id }, data }) : await tx.campanhaComunicacao.create({ data: { estabelecimentoId, ...data } });
      await this.auditar(tx, estabelecimentoId, usuarioId, campanha.id, id ? 'CAMPANHA_EDITADA' : 'CAMPANHA_CRIADA');
      return campanha;
    });
  }
  async congelar(id: number, estabelecimentoId: number, usuarioId: number, agora = new Date()) {
    return this.db.$transaction(async (tx: any) => {
      await tx.$queryRaw`SELECT id FROM campanhas_comunicacao WHERE id = ${id} AND estabelecimentoId = ${estabelecimentoId} FOR UPDATE`;
      const campanha = await tx.campanhaComunicacao.findFirst({ where: { id, estabelecimentoId } });
      if (!campanha) throw new NotFoundException('Campanha não encontrada');
      if (campanha.audienciaCongeladaEm) return { id, congelada: true, total: await tx.campanhaDestinatario.count({ where: { campanhaId: id } }) };
      if (campanha.status !== 'RASCUNHO') throw new ConflictException('Apenas rascunho pode congelar audiência');
      const template = await this.validarReferencias(tx, estabelecimentoId, campanha);
      const variaveis = `${template.assunto ?? ''} ${template.conteudo}`.matchAll(/{{\s*([\w.-]+)\s*}}/g);
      for (const item of variaveis) if (!['nome', 'estabelecimento', 'descadastroUrl'].includes(item[1])) throw new ConflictException('Template de campanha aceita somente nome, estabelecimento e descadastroUrl');
      const audiencia = await this.audiencias.selecionar(tx, estabelecimentoId, campanha.filtros, agora);
      if (!audiencia.length) throw new ConflictException('Nenhum cliente corresponde aos filtros');
      await tx.campanhaDestinatario.createMany({ data: audiencia.map((item) => ({ ...item, campanhaId: id })), skipDuplicates: true });
      await tx.campanhaComunicacao.update({ where: { id }, data: { audienciaCongeladaEm: agora, templateSnapshot: { canal: template.canal, assunto: template.assunto, conteudo: template.conteudo } } });
      await this.auditar(tx, estabelecimentoId, usuarioId, id, 'CAMPANHA_AUDIENCIA_CONGELADA', { total: audiencia.length, filtros: campanha.filtros });
      return { id, congelada: true, total: audiencia.length };
    }, { timeout: 60000 });
  }
  async transicionar(id: number, estabelecimentoId: number, usuarioId: number, acao: 'agendar' | 'pausar' | 'retomar', agendadoPara?: string) {
    if (agendadoPara !== undefined && (typeof agendadoPara !== 'string' || !/T.*(?:Z|[+-]\d{2}:\d{2})$/.test(agendadoPara))) throw new ConflictException('Informe data ISO com fuso explícito, por exemplo 2026-10-20T14:00:00-03:00');
    const data = agendadoPara === undefined ? new Date() : new Date(agendadoPara);
    if (Number.isNaN(data.getTime()) || (agendadoPara && data.getTime() < Date.now() - 60000)) throw new ConflictException('Data de agendamento inválida ou passada');
    return this.db.$transaction(async (tx: any) => {
      await tx.$queryRaw`SELECT id FROM campanhas_comunicacao WHERE id = ${id} AND estabelecimentoId = ${estabelecimentoId} FOR UPDATE`;
      const atual = await tx.campanhaComunicacao.findFirst({ where: { id, estabelecimentoId } });
      if (!atual) throw new NotFoundException('Campanha não encontrada');
      const permitido = acao === 'agendar' ? atual.status === 'RASCUNHO' && atual.audienciaCongeladaEm : acao === 'pausar' ? ['AGENDADA', 'EM_EXECUCAO'].includes(atual.status) : atual.status === 'PAUSADA';
      if (!permitido) throw new ConflictException('Ação incompatível com o estado da campanha; agendar exige audiência congelada');
      const proximo = acao === 'pausar' ? 'PAUSADA' : 'AGENDADA';
      const resultado = await tx.campanhaComunicacao.update({ where: { id }, data: { status: proximo, ...(acao !== 'pausar' ? { agendadoPara: data } : {}) } });
      await this.auditar(tx, estabelecimentoId, usuarioId, id, `CAMPANHA_${acao.toUpperCase()}`, { status: proximo, agendadoPara: resultado.agendadoPara?.toISOString() ?? null });
      return resultado;
    });
  }
  async audiencia(id: number, estabelecimentoId: number, pagina?: string, limite?: string) {
    await this.obter(id, estabelecimentoId);
    const p = paginacaoCampanha(pagina, limite);
    const [itens, total] = await Promise.all([
      this.db.campanhaDestinatario.findMany({ where: { campanhaId: id }, orderBy: { id: 'asc' }, skip: (p.pagina - 1) * p.limite, take: p.limite, include: { envio: { select: { status: true, enviadoEm: true } } } }),
      this.db.campanhaDestinatario.count({ where: { campanhaId: id } }),
    ]);
    return { itens, total, ...p };
  }
  private async validarReferencias(tx: any, estabelecimentoId: number, dados: any) {
    const template = await tx.templateComunicacao.findFirst({ where: { id: dados.templateId, estabelecimentoId, ativo: true, evento: 'CAMPANHA' } });
    if (!template) throw new NotFoundException('Template de campanha ativo não encontrado nesta unidade');
    for (const [chave, modelo] of [['unidadeId', 'unidade'], ['servicoId', 'servico'], ['profissionalId', 'profissional']]) {
      if (dados.filtros[chave] && !await tx[modelo].findFirst({ where: { id: dados.filtros[chave], estabelecimentoId }, select: { id: true } })) throw new NotFoundException('Filtro pertence a outra unidade ou não existe');
    }
    return template;
  }
  private auditar(tx: any, estabelecimentoId: number, usuarioId: number, id: number, acao: string, detalhes: any = {}) {
    return tx.logAuditoria.create({ data: { estabelecimentoId, usuarioId, acao, entidade: 'CampanhaComunicacao', entidadeId: String(id), detalhes } });
  }
}
