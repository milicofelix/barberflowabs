import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from 'src/db/prisma.service';
import { EquipePolicy } from 'src/equipe/equipe.policy';
import { AssociarMidiaDto, FINALIDADES_MIDIA, FinalidadeMidia } from './midia.dto';
import { MidiaStorageService } from './midia-storage.service';
import { CHAVES_FOTOS_PROFISSIONAIS_LEGADAS, imagemPadraoProfissional } from '@uniflowabs/core';

@Injectable()
export class MidiaService {
  constructor(private readonly prisma: PrismaService, private readonly equipe: EquipePolicy, private readonly storage: MidiaStorageService) {}

  private finalidade(valor: string): FinalidadeMidia {
    if (!FINALIDADES_MIDIA.includes(valor as FinalidadeMidia)) throw new BadRequestException('Finalidade de imagem inválida');
    return valor as FinalidadeMidia;
  }

  private superadmin(usuario: any) {
    if (!['SUPER_ADMIN', 'APP_OWNER'].includes(String(usuario?.papel ?? usuario?.role).toUpperCase())) throw new ForbiddenException('Apenas superadmin pode manter a galeria global');
  }

  async listarGlobal(usuario: any) {
    this.superadmin(usuario);
    const p = this.prisma as any;
    return {
      itens: await p.midia.findMany({ where: { escopo: 'GLOBAL', status: 'DISPONIVEL', OR: [{ chaveCatalogo: null }, { chaveCatalogo: { notIn: CHAVES_FOTOS_PROFISSIONAIS_LEGADAS } }] }, orderBy: { titulo: 'asc' }, take: 200 }),
      segmentos: await p.segmento.findMany({ where: { ativo: true }, select: { slug: true, nome: true }, orderBy: { nome: 'asc' } }),
      auditoria: await p.logAuditoria.findMany({ where: { entidade: 'MIDIA', acao: { in: ['UPLOAD_GLOBAL', 'CURADORIA'] } }, select: { id: true, usuarioId: true, acao: true, entidadeId: true, createdAt: true }, orderBy: { id: 'desc' }, take: 30 }),
    };
  }

  async atualizarGlobal(usuario: any, id: string, dados: any) {
    this.superadmin(usuario);
    if (!dados || typeof dados.titulo !== 'string' || !dados.titulo.trim() || dados.titulo.length > 120 || typeof dados.ativo !== 'boolean' || (dados.segmentoSlug !== null && typeof dados.segmentoSlug !== 'string')) throw new BadRequestException('Informe título, segmento e ativação válidos');
    return this.prisma.$transaction(async (transacao) => {
      const tx = transacao as any;
      await tx.$queryRawUnsafe('SELECT id FROM midias WHERE id = ? FOR UPDATE', id);
      const atual = await tx.midia.findFirst({ where: { id, escopo: 'GLOBAL', status: 'DISPONIVEL' } });
      if (!atual) throw new NotFoundException('Imagem global não encontrada');
      if (CHAVES_FOTOS_PROFISSIONAIS_LEGADAS.includes(atual.chaveCatalogo) && dados.ativo) throw new BadRequestException('Esta foto demonstrativa foi aposentada. Use uma silhueta ou envie uma foto.');
      if (dados.segmentoSlug && !await tx.segmento.findFirst({ where: { slug: dados.segmentoSlug, ativo: true } })) throw new BadRequestException('Segmento inválido');
      const novo = { titulo: dados.titulo.trim(), ativo: dados.ativo, segmentoSlug: dados.segmentoSlug || null };
      const resultado = await tx.midia.update({ where: { id }, data: novo });
      await tx.logAuditoria.create({ data: { usuarioId: usuario.id, acao: 'CURADORIA', entidade: 'MIDIA', entidadeId: id, detalhes: { ativoAnterior: atual.ativo, ativo: novo.ativo, finalidade: atual.finalidade, camposAlterados: Object.keys(novo).filter((campo) => atual[campo] !== novo[campo]) } } });
      return resultado;
    });
  }

  async listar(usuario: any, finalidade: string, segmentoSlug?: string) {
    if (!Number.isInteger(usuario?.id) || usuario.id <= 0) throw new ForbiddenException('Autenticação necessária');
    this.finalidade(finalidade);
    return (this.prisma as any).midia.findMany({
      where: { status: 'DISPONIVEL', ativo: true, finalidade, ...(segmentoSlug ? { OR: [{ segmentoSlug }, { segmentoSlug: null }] } : {}),
        AND: [{ OR: [{ escopo: 'GLOBAL' }, { escopo: 'USUARIO', usuarioId: usuario.id }, ...(usuario.estabelecimentoId ? [{ escopo: 'ESTABELECIMENTO', estabelecimentoId: usuario.estabelecimentoId }] : [])] },
          { OR: [{ chaveCatalogo: null }, { chaveCatalogo: { notIn: CHAVES_FOTOS_PROFISSIONAIS_LEGADAS } }] }] },
      select: { id: true, titulo: true, finalidade: true, segmentoSlug: true, versoes: true }, orderBy: { titulo: 'asc' }, take: 200,
    });
  }

  async upload(usuario: any, finalidade: string, arquivo: { buffer: Buffer }, global = false) {
    const uso = this.finalidade(finalidade);
    if (global) this.superadmin(usuario);
    else if (uso !== 'AVATAR') await this.equipe.validarPermissao(usuario, 'CONFIGURACOES_GERENCIAR');
    if (!arquivo?.buffer) throw new BadRequestException('Selecione uma imagem');
    const id = randomUUID();
    const versoes = await this.storage.processar(id, arquivo.buffer, uso);
    try {
      return await this.prisma.$transaction(async (transacao) => {
        const tx = transacao as any;
        const midia = await tx.midia.create({ data: { id, titulo: global ? 'Nova imagem global' : 'Foto enviada', finalidade: uso, escopo: global ? 'GLOBAL' : uso === 'AVATAR' ? 'USUARIO' : 'ESTABELECIMENTO', usuarioId: usuario.id, estabelecimentoId: global || uso === 'AVATAR' ? null : usuario.estabelecimentoId, versoes } });
        await tx.logAuditoria.create({ data: { usuarioId: usuario.id, estabelecimentoId: midia.estabelecimentoId, acao: global ? 'UPLOAD_GLOBAL' : 'UPLOAD', entidade: 'MIDIA', entidadeId: id, detalhes: { finalidade: uso } } });
        return { id, titulo: midia.titulo, finalidade: uso, segmentoSlug: null, versoes };
      });
    } catch (erro) { await this.storage.remover(id); throw erro; }
  }

  async associar(usuario: any, dados: AssociarMidiaDto) {
    const campos = { USUARIO: ['usuario', 'fotoURL', 'AVATAR'], SERVICO: ['servico', 'imagemURL', 'SERVICO'], PROFISSIONAL: ['profissional', 'imagemURL', 'PROFISSIONAL'], ESTABELECIMENTO: ['estabelecimento', 'imagemCapaURL', 'CAPA'] };
    const config = campos[dados?.entidade];
    if (!config) throw new BadRequestException('Destino de imagem inválido');
    const pessoal = dados.entidade === 'USUARIO';
    const id = pessoal ? usuario.id : Number(dados.entidadeId);
    if (!Number.isInteger(id) || id <= 0) throw new BadRequestException('Destino inválido');
    if (pessoal && dados.entidadeId !== undefined && Number(dados.entidadeId) !== usuario.id) throw new ForbiddenException('Você só pode alterar sua própria foto');
    if (!pessoal) await this.equipe.validarPermissao(usuario, 'CONFIGURACOES_GERENCIAR');
    if (dados.midiaId !== null && (typeof dados.midiaId !== 'string' || !/^[a-f0-9-]{36}$/.test(dados.midiaId))) throw new BadRequestException('Selecione uma imagem ou use o padrão');
    return this.prisma.$transaction(async (transacao) => {
      const tx = transacao as any;
      const where = pessoal ? { id } : dados.entidade === 'ESTABELECIMENTO' ? { id, AND: [{ id: usuario.estabelecimentoId }] } : { id, estabelecimentoId: usuario.estabelecimentoId };
      const registro = await tx[config[0]].findFirst({ where });
      if (!registro) throw new NotFoundException('Registro não encontrado na sua conta/unidade');
      let midia: any = null;
      if (dados.midiaId) {
        await tx.$queryRawUnsafe('SELECT id FROM midias WHERE id = ? FOR UPDATE', dados.midiaId);
        midia = await tx.midia.findUnique({ where: { id: dados.midiaId } });
        if (!midia || !midia.ativo || midia.status !== 'DISPONIVEL' || midia.finalidade !== config[2]) throw new BadRequestException('Imagem indisponível para esta finalidade');
        if (CHAVES_FOTOS_PROFISSIONAIS_LEGADAS.includes(midia.chaveCatalogo)) throw new BadRequestException('Esta foto demonstrativa foi aposentada. Use uma silhueta ou envie uma foto.');
        if (midia.escopo !== 'GLOBAL' && (pessoal ? midia.escopo !== 'USUARIO' || midia.usuarioId !== usuario.id : midia.escopo !== 'ESTABELECIMENTO' || midia.estabelecimentoId !== usuario.estabelecimentoId)) throw new ForbiddenException('Esta imagem pertence a outra conta/unidade');
      }
      const avatarProfissional = imagemPadraoProfissional(registro.sexo);
      const padrao = pessoal || dados.entidade === 'ESTABELECIMENTO' ? null : dados.entidade === 'SERVICO' ? '/servicos/combo.jpg' : avatarProfissional;
      const url = midia ? midia.versoes.principal.url : padrao;
      await tx[config[0]].update({ where: { id }, data: { [config[1]]: url } });
      await tx.midiaVinculo.deleteMany({ where: { entidade: dados.entidade, entidadeId: id } });
      if (midia) await tx.midiaVinculo.create({ data: { midiaId: midia.id, entidade: dados.entidade, entidadeId: id } });
      await tx.logAuditoria.create({ data: { usuarioId: usuario.id, estabelecimentoId: pessoal ? null : usuario.estabelecimentoId, acao: 'ASSOCIAR', entidade: 'MIDIA', entidadeId: midia?.id ?? null, detalhes: { destino: dados.entidade, destinoId: id, anterior: registro[config[1]] ?? null, novaURL: url } } });
      return { entidade: dados.entidade, entidadeId: id, midiaId: midia?.id ?? null, imagemURL: url };
    });
  }

  async arquivo(id: string, versao: string) {
    const midia = await (this.prisma as any).midia.findUnique({ where: { id } });
    if (!midia || midia.status !== 'DISPONIVEL') throw new NotFoundException('Imagem não encontrada');
    // Imagens desativadas continuam acessíveis para referências existentes.
    try { return await this.storage.ler(midia, versao); }
    catch (erro) { if (erro.code === 'ENOENT') throw new NotFoundException('Arquivo de imagem não encontrado'); throw erro; }
  }

  async limparOrfas(usuario: any, executar = false) {
    if (!['SUPER_ADMIN', 'APP_OWNER'].includes(usuario.papel)) throw new ForbiddenException('Apenas superadmin pode limpar mídias');
    const p = this.prisma as any;
    const limite = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const candidatas = await p.midia.findMany({ where: { escopo: { not: 'GLOBAL' }, status: { in: ['DISPONIVEL', 'EXCLUIDA'] }, createdAt: { lt: limite }, vinculos: { none: {} } }, select: { id: true }, take: 100 });
    const removidas: string[] = [];
    if (executar) for (const item of candidatas) {
      const marcada = await this.prisma.$transaction(async (transacao) => {
        const tx = transacao as any;
        await tx.$queryRawUnsafe('SELECT id FROM midias WHERE id = ? FOR UPDATE', item.id);
        const midia = await tx.midia.findFirst({ where: { id: item.id, escopo: { not: 'GLOBAL' }, createdAt: { lt: limite }, vinculos: { none: {} } } });
        if (!midia) return false;
        // Também preserva URLs gravadas por formulários legados, sem vínculo explícito.
        const url = midia.versoes?.principal?.url;
        if (await tx.usuario.count({ where: { fotoURL: url } }) || await tx.servico.count({ where: { imagemURL: url } }) || await tx.profissional.count({ where: { imagemURL: url } }) || await tx.estabelecimento.count({ where: { imagemCapaURL: url } }) || await tx.servicoSugerido.count({ where: { imagemURL: url } })) return false;
        await tx.midia.update({ where: { id: item.id }, data: { status: 'EXCLUIDA' } });
        await tx.logAuditoria.create({ data: { usuarioId: usuario.id, acao: 'LIMPAR_ORFA', entidade: 'MIDIA', entidadeId: item.id } });
        return true;
      });
      if (marcada) { await this.storage.remover(item.id); removidas.push(item.id); }
    }
    return { simulacao: !executar, candidatas: candidatas.length, removidas: removidas.length };
  }
}
