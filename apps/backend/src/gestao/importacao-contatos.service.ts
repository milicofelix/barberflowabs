import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { BcryptProvider } from 'src/auth/bcrypt.provider';
import { PrismaService } from 'src/db/prisma.service';
import { ConfirmarImportacaoContatosDto, ContatoImportacaoDto, SimularImportacaoContatosDto } from './gestao.dto';

const LIMITE_LOTE = 200;
type Resultado = 'NOVO' | 'JA_VINCULADO' | 'POSSIVEL_DUPLICADO' | 'INVALIDO' | 'CONFLITO';

interface ContatoNormalizado {
  referencia: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  fingerprint: string;
  invalido?: string;
}

@Injectable()
export class ImportacaoContatosService {
  constructor(private readonly prisma: PrismaService, private readonly cripto: BcryptProvider) {}

  async simular(estabelecimentoId: number, operadorId: number, dados: SimularImportacaoContatosDto) {
    this.validarLote(dados?.chaveIdempotencia, dados?.contatos);
    await this.validarOperador(estabelecimentoId, operadorId);
    const chaveIdempotencia = String(dados.chaveIdempotencia).trim();
    const contatos = this.normalizarContatos(dados.contatos);
    const existente = await (this.prisma as any).importacaoContatoLote.findUnique({
      where: { estabelecimentoId_chaveIdempotencia: { estabelecimentoId, chaveIdempotencia } },
      include: { itens: { orderBy: { id: 'asc' } } },
    });
    if (existente) {
      this.validarReutilizacao(existente, contatos);
      return this.respostaLote(existente);
    }

    const analisados = await this.analisar(estabelecimentoId, contatos);
    const totais = this.totalizar(analisados);
    try {
      const lote = await (this.prisma as any).importacaoContatoLote.create({
        data: {
          estabelecimentoId, operadorId, chaveIdempotencia,
          totalRecebidos: contatos.length, ...totais,
          itens: { create: analisados.map((item) => ({
            referencia: item.contato.referencia, fingerprint: item.contato.fingerprint,
            resultado: item.resultado, motivo: item.motivo ?? null, usuarioId: item.usuarioId ?? null,
          })) },
        },
        include: { itens: { orderBy: { id: 'asc' } } },
      });
      return this.respostaLote(lote);
    } catch (erro: any) {
      if (erro?.code !== 'P2002') throw erro;
      const concorrente = await (this.prisma as any).importacaoContatoLote.findUnique({
        where: { estabelecimentoId_chaveIdempotencia: { estabelecimentoId, chaveIdempotencia } },
        include: { itens: { orderBy: { id: 'asc' } } },
      });
      if (!concorrente) throw erro;
      this.validarReutilizacao(concorrente, contatos);
      return this.respostaLote(concorrente);
    }
  }

  async confirmar(estabelecimentoId: number, operadorId: number, loteId: string, dados: ConfirmarImportacaoContatosDto) {
    await this.validarOperador(estabelecimentoId, operadorId);
    const lote = await (this.prisma as any).importacaoContatoLote.findFirst({
      where: { id: loteId, estabelecimentoId }, include: { itens: true },
    });
    if (!lote) throw new NotFoundException('Lote de importação não encontrado');
    this.validarLote(lote.chaveIdempotencia, dados?.contatos);
    const contatos = this.normalizarContatos(dados.contatos);
    const fingerprints = new Map(lote.itens.map((item: any) => [item.referencia, item.fingerprint]));
    if (contatos.length !== fingerprints.size || contatos.some((item) => fingerprints.get(item.referencia) !== item.fingerprint)) {
      throw new ConflictException('Os contatos enviados são diferentes dos contatos simulados');
    }
    if (lote.status === 'CONFIRMADO') return this.respostaLote(lote);

    const analisados = await this.analisar(estabelecimentoId, contatos);
    if (!dados.confirmarCorrespondencias && analisados.some((item) => item.resultado === 'POSSIVEL_DUPLICADO')) {
      throw new ConflictException('Confirme as correspondências existentes antes de concluir a importação');
    }
    for (const item of analisados) {
      if (item.resultado === 'INVALIDO' || item.resultado === 'CONFLITO' || item.resultado === 'JA_VINCULADO') {
        await this.atualizarResultadoNaoImportado(loteId, item);
        continue;
      }
      if (item.resultado === 'POSSIVEL_DUPLICADO' && !dados.confirmarCorrespondencias) continue;
      const senha = item.resultado === 'NOVO' ? await this.cripto.criptografar(randomUUID()) : undefined;
      await this.processarContato(estabelecimentoId, loteId, item.contato, senha);
    }
    const importados = await (this.prisma as any).importacaoContatoItem.count({ where: { loteId, resultado: 'IMPORTADO' } });
    const atualizado = await (this.prisma as any).importacaoContatoLote.update({
      where: { id: loteId }, data: { status: 'CONFIRMADO', confirmadoEm: new Date(), totalImportados: importados, operadorId },
      include: { itens: { orderBy: { id: 'asc' } } },
    });
    return this.respostaLote(atualizado);
  }

  private async processarContato(estabelecimentoId: number, loteId: string, contato: ContatoNormalizado, senhaPreparada?: string) {
    return (this.prisma as any).$transaction(async (tx: any) => {
      const reservado = await tx.importacaoContatoItem.updateMany({
        where: { loteId, referencia: contato.referencia, resultado: { not: 'IMPORTADO' } },
        data: { resultado: 'PROCESSANDO', motivo: null },
      });
      if (!reservado.count) return;

      const [analisado] = await this.analisar(estabelecimentoId, [contato], tx);
      if (analisado.resultado === 'INVALIDO' || analisado.resultado === 'CONFLITO' || analisado.resultado === 'JA_VINCULADO') {
        await tx.importacaoContatoItem.update({
          where: { loteId_referencia: { loteId, referencia: contato.referencia } },
          data: { resultado: analisado.resultado, motivo: analisado.motivo ?? null, usuarioId: analisado.usuarioId ?? null },
        });
        return;
      }

      let usuarioId = analisado.usuarioId;
      if (!usuarioId) {
        const emailTecnico = !contato.email;
        const senha = senhaPreparada ?? await this.cripto.criptografar(randomUUID());
        const usuario = await tx.usuario.create({
          data: {
            nome: contato.nome,
            email: contato.email ?? `contato+${randomUUID()}@interno.uniflowabs.invalid`,
            emailContato: contato.email, emailTecnico,
            telefone: contato.telefone, telefoneNormalizado: contato.telefone,
            senha, membroEstabelecimento: false, papel: 'CUSTOMER',
          },
          select: { id: true },
        });
        usuarioId = usuario.id;
      }

      await tx.clienteEstabelecimento.upsert({
        where: { estabelecimentoId_usuarioId: { estabelecimentoId, usuarioId } }, update: {},
        create: { estabelecimentoId, usuarioId, origem: 'IMPORTACAO_CONTATOS', status: 'ATIVO', tags: ['IMPORTADO_CONTATOS'] },
      });
      for (const canal of ['PUSH', 'EMAIL', 'WHATSAPP']) {
        await tx.preferenciaComunicacao.upsert({
          where: { estabelecimentoId_usuarioId_canal: { estabelecimentoId, usuarioId, canal } },
          create: {
            estabelecimentoId, usuarioId, canal, consentido: false,
            origem: 'IMPORTACAO_CONTATOS', consentidoEm: null, revogadoEm: null,
          },
          update: {},
        });
      }
      await tx.importacaoContatoItem.update({
        where: { loteId_referencia: { loteId, referencia: contato.referencia } },
        data: { usuarioId, resultado: 'IMPORTADO', motivo: null },
      });
    });
  }

  private atualizarResultadoNaoImportado(
    loteId: string,
    item: { contato: ContatoNormalizado; resultado: Resultado; motivo?: string; usuarioId?: number },
  ) {
    return (this.prisma as any).importacaoContatoItem.updateMany({
      where: { loteId, referencia: item.contato.referencia, resultado: { not: 'IMPORTADO' } },
      data: { resultado: item.resultado, motivo: item.motivo ?? null, usuarioId: item.usuarioId ?? null },
    });
  }

  private async analisar(estabelecimentoId: number, contatos: ContatoNormalizado[], db: any = this.prisma) {
    const vistos = new Set<string>();
    const resultados: Array<{ contato: ContatoNormalizado; resultado: Resultado; motivo?: string; usuarioId?: number }> = [];
    for (const contato of contatos) {
      if (contato.invalido) { resultados.push({ contato, resultado: 'INVALIDO', motivo: contato.invalido }); continue; }
      const chaves = [contato.email ? `e:${contato.email}` : null, contato.telefone ? `t:${contato.telefone}` : null].filter(Boolean) as string[];
      if (chaves.some((chave) => vistos.has(chave))) { resultados.push({ contato, resultado: 'CONFLITO', motivo: 'Contato repetido no lote' }); continue; }
      chaves.forEach((chave) => vistos.add(chave));
      const candidatos = await db.usuario.findMany({
        where: { OR: [
          ...(contato.email ? [{ email: contato.email }, { emailContato: contato.email }] : []),
          ...(contato.telefone ? [{ telefoneNormalizado: contato.telefone }, { telefone: contato.telefone }] : []),
        ] }, select: { id: true }, take: 2,
      });
      if (candidatos.length > 1) { resultados.push({ contato, resultado: 'CONFLITO', motivo: 'Mais de uma correspondência encontrada' }); continue; }
      const usuarioId = candidatos[0]?.id;
      if (!usuarioId) { resultados.push({ contato, resultado: 'NOVO' }); continue; }
      const vinculo = await db.clienteEstabelecimento.findUnique({
        where: { estabelecimentoId_usuarioId: { estabelecimentoId, usuarioId } }, select: { id: true },
      });
      resultados.push({ contato, resultado: vinculo ? 'JA_VINCULADO' : 'POSSIVEL_DUPLICADO', usuarioId });
    }
    return resultados;
  }

  private normalizarContatos(contatos: ContatoImportacaoDto[]) {
    return contatos.map((item, indice): ContatoNormalizado => {
      const referencia = String(item?.referencia || indice + 1).trim().slice(0, 190);
      const nome = String(item?.nome ?? '').trim().replace(/\s+/g, ' ').slice(0, 190);
      const email = String(item?.email ?? '').trim().toLowerCase() || null;
      const telefone = this.normalizarTelefone(item?.telefone);
      let invalido: string | undefined;
      if (!nome || /^\d+$/.test(nome.replace(/\D/g, ''))) invalido = 'Nome inválido';
      else if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) invalido = 'E-mail inválido';
      else if (!email && !telefone) invalido = 'Informe telefone ou e-mail';
      const fingerprint = createHash('sha256').update(`${nome}|${telefone ?? ''}|${email ?? ''}`).digest('hex');
      return { referencia, nome, email, telefone, fingerprint, invalido };
    });
  }

  private normalizarTelefone(valor?: string) {
    let digitos = String(valor ?? '').replace(/\D/g, '');
    if (!digitos) return null;
    if (digitos.startsWith('00')) digitos = digitos.slice(2);
    if ((digitos.length === 10 || digitos.length === 11) && !digitos.startsWith('55')) digitos = `55${digitos}`;
    return digitos.length >= 10 && digitos.length <= 15 ? `+${digitos}` : null;
  }

  private validarLote(chave: string, contatos: ContatoImportacaoDto[]) {
    if (!String(chave ?? '').trim()) throw new BadRequestException('Chave de idempotência é obrigatória');
    if (String(chave).trim().length > 191) throw new BadRequestException('Chave de idempotência excede 191 caracteres');
    if (!Array.isArray(contatos) || !contatos.length) throw new BadRequestException('Selecione ao menos um contato');
    if (contatos.length > LIMITE_LOTE) throw new BadRequestException(`Cada lote aceita no máximo ${LIMITE_LOTE} contatos`);
    const referencias = contatos.map((item, indice) => String(item?.referencia || indice + 1).trim());
    if (referencias.some((referencia) => !referencia || referencia.length > 190) || new Set(referencias).size !== referencias.length) {
      throw new BadRequestException('Cada contato deve possuir uma referência única de até 190 caracteres');
    }
  }

  private validarReutilizacao(lote: any, contatos: ContatoNormalizado[]) {
    const fingerprints = new Map((lote.itens ?? []).map((item: any) => [item.referencia, item.fingerprint]));
    const corresponde = contatos.length === fingerprints.size
      && contatos.every((item) => fingerprints.get(item.referencia) === item.fingerprint);
    if (!corresponde) throw new ConflictException('A chave de idempotência já foi usada por outro conjunto de contatos');
  }

  private async validarOperador(estabelecimentoId: number, operadorId: number) {
    const operador = await (this.prisma as any).usuario.findFirst({
      where: { id: operadorId, estabelecimentoId }, select: { id: true },
    });
    if (!operador) throw new ForbiddenException('Operador não pertence ao estabelecimento ativo');
  }

  private totalizar(itens: Array<{ resultado: Resultado }>) {
    return {
      totalNovos: itens.filter((item) => item.resultado === 'NOVO').length,
      totalExistentes: itens.filter((item) => ['JA_VINCULADO', 'POSSIVEL_DUPLICADO'].includes(item.resultado)).length,
      totalInvalidos: itens.filter((item) => item.resultado === 'INVALIDO').length,
      totalConflitos: itens.filter((item) => item.resultado === 'CONFLITO').length,
    };
  }

  private respostaLote(lote: any) {
    return {
      loteId: lote.id, status: lote.status,
      totais: { recebidos: lote.totalRecebidos, novos: lote.totalNovos, existentes: lote.totalExistentes, invalidos: lote.totalInvalidos, conflitos: lote.totalConflitos, importados: lote.totalImportados },
      itens: lote.itens?.map((item: any) => ({
        referencia: item.referencia,
        resultado: item.resultado,
        motivo: item.motivo,
        ...(['IMPORTADO', 'JA_VINCULADO'].includes(item.resultado) && item.usuarioId ? { clienteId: item.usuarioId } : {}),
      })) ?? [],
      confirmadoEm: lote.confirmadoEm,
    };
  }
}
