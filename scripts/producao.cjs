/* Comandos explícitos de produção. Não roda seed, instalação, reset ou dev server. */
const { loadEnvFile } = require('node:process');
const { resolve, join, isAbsolute } = require('node:path');
const { existsSync } = require('node:fs');
const { spawn } = require('node:child_process');

const raiz = resolve(__dirname, '..');
const acao = process.argv[2];
const acoes = ['build', 'build:web', 'build:api', 'web', 'api', 'migrate'];
let filho;

function exigir(nome) {
  const valor = process.env[nome];
  if (!valor || /SUBSTITUA|PREENCHA|SEU_USUARIO|SEU_DOMINIO|\.example/i.test(valor)) {
    throw new Error(`Preencha ${nome} no arquivo de produção ou no ambiente do processo.`);
  }
  return valor;
}

function executar(comando, argumentos, cwd, env = process.env) {
  return new Promise((concluir, rejeitar) => {
    filho = spawn(comando, argumentos, { cwd, env, stdio: 'inherit', shell: false });
    filho.once('error', rejeitar);
    filho.once('exit', (codigo, sinal) => {
      filho = undefined;
      if (codigo === 0) concluir();
      else rejeitar(new Error(`Processo encerrado (${sinal ?? codigo}).`));
    });
  });
}

for (const sinal of ['SIGTERM', 'SIGINT']) process.on(sinal, () => {
  if (filho) filho.kill(sinal);
  else process.exit(1);
});

async function iniciar() {
  if (!acoes.includes(acao)) throw new Error(`Use: node scripts/producao.cjs ${acoes.join('|')}`);
  if (typeof loadEnvFile !== 'function' || Number(process.versions.node.split('.')[0]) < 22) {
    throw new Error('Este fluxo requer Node.js 22 ou superior compatível com as dependências.');
  }
  // .env.prod não é carregado automaticamente pelo Next/Nest. Variáveis do painel têm prioridade.
  const arquivo = resolve(process.env.PROD_ENV_FILE || join(raiz, '.env.prod'));
  if ([raiz, arquivo].some(caminho => /[\\/]public_html([\\/]|$)/i.test(caminho))) {
    throw new Error('Mantenha o projeto e .env.prod fora de public_html; publique somente a entrada pública.');
  }
  if (existsSync(arquivo)) {
    loadEnvFile(arquivo);
  } else if (!['build', 'build:web', 'build:api'].includes(acao)) {
    throw new Error('Arquivo .env.prod ausente. Prepare-o fora de public_html.');
  }

  process.env.NODE_ENV = 'production';

  if (['build', 'build:web'].includes(acao)) {
    process.env.NEXT_PUBLIC_API_URL ||= 'https://api.uniflowabs.top';
    process.env.PUBLIC_APP_URL ||= 'https://uniflowabs.top';
  }
  const backend = join(raiz, 'apps/backend');
  const frontend = join(raiz, 'apps/frontend');
  if (acao === 'migrate') {
    exigir('DATABASE_URL');
    return executar('yarn', ['prisma', 'migrate', 'deploy'], backend);
  }
  if (['build', 'build:web', 'web'].includes(acao)) {
    for (const chave of ['NEXT_PUBLIC_API_URL', 'PUBLIC_APP_URL']) {
      if (new URL(exigir(chave)).protocol !== 'https:') throw new Error(`${chave} deve usar HTTPS.`);
    }
  }
  if (['build', 'build:web', 'build:api'].includes(acao)) {
    const compilarApi = acao !== 'build:web';
    const compilarWeb = acao !== 'build:api';

    if (compilarApi) {
      exigir('DATABASE_URL');
      await executar('yarn', ['prisma:generate'], backend);
    }

    await executar('yarn', ['workspace', '@uniflowabs/core', 'build'], raiz);

    if (compilarApi) {
      await executar('yarn', ['build'], backend);
    }

    // Sem Turbo/dev: não inicializa Expo, workers ou API e não aplica migrations.
    if (compilarWeb) {
      await executar('yarn', ['build'], frontend);
    }
    return;
  }
  if (acao === 'web') {
    const cli = require.resolve('next/dist/bin/next', { paths: [frontend] });
    const porta = process.env.PORT || process.env.FRONTEND_PORT || '3000';
    return executar(process.execPath, [cli, 'start', '-H', process.env.HOST || '127.0.0.1', '-p', porta], frontend);
  }
  exigir('DATABASE_URL');
  exigir('CORS_ORIGINS');
  exigir('PUBLIC_APP_URL');
  const segredos = ['JWT_SECRET', 'AGENDAMENTO_ACAO_SECRET', 'PAYMENT_WEBHOOK_SECRET', 'NOTIFICACOES_CALLBACK_SECRET'].map(chave => {
    const segredo = exigir(chave);
    if (segredo.length < 32) throw new Error(`${chave} deve ter pelo menos 32 caracteres aleatórios.`);
    return segredo;
  });
  if (new Set(segredos).size !== segredos.length) throw new Error('Use um segredo diferente para cada finalidade.');
  for (const chave of ['MIDIA_STORAGE_DIR', 'MIDIA_GALERIA_DIR']) {
    const caminho = exigir(chave);
    if (!isAbsolute(caminho) || /[\\/]public_html([\\/]|$)/i.test(caminho)) {
      throw new Error(`${chave} deve ser um caminho absoluto fora de public_html.`);
    }
  }
  const entrada = join(backend, 'dist/src/main.js');
  if (!existsSync(entrada)) throw new Error('Backend compilado ausente. Execute o build de produção primeiro.');
  return executar(process.execPath, [entrada], backend, {
    ...process.env, PORT: process.env.PORT || process.env.BACKEND_PORT || '4000', HOST: process.env.HOST || '127.0.0.1',
  });
}

iniciar().catch(erro => { console.error(erro.message); process.exitCode = 1; });
