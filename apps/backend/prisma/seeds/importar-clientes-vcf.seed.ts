import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHash, randomUUID } from 'crypto';
import { readFile } from 'fs/promises';

const prisma = new PrismaClient();
const VCF_PATH = process.env.VCF_PATH ?? 'prisma/data/contacts.vcf';
const ESTABELECIMENTO_SLUG = process.env.ESTABELECIMENTO_SLUG ?? 'ricosty-emagracimento';
const CONFIRMAR = process.env.CONFIRMAR_IMPORTACAO === 'SIM';

interface ContatoImportacao {
  nome: string;
  telefone: string;
  email?: string;
}

async function main() {
  const estabelecimento = await (prisma as any).estabelecimento.findUnique({
    where: { slug: ESTABELECIMENTO_SLUG },
    select: { id: true, nome: true, slug: true, unidades: { where: { ativa: true }, select: { id: true, nome: true } } },
  });
  if (!estabelecimento) throw new Error(`Estabelecimento não encontrado: ${ESTABELECIMENTO_SLUG}`);

  const conteudo = await readFile(VCF_PATH, 'utf8');
  const resultado = analisarVcf(conteudo);
  const usuarios = await (prisma as any).usuario.findMany({
    where: { telefone: { not: null } },
    select: { id: true, email: true, telefone: true },
  });
  const usuarioPorTelefone = new Map<string, { id: number; email: string }>();
  usuarios.forEach((usuario: any) => {
    const telefone = normalizarTelefone(usuario.telefone);
    if (telefone && !usuarioPorTelefone.has(telefone)) usuarioPorTelefone.set(telefone, usuario);
  });

  const resumo = {
    estabelecimento: `${estabelecimento.nome} (#${estabelecimento.id})`,
    unidadeReferencia: estabelecimento.unidades[0]?.nome ?? 'Sem unidade ativa',
    arquivo: VCF_PATH,
    totalVcards: resultado.total,
    ignoradosSemNome: resultado.semNome,
    ignoradosSemTelefone: resultado.semTelefone,
    duplicadosNoArquivo: resultado.duplicados,
    contatosElegiveis: resultado.contatos.length,
    modo: CONFIRMAR ? 'IMPORTAÇÃO' : 'PRÉVIA',
  };
  console.log(JSON.stringify(resumo, null, 2));
  if (!CONFIRMAR) {
    console.log('Prévia concluída. Use CONFIRMAR_IMPORTACAO=SIM para gravar os clientes.');
    return;
  }

  let criados = 0;
  let existentes = 0;
  let vinculados = 0;
  let jaVinculados = 0;

  for (const contato of resultado.contatos) {
    let usuario = usuarioPorTelefone.get(contato.telefone);
    if (!usuario && contato.email) {
      usuario = await (prisma as any).usuario.findUnique({
        where: { email: contato.email }, select: { id: true, email: true },
      });
    }
    if (usuario) existentes += 1;
    else {
      const email = contato.email ?? emailInterno(contato.telefone);
      const emailEmUso = await (prisma as any).usuario.findUnique({ where: { email }, select: { id: true, email: true } });
      usuario = emailEmUso ?? await (prisma as any).usuario.create({
        data: {
          nome: contato.nome,
          email,
          telefone: contato.telefone,
          senha: await bcrypt.hash(randomUUID(), 10),
          membroEstabelecimento: false,
          papel: 'CUSTOMER',
        },
        select: { id: true, email: true },
      });
      emailEmUso ? existentes += 1 : criados += 1;
      usuarioPorTelefone.set(contato.telefone, usuario);
    }

    const relacao = await (prisma as any).clienteEstabelecimento.findUnique({
      where: { estabelecimentoId_usuarioId: { estabelecimentoId: estabelecimento.id, usuarioId: usuario.id } },
      select: { id: true },
    });
    if (relacao) jaVinculados += 1;
    else {
      await (prisma as any).clienteEstabelecimento.create({
        data: {
          estabelecimentoId: estabelecimento.id,
          usuarioId: usuario.id,
          origem: 'IMPORTACAO_VCF',
          status: 'ATIVO',
          tags: ['IMPORTADO_VCF'],
          observacoes: 'Contato importado da agenda do celular.',
        },
      });
      vinculados += 1;
    }
  }

  console.log(JSON.stringify({ criados, existentes, vinculados, jaVinculados }, null, 2));
}

function analisarVcf(conteudoOriginal: string) {
  const conteudo = conteudoOriginal.replace(/=\r?\n/g, '').replace(/\r?\n[ \t]/g, '');
  const cards = conteudo.split(/BEGIN:VCARD\r?\n/i).slice(1);
  const contatos = new Map<string, ContatoImportacao>();
  let semNome = 0;
  let semTelefone = 0;
  let duplicados = 0;

  for (const card of cards) {
    const linhaNome = card.match(/^FN([^:]*):(.*)$/im);
    const nome = limparNome(linhaNome ? decodificar(linhaNome[2], linhaNome[1]) : '');
    if (!nome || nomeApenasNumerico(nome)) {
      semNome += 1;
      continue;
    }
    const telefones = [...card.matchAll(/^TEL[^:]*:(.*)$/gim)]
      .map((item) => normalizarTelefone(item[1]))
      .filter((item): item is string => Boolean(item));
    if (!telefones.length) {
      semTelefone += 1;
      continue;
    }
    const emailEncontrado = card.match(/^EMAIL[^:]*:(.*)$/im)?.[1]?.trim().toLowerCase();
    const email = emailEncontrado && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEncontrado) ? emailEncontrado : undefined;
    const telefone = telefones[0];
    if (contatos.has(telefone)) {
      duplicados += 1;
      const atual = contatos.get(telefone)!;
      if (!atual.email && email) atual.email = email;
      continue;
    }
    contatos.set(telefone, { nome, telefone, email });
  }
  return { total: cards.length, semNome, semTelefone, duplicados, contatos: [...contatos.values()] };
}

function decodificar(valor: string, parametros: string) {
  const limpo = valor.replace(/\r$/, '').trim();
  if (!/ENCODING=QUOTED-PRINTABLE/i.test(parametros)) return limpo;
  const bytes: number[] = [];
  for (let indice = 0; indice < limpo.length; indice += 1) {
    if (limpo[indice] === '=' && /^[0-9A-F]{2}$/i.test(limpo.slice(indice + 1, indice + 3))) {
      bytes.push(parseInt(limpo.slice(indice + 1, indice + 3), 16));
      indice += 2;
    } else bytes.push(...Buffer.from(limpo[indice]));
  }
  return Buffer.from(bytes).toString('utf8');
}

function limparNome(nome: string) {
  return nome.replace(/\\([,;])/g, '$1').replace(/\s+/g, ' ').trim();
}

function nomeApenasNumerico(nome: string) {
  return !/[A-Za-zÀ-ž]/.test(nome) && nome.replace(/\D/g, '').length >= 7;
}

function normalizarTelefone(valor?: string | null) {
  if (!valor) return null;
  let digitos = valor.replace(/\D/g, '');
  if (digitos.startsWith('00')) digitos = digitos.slice(2);
  if (digitos.startsWith('55') && digitos.length >= 12) digitos = digitos.slice(2);
  if (digitos.length === 8 || digitos.length === 9) digitos = `11${digitos}`;
  if (digitos.length !== 10 && digitos.length !== 11) return null;
  return `+55${digitos}`;
}

function emailInterno(telefone: string) {
  const id = createHash('sha256').update(telefone).digest('hex').slice(0, 20);
  return `cliente.vcf.${id}@importacao.uniflowabs.local`;
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
