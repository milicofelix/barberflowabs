import { BadRequestException, Body, Controller, ForbiddenException, Get, NotFoundException, Param, Post, Put } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { UsuarioLogado } from 'src/shared/usuario.decorator';

@Controller('catalogo/admin')
export class CatalogoAdminController {
  constructor(private readonly prisma: PrismaService) {}

  private autorizar(usuario: any) {
    if (!['SUPER_ADMIN', 'APP_OWNER'].includes(String(usuario?.papel ?? usuario?.role).toUpperCase())) {
      throw new ForbiddenException('Apenas superadministradores podem manter o catálogo global');
    }
  }

  @Get()
  async listar(@UsuarioLogado() usuario: any) {
    this.autorizar(usuario);
    const p = this.prisma as any;
    const [itens, segmentos, requisitos, adocoes, auditoria] = await Promise.all([
      p.servicoSugerido.findMany({ orderBy: [{ segmentoId: 'asc' }, { ordem: 'asc' }, { nome: 'asc' }], include: { especialidades: true } }),
      p.segmento.findMany({ include: { especialidades: true }, orderBy: { nome: 'asc' } }),
      p.requisito.findMany({ where: { ativo: true }, orderBy: { nome: 'asc' } }),
      p.servico.groupBy({ by: ['servicoSugeridoId'], where: { servicoSugeridoId: { not: null } }, _count: { id: true } }),
      p.logAuditoria.findMany({ where: { entidade: 'SERVICO_SUGERIDO' }, orderBy: { id: 'desc' }, take: 50 }),
    ]);
    const contagens = new Map(adocoes.map((item: any) => [item.servicoSugeridoId, item._count.id]));
    return { itens: itens.map((item: any) => ({ ...item, adocoes: contagens.get(item.id) ?? 0 })), segmentos, requisitos, auditoria };
  }

  @Post()
  criar(@Body() dados: any, @UsuarioLogado() usuario: any) { return this.salvar(usuario, dados); }

  @Put(':id')
  atualizar(@Param('id') id: string, @Body() dados: any, @UsuarioLogado() usuario: any) {
    if (!Number.isInteger(Number(id)) || Number(id) <= 0) throw new BadRequestException('Identificador inválido');
    return this.salvar(usuario, dados, Number(id));
  }

  private async salvar(usuario: any, dados: any, id?: number) {
    this.autorizar(usuario);
    if (!dados || typeof dados !== 'object') throw new BadRequestException('Dados obrigatórios');
    for (const campo of ['nome', 'slug', 'descricao', 'imagemURL']) {
      if (typeof dados[campo] !== 'string' || !dados[campo].trim() || dados[campo].length > (campo === 'descricao' ? 5000 : 191)) throw new BadRequestException(`${campo} inválido`);
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(dados.slug)) throw new BadRequestException('Identificador deve usar letras minúsculas, números e hífens');
    if (!(dados.imagemURL.startsWith('/') && !dados.imagemURL.startsWith('//')) && !/^https:\/\//.test(dados.imagemURL)) throw new BadRequestException('Use um caminho de imagem ou uma URL HTTPS');
    for (const campo of ['segmentoId', 'duracaoMinutos', 'preparoAntesMinutos', 'preparoDepoisMinutos', 'deslocamentoMinutos', 'ordem']) {
      if (!Number.isInteger(dados[campo]) || dados[campo] < (['segmentoId', 'duracaoMinutos'].includes(campo) ? 1 : 0)) throw new BadRequestException(`${campo} inválido`);
    }
    if (typeof dados.ativo !== 'boolean' || !['PRESENCIAL', 'DOMICILIAR', 'HIBRIDO'].includes(dados.modeloAtendimento)) throw new BadRequestException('Ativação ou modalidade inválida');
    if (!Array.isArray(dados.especialidadeIds) || !dados.especialidadeIds.length || dados.especialidadeIds.some((valor: any) => !Number.isInteger(valor) || valor <= 0)) throw new BadRequestException('Selecione especialidades válidas');
    const requisitos = dados.requisitosOperacionais ?? [];
    const recursos = dados.recursosNecessarios ?? [];
    if (!Array.isArray(requisitos) || requisitos.some((r: any) => !r || !Number.isInteger(r.requisitoId) || r.requisitoId <= 0 || typeof r.obrigatorio !== 'boolean')) throw new BadRequestException('Requisitos inválidos');
    if (!Array.isArray(recursos) || recursos.some((r: any) => !r || typeof r.tipoRecurso !== 'string' || !/^[A-Z][A-Z0-9_]{0,49}$/.test(r.tipoRecurso) || !Number.isInteger(r.quantidade) || r.quantidade < 1)) throw new BadRequestException('Recursos inválidos');
    const especialidadeIds = [...new Set<number>(dados.especialidadeIds)];
    if (new Set(requisitos.map((r: any) => r.requisitoId)).size !== requisitos.length || new Set(recursos.map((r: any) => r.tipoRecurso)).size !== recursos.length) throw new BadRequestException('Requisitos ou recursos repetidos');
    return this.prisma.$transaction(async (transacao) => {
      const tx = transacao as any;
      if (id) await tx.$queryRawUnsafe('SELECT id FROM servicos_sugeridos WHERE id = ? FOR UPDATE', id);
      const segmento = await tx.segmento.findUnique({ where: { id: dados.segmentoId } });
      if (!segmento) throw new BadRequestException('Segmento inexistente');
      if (await tx.especialidade.count({ where: { id: { in: especialidadeIds }, segmentoId: dados.segmentoId, ativo: true } }) !== especialidadeIds.length) throw new BadRequestException('Especialidades incompatíveis com o segmento');
      if (await tx.requisito.count({ where: { id: { in: requisitos.map((r: any) => r.requisitoId) }, ativo: true } }) !== requisitos.length) throw new BadRequestException('Requisitos indisponíveis');
      const anterior = id ? await tx.servicoSugerido.findUnique({ where: { id }, include: { especialidades: true } }) : null;
      if (id && !anterior) throw new NotFoundException('Sugestão não encontrada');
      let midia: any = null;
      const referenciaNaURL = dados.imagemURL.match(/^\/midias\/arquivos\/([a-f0-9-]{36})\/principal$/)?.[1];
      const referencia = dados.midiaId ?? (anterior?.imagemURL !== dados.imagemURL ? referenciaNaURL : undefined);
      if (dados.imagemURL.startsWith('/midias/') && !referenciaNaURL) throw new BadRequestException('URL de mídia inválida');
      if (referencia) {
        if (typeof referencia !== 'string') throw new BadRequestException('Imagem inválida');
        await tx.$queryRawUnsafe('SELECT id FROM midias WHERE id = ? FOR UPDATE', referencia);
        midia = await tx.midia.findFirst({ where: { id: referencia, escopo: 'GLOBAL', finalidade: 'SERVICO', ativo: true, status: 'DISPONIVEL' } });
        if (!midia) throw new BadRequestException('Selecione uma imagem global ativa de serviço');
      }
      const duplicado = await tx.servicoSugerido.findFirst({ where: { segmentoId: dados.segmentoId, slug: dados.slug, ...(id ? { id: { not: id } } : {}) } });
      if (duplicado) throw new BadRequestException('Já existe uma sugestão com esse identificador no segmento');
      const data = {
        nome: dados.nome.trim(), slug: dados.slug, descricao: dados.descricao.trim(), imagemURL: midia ? midia.versoes.principal.url : dados.imagemURL.trim(),
        segmentoId: dados.segmentoId, ativo: dados.ativo, ordem: dados.ordem, modeloAtendimento: dados.modeloAtendimento,
        duracaoMinutos: dados.duracaoMinutos, preparoAntesMinutos: dados.preparoAntesMinutos,
        preparoDepoisMinutos: dados.preparoDepoisMinutos, deslocamentoMinutos: dados.deslocamentoMinutos,
        requisitosOperacionais: requisitos.map((r: any) => ({ requisitoId: r.requisitoId, obrigatorio: r.obrigatorio })),
        recursosNecessarios: recursos.map((r: any) => ({ tipoRecurso: r.tipoRecurso, quantidade: r.quantidade })),
      };
      if (id) await tx.servicoSugeridoEspecialidade.deleteMany({ where: { servicoSugeridoId: id } });
      const relacoes = { create: especialidadeIds.map((especialidadeId) => ({ especialidadeId })) };
      const item = id ? await tx.servicoSugerido.update({ where: { id }, data: { ...data, especialidades: relacoes } })
        : await tx.servicoSugerido.create({ data: { ...data, especialidades: relacoes } });
      if (midia || dados.midiaId !== undefined || (id && anterior?.imagemURL?.startsWith('/midias/') && anterior.imagemURL !== item.imagemURL)) {
        await tx.midiaVinculo.deleteMany({ where: { entidade: 'SERVICO_SUGERIDO', entidadeId: item.id } });
        if (midia) await tx.midiaVinculo.create({ data: { midiaId: midia.id, entidade: 'SERVICO_SUGERIDO', entidadeId: item.id } });
      }
      await tx.logAuditoria.create({ data: { usuarioId: usuario.id, acao: id ? 'ATUALIZAR' : 'CRIAR', entidade: 'SERVICO_SUGERIDO', entidadeId: String(item.id), detalhes: { anterior: anterior ? JSON.parse(JSON.stringify(anterior)) : null, novo: { ...data, especialidadeIds } } } });
      return item;
    });
  }
}
