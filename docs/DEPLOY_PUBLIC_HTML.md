# Produção — public_html com Next.js e NestJS

## Compatibilidade obrigatória antes do upload

Esta entrega prepara os arquivos; não representa deploy ou homologação da hospedagem. O provedor/plano ainda não foi informado.

Domínio informado: **https://uniflowabs.top**. Diretório-base informado: **`/home/rico4167/domains/uniflowabs.top`**, contendo `public_html` e `public_ftp`. Essa estrutura define os caminhos de publicação, mas não confirma suporte a Node.js/proxy.

O sistema não é PHP/Laravel. Next.js fornece rotas dinâmicas, otimização de imagens e a rota de mídia; NestJS fornece API, Prisma, uploads e workers. Não foi feita conversão para HTML estático nem removido qualquer desses recursos. Apenas enviar o repositório a `public_html` não executa a aplicação.

Confirmar com o suporte do provedor:

- Node.js 22 com Yarn Classic 1.22.22, duas aplicações/processos persistentes e reinício supervisionado.
- Apache 2.4 com `mod_rewrite`, `mod_proxy` e `mod_proxy_http`, permitindo as diretivas do `.htaccess` fornecido. Alguns planos compartilhados proíbem proxy em `.htaccess`; nesse caso o provedor precisa configurar o roteamento no painel/vhost.
- Roteamento HTTPS do domínio para Next.js, com `/api/*` encaminhado ao NestJS removendo `/api`. Os processos escutam em loopback, portas 3000 e 4000 por padrão. Se o painel fornecer outras portas, ajustar também os destinos do proxy; não expor essas portas diretamente à internet.
- MySQL compatível com as migrations existentes, SSH ou pipeline de build Linux compatível, espaço de armazenamento privado persistente e suporte às dependências nativas Prisma, bcrypt e sharp.
- Permissão para processos em segundo plano. Hospedagens que adormecem/reciclam aplicações por inatividade não garantem lembretes nem atendimento automático no horário. Esses workers estão inicialmente desativados.

Um painel que ofereça somente Passenger/“Setup Node.js App”, sem duas aplicações persistentes e roteamento compatível, exige adaptação específica do provedor. Os scripts fornecidos são comandos de processos, não entradas Passenger. Não cadastrar diretamente esses scripts como startup Passenger e presumir compatibilidade.

Se o plano aceitar somente PHP/arquivos estáticos, manter o domínio no provedor e hospedar Node.js em um serviço compatível ou mudar o plano. A adaptação final depende dessa confirmação; `.htaccess` não cria suporte a Node.js.

## Estrutura no servidor

```text
/home/rico4167/domains/uniflowabs.top/
├── public_ftp/                  ← existente; não usar para o projeto ou segredos
├── public_html/                 ← raiz pública do domínio
│   └── .htaccess                ← copiar de public_html/.htaccess deste repositório
├── uniflow/                     ← repositório PRIVADO, fora da raiz pública
│   ├── .env.prod                ← preencher; ignorado pelo Git
│   ├── scripts/producao.cjs
│   ├── apps/frontend/           ← inclui public/ e .next/ depois do build
│   ├── apps/backend/            ← inclui prisma/, dist/ depois do build
│   ├── packages/
│   └── node_modules/            ← instalado para o Linux da hospedagem
└── uniflow-storage/midias/      ← uploads persistentes privados
```

`public_html` é o nome da pasta física, **não** um prefixo de URL. As páginas continuam em `https://dominio/`, não em `/public_html/`. Não definir `basePath=/public_html`, não copiar `.next`, código, banco, backups ou `.env.prod` para a raiz pública. O diretório `public_html` no repositório é somente o modelo da entrada pública, não uma cópia completa da aplicação.

### Onde enviar cada parte neste domínio

- Projeto: criar **`/home/rico4167/domains/uniflowabs.top/uniflow`** e enviar o código para essa pasta privada. A raiz do repositório fica dentro de `uniflow`, não diretamente em `public_html`.
- Ambiente: **`/home/rico4167/domains/uniflowabs.top/uniflow/.env.prod`**.
- Entrada pública: enviar somente o arquivo modelo **`public_html/.htaccess`** para **`/home/rico4167/domains/uniflowabs.top/public_html/.htaccess`**, após conferir e preservar eventuais regras já existentes do provedor. Não criar `public_html/public_html`.
- Uploads: reservar **`/home/rico4167/domains/uniflowabs.top/uniflow-storage/midias`**, fora da raiz pública e fora da pasta de releases do código.
- Diretório de trabalho dos dois processos Node.js: **`/home/rico4167/domains/uniflowabs.top/uniflow`**. Os comandos de build/migrations também partem dessa pasta.
- `public_ftp`: não usar; não mover nem apagar conteúdo existente. Não colocar configuração privada nessa pasta.

`uniflow` e `uniflow-storage` são novas pastas propostas, a criar pelo responsável; nenhuma pasta remota foi criada. Confirmar no painel que somente `public_html` é a raiz HTTP do domínio e que não existem aliases/subdomínios expondo as pastas privadas. Se o provedor não permitir código privado nesse diretório-base, escolher com ele outro caminho fora do document root e atualizar as variáveis correspondentes.

O `.htaccess` fornecido encaminha `/api` para `127.0.0.1:4000` e as demais URLs para `127.0.0.1:3000`, incluindo `/_next/*` e `/midias/*`. Não instalar fallback Laravel/`index.php` nem SPA/`index.html`. Arquivos antigos `index.php/index.html` devem ser avaliados e preservados/retirados pelo responsável antes do corte de tráfego; nada foi apagado automaticamente.

Configurar certificado e redirecionamento HTTP → HTTPS no painel/vhost antes da liberação. Não há regra de redirecionamento HTTPS em `.htaccess` que presuma os headers do proxy do provedor. Caso haja redirects de upstream, o provedor deve configurar a reescrita de headers de resposta (ProxyPassReverse ou equivalente). Não habilitar proxy forward aberto.

## Ambiente de produção

Foi criado `.env.prod` na raiz privada e `.env.prod.example` versionado. Ambos já usam o domínio e os caminhos acima. MySQL, segredos e e-mail administrativo continuam com placeholders para preenchimento; não foram reutilizadas senhas locais. `infra-mysql-1` existe apenas na rede Docker local; não serve como host no compartilhado. O banco pode receber prefixo obrigatório do usuário do painel.

Valores já preparados:

```dotenv
PUBLIC_APP_URL=https://uniflowabs.top
NEXT_PUBLIC_API_URL=https://uniflowabs.top/api
CORS_ORIGINS=https://uniflowabs.top
MIDIA_STORAGE_DIR=/home/rico4167/domains/uniflowabs.top/uniflow-storage/midias
MIDIA_GALERIA_DIR=/home/rico4167/domains/uniflowabs.top/uniflow/apps/frontend/public
```

O endereço canônico escolhido é sem `www`. Se o domínio `www.uniflowabs.top` também for usado, configurar DNS/certificado/redirecionamento no provedor; só adicionar outra origem ao CORS se a aplicação realmente for servida nela.

Gerar quatro segredos aleatórios independentes com pelo menos 32 bytes cada e guardá-los em gestor de senhas; nunca usar os placeholders. O comando de geração está em `COMANDOS.md`. Trocar JWT_SECRET invalida sessões; trocar AGENDAMENTO_ACAO_SECRET invalida links assinados. O segredo do pagamento precisa coincidir com o configurado na integração real; configurar um segredo não ativa o gateway/provedores reais.

`scripts/producao.cjs` carrega `.env.prod` explicitamente via Node.js, independentemente de o Nest carregar `.env`. Variáveis já definidas no painel/processo têm prioridade. Opcionalmente `PROD_ENV_FILE` aponta para outro caminho privado. Não compartilhar `PORT` global entre as duas aplicações: o painel deve fornecer uma porta por processo, ou usar `FRONTEND_PORT`/`BACKEND_PORT`.

`NEXT_PUBLIC_API_URL=https://dominio/api` deve existir **antes do build**: essa variável é embutida no JavaScript do navegador; trocar somente no servidor após o build não atualiza o bundle. `PUBLIC_APP_URL` é a URL HTTPS da web para links de agendamento/descadastro. `CORS_ORIGINS` contém apenas origens autorizadas separadas por vírgula, sem caminhos (incluindo www somente se usado). CORS não substitui autenticação/autorização nem bloqueia clientes nativos.

Não publicar os `.env.local` do frontend/mobile ou `.env` de desenvolvimento. Não atribuir prefixo `NEXT_PUBLIC_` a segredos. Restringir a leitura do `.env.prod` ao usuário da aplicação; ele e os diretórios privados não devem ser acessíveis pelo servidor HTTP. A imagem Docker também passa a excluir `.env*` do contexto copiado.

## Instalação, build e ativação

Comandos completos e impactos estão na seção **Produção em public_html** de `COMANDOS.md`; executar na raiz **privada** do projeto.

1. Confirmar requisitos com o provedor e fazer backup do MySQL e uploads. Não executar reset nem seed genérico em produção.
2. Enviar o código privado e o modelo público para os locais separados acima. Instalar dependências no Linux/arquitetura de destino; não enviar `node_modules` do macOS ou binários de outro sistema.
3. Preencher `.env.prod`, configurar persistência/permissões da pasta de mídias e fornecer toda a galeria em `apps/frontend/public`.
4. Instalar dependências incluindo ferramentas de build. Executar `yarn prod:build`: gera Prisma Client, compila core, backend e frontend sequencialmente, sem Turbo/Expo e sem aplicar migrations. Esse fluxo exige ferramentas de build disponíveis; não remover devDependencies antes da compilação.
5. Inspecionar migrations pendentes e aplicar `yarn prod:migrate` somente com autorização/backup. O comando faz `migrate deploy`, nunca reset/seed. Banco novo precisa de provisionamento administrativo controlado; migrations não criam automaticamente o superadmin.
6. Configurar dois processos supervisionados usando `yarn prod:api` e `yarn prod:web`, diretório de trabalho na raiz privada. Não usar `yarn dev`, Docker Compose de desenvolvimento ou terminal SSH como supervisor. O backend de produção usa a entrada compilada real `dist/src/main.js`.
7. Apontar o domínio/document root para `public_html`, instalar a regra proxy homologada pelo provedor e somente então liberar tráfego.
8. Para o mobile publicado, configurar sua URL de API HTTPS pelo processo próprio de build/distribuição; este fluxo não compila nem publica o app.

Os scripts verificam placeholders e recusam projeto/ambiente dentro de `public_html`. O processo API também exige segredos distintos e caminhos privados absolutos de mídia. Isso é proteção contra configuração incompleta, não auditoria de segurança de produção.

## Aceite pelo responsável

- Home, refresh direto em `/estabelecimentos/slug`, login, gestão, URLs `/_next/*`, imagens otimizadas e mídia funcionando em HTTPS.
- `/api/public/estabelecimentos` chegando à API sem duplicar o prefixo `/api`; telefone/autenticação/tenant e permissões preservados.
- Upload persistindo após reiniciar os processos e galeria sem 404; API pode escrever no storage e frontend pode escrever no cache `.next/cache` quando necessário.
- Código, `.env*`, backups e uploads privados não acessíveis por HTTP; CORS permitindo somente origens configuradas.
- Logs e restart supervisionados, MySQL/backup/rollback definidos; nunca publicar logs ou configurações contendo credenciais.
- Nenhum envio real ou transição automática inesperada: habilitar workers separadamente após homologação dos fluxos, provedores e persistência.
- Confirmar disponibilidade e atualizações de segurança do runtime/dependências antes de produção. Esta entrega não atualiza versões nem representa liberação de segurança do sistema.

Nenhum build, teste, instalação, migration, seed, reinício ou deploy foi executado pelo agente.

## Referências oficiais

- [Next.js 14: implantação Node.js e limitações da exportação estática](https://nextjs.org/docs/14/app/building-your-application/deploying).
- [Next.js 14: variáveis públicas incorporadas no build](https://nextjs.org/docs/14/pages/building-your-application/configuring/environment-variables).
- [Node.js 22: carregamento de arquivos de ambiente](https://nodejs.org/download/release/v22.23.0/docs/api/cli.html).
- [Apache: flag de proxy P e requisitos do mod_proxy](https://httpd.apache.org/docs/current/en/rewrite/flags.html).
