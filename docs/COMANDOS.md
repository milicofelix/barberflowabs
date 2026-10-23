# Comandos Do Projeto

Catalogo unico de comandos operacionais do UniFlow ABS. Execute-os a partir da raiz do monorepo, salvo quando a secao indicar outro diretorio.

Antes de usar um comando, leia a explicacao e confirme se ele apenas consulta informacoes ou se altera containers, dependencias ou banco de dados. Substitua valores como `SEU_IP`, `usuario`, `senha` e `banco` pelos dados do ambiente. Nunca versione segredos reais.

## Regra De Manutencao

- Todo comando novo sugerido durante a evolucao do projeto deve ser registrado neste arquivo.
- Antes de adicionar um comando, pesquise se ele ja existe aqui e evite duplicatas.
- Quando duas variantes tiverem finalidades diferentes, mantenha ambas e explique a diferenca.
- Comandos de teste, build, lint, migration, seed, instalacao ou restart somente devem ser executados quando solicitados explicitamente.

## APK Android beta pelo EAS

Fluxo preparado em `apps/mobile/eas.json`, perfil **beta**, distribuição interna, APK release sem Metro/Expo Go, usando `https://api.uniflowabs.top`. O perfil define EXPO_PUBLIC_API_BASE_URL e também API_URL, pois o código atual consome esta última. Guia: [ANDROID_APK_BETA_EAS.md](ANDROID_APK_BETA_EAS.md). Executar no terminal local, não no servidor de produção. Não executado pelo agente.

### Abrir o terminal Docker já dentro do mobile

```bash
docker compose run --rm --no-deps \
  --workdir /workspace/barberFlowABS/apps/mobile \
  --volume uniflowabs_expo_home:/root/.expo \
  -e API_URL=https://api.uniflowabs.top \
  -e EXPO_PUBLIC_API_BASE_URL=https://api.uniflowabs.top \
  app bash
```

Executar no terminal do Mac na raiz do repositório, onde está `docker-compose.yml`. Requer Docker ativo, imagem do serviço `app` e dependências disponíveis. Não usar `-T`: login, associação, credenciais e configuração de variáveis são interativos. `--workdir` seleciona a pasta mobile dentro do container. `app bash` substitui o comando padrão e não inicia Turbo, backend ou Metro; `--no-deps` evita iniciar dependências. Não publica portas de desenvolvimento.

O volume `uniflowabs_expo_home` é criado/reutilizado para preservar a sessão Expo entre containers temporários, como nos projetos Autoflow/Saiu do Forno. Não contém os dados MySQL nem uploads, mas armazena credenciais de sessão: não compartilhar nem remover indiscriminadamente. O bind mount existente mantém alterações de `app.json` no repositório do Mac.

**Os próximos comandos são executados dentro desse mesmo terminal Docker.** Não executar npx no Mac nem abrir containers separados sem o volume de sessão. Ao terminar, sair do shell normalmente; o container temporário será removido e o volume de login será preservado. Para um novo build, reabrir o shell com o comando acima e repetir o build; fazer login novamente somente se a sessão tiver expirado. Não é preciso reiniciar/recriar o serviço `app` já existente.

### Login e associação do projeto (primeira vez)

Se o responsável fez login no serviço `app` existente (por exemplo com Expo CLI), usar a sessão desse container em vez de abrir outro container com um volume de sessão diferente:

```bash
docker compose exec -w /workspace/barberFlowABS/apps/mobile app bash
```

Exige serviço `app` em execução; abre shell interativo na pasta correta sem reiniciar processos. Executar os comandos EAS abaixo dentro dele. A sessão da camada gravável de `app` pode ser perdida ao recriar esse container; isso não equivale à sessão persistente no volume `uniflowabs_expo_home`. Não usar `-T` para menus interativos nem copiar senhas/tokens para o repositório.

```bash
npx eas-cli@latest login
```

```bash
npx eas-cli@latest init
```

O npx pode baixar EAS CLI. Login autentica sua conta; init cria/associa um projeto remoto Expo e grava o projectId. Escolher a conta/projeto UniFlow correto, não o projeto Saiu do Forno. Se o CLI informar que não pode editar a configuração dinâmica, copiar o ID real informado para `expo.extra.eas.projectId` de `apps/mobile/app.json`, preservando os campos existentes. Não inventar projectId nem repetir init para criar projetos duplicados.

### Assinatura e chave do mapa Android

```bash
npx eas-cli@latest credentials -p android
```

Menu de credenciais: selecionar perfil beta e consultar/criar keystore conforme necessário. Pode alterar credenciais remotas se essa ação for escolhida; reutilizar a assinatura existente do app quando houver. Obter o SHA-1 do certificado de assinatura EAS para restringir a chave Google ao pacote `com.barberflowabs.app` e ao Maps SDK for Android.

```bash
npx eas-cli@latest env:set --environment production --name GOOGLE_MAPS_API_KEY --visibility sensitive
```

Cria/atualiza a variável do projeto EAS; informar a chave Google Maps no prompt, sem colocá-la no histórico do shell. Se ela já existir corretamente no ambiente production, não é preciso repetir. A configuração dinâmica lê essa variável para o mapa nativo. Não usar visibilidade secret para configuração que precisa ser resolvida pelo CLI localmente. A chave Android será incorporada ao aplicativo: restringir por pacote, SHA-1 e SDK, nunca tratá-la como segredo de backend. Habilitar Maps SDK for Android e faturamento conforme requisitos do Google Cloud.

### Gerar APK beta na nuvem

```bash
npx eas-cli@latest build --platform android --profile beta
```

Envia o código ao Expo e inicia compilação remota, podendo consumir cota/cobrança do plano. O hook EAS compila o core compartilhado antes do bundle. Ao concluir, abrir o link fornecido no Android, baixar o APK e autorizar a instalação pela origem escolhida. Não publica na Play Store. Nos próximos builds, repetir apenas este comando se projeto/credenciais já estiverem configurados. A URL da API já está no perfil; não depende de exportá-la no terminal local. Não enviar `.env.prod` do backend ao Expo.

Variante executada com autorização em 22/10/2026, usando o serviço `app` já autenticado (partir da raiz do repositório no Mac):

```bash
docker compose exec -w /workspace/barberFlowABS/apps/mobile \
  -e API_URL=https://api.uniflowabs.top \
  -e EXPO_PUBLIC_API_BASE_URL=https://api.uniflowabs.top \
  app npx --yes eas-cli@latest build --platform android --profile beta --no-wait
```

Envia um **novo build** remoto e retorna após submissão com o link EAS; não aguarda sucesso da compilação. Incrementa versionCode conforme o perfil e pode consumir cota. Não repetir para consultar o progresso: usar o link do build já enviado. O valor da chave Maps não aparece nesse comando; é carregado do ambiente EAS production. Registro do envio em `ANDROID_APK_BETA_EAS.md`.

Usa produção real: a disponibilidade da API e a configuração do mapa precisam ser homologadas pelo responsável. Nenhuma verificação de API, geração de chave, login remoto ou build foi executado pelo agente.

## Correção de dependências do APK beta (Docker)

Comandos utilizados no fluxo de correção autorizado do primeiro build EAS. Partir da raiz do repositório no Mac, com `app` em execução. Não usar estes comandos no servidor remoto como rotina de deploy.

```bash
docker compose exec -T -w /workspace/barberFlowABS app yarn install --ignore-scripts --non-interactive --network-timeout 300000
```

Atualiza a instalação e `yarn.lock` conforme os manifests corrigidos. Usa `--ignore-scripts` para não executar postinstall do backend/Prisma; não é uma instalação completa para provisionar um ambiente novo do zero (binários nativos como bcrypt podem exigir seus scripts em ambiente novo). Pode baixar pacotes e modificar dependências do workspace. Não remove volumes nem executa migrations/seed/restart. O EAS faz uma instalação limpa normal, com scripts, a partir do lock atualizado.

```bash
docker compose exec -T -w /workspace/barberFlowABS/apps/mobile app npx --yes expo-doctor --verbose
```

Diagnóstico focado de SDK, config e dependências do mobile. Não executa testes unitários nem altera o banco. Pode baixar o Expo Doctor e consultar recomendações atuais pela rede. No checkout local o lock npm legado ainda existe; `.easignore` exclui esse arquivo do EAS, portanto esse check local pode diferir do arquivo realmente enviado. Duplicações adicionais precisam ser investigadas, não suprimidas indiscriminadamente. Reenvio usa o comando beta já catalogado acima; gera outro build/versionCode e pode consumir cota.

## Descobrir O IP Local

### macOS com Wi-Fi em `en0`

```bash
ipconfig getifaddr en0
```

Mostra o IPv4 atual do computador. Esse endereco deve substituir `SEU_IP` nos comandos do Expo e da API. Se nao houver resultado, confirme a interface ativa com `ifconfig`.

## Subir O Ambiente Docker

### Web, backend e mobile com Expo na rede local

```bash
EXPO_PACKAGER_HOSTNAME=SEU_IP API_URL=http://SEU_IP:4000 docker compose up app
```

Inicia o servico `app`, que executa frontend, backend, pacote compartilhado e Metro. O celular e o computador devem estar na mesma rede. Exemplo: `SEU_IP=192.168.1.6`.

### Recriar o container ao subir

```bash
EXPO_PACKAGER_HOSTNAME=SEU_IP API_URL=http://SEU_IP:4000 docker compose up --force-recreate app
```

Recria o container antes de iniciar. Use somente quando a configuracao do container ou as variaveis de ambiente precisarem ser reaplicadas. A recriacao pode perder a sessao do Expo CLI mantida dentro do container.

### Subir em segundo plano

```bash
EXPO_PACKAGER_HOSTNAME=SEU_IP API_URL=http://SEU_IP:4000 docker compose up -d app
```

Inicia o ambiente sem manter os logs presos ao terminal. Consulte os logs com os comandos da secao de diagnostico.

### Sobrescrever configuracoes do backend

```bash
DATABASE_URL='mysql://usuario:senha@host:3306/banco' JWT_SECRET='segredo-local-forte' SUPER_ADMIN_EMAILS='admin@exemplo.com' docker compose up app
```

Inicia o ambiente usando valores diferentes dos fallbacks do `docker-compose.yml`. Nao copie credenciais reais para documentacao, historico compartilhado ou commits.

## Produção em public_html

Pré-condições e estrutura completa em [DEPLOY_PUBLIC_HTML.md](DEPLOY_PUBLIC_HTML.md). Estes comandos são para a raiz **privada** do repositório no servidor Linux compatível, fora de `public_html`; não executar no container de desenvolvimento como se fosse publicação. O provedor precisa suportar dois processos Node.js persistentes e proxy reverso. Nenhum dos comandos abaixo foi executado pelo agente.

Para `https://uniflowabs.top`, o diretório de trabalho proposto é `/home/rico4167/domains/uniflowabs.top/uniflow`. `public_html` recebe somente a entrada pública; `public_ftp` não é utilizado. `.env.prod` e o modelo já usam esse domínio e os caminhos privados documentados no guia. Credenciais e suporte do provedor ainda precisam ser configurados/confirmados.

### Gerar um segredo independente

```bash
openssl rand -hex 32
```

Gera 32 bytes aleatórios (64 caracteres hexadecimais). Repetir separadamente para JWT_SECRET, AGENDAMENTO_ACAO_SECRET, PAYMENT_WEBHOOK_SECRET e NOTIFICACOES_CALLBACK_SECRET e guardar os resultados no `.env.prod` privado/gestor de senhas, nunca em commits, tickets ou capturas de tela. Não reutilizar o mesmo resultado nas quatro variáveis.

### Instalar dependências para compilar no servidor

```bash
yarn install --frozen-lockfile --production=false
```

Exige Node.js 22 e Yarn Classic 1.22.22 no sistema/arquitetura de destino. Instala também ferramentas de build e executa scripts de instalação, incluindo geração Prisma do backend. Não inicia aplicação, não aplica migrations nem popula o banco. Não copiar `node_modules` do macOS para o Linux. Requer acesso de rede e pode exigir binários/bibliotecas nativas compatíveis com Prisma, bcrypt e sharp.

### Compilar somente web, backend e core para produção

```bash
yarn prod:build
```

Lê explicitamente `.env.prod` privado, gera Prisma Client e compila core, NestJS e Next.js, sem Expo/Turbo dev. Exige dependências instaladas e ambiente preenchido, inclusive NEXT_PUBLIC_API_URL HTTPS antes do build. Substitui saídas compiladas: executar em release de preparação, não por cima de uma aplicação ativa. Não executa migrations nem seed.

### Aplicar migrations na base de produção

```bash
yarn prod:migrate
```

Lê DATABASE_URL de `.env.prod` (variáveis do painel têm prioridade) e executa Prisma `migrate deploy`. Altera schema/dados conforme o SQL das migrations: exige backup, revisão e autorização do responsável. Não reseta nem semeia a base. Rodar antes de liberar a nova versão e somente após conferir o host/banco de destino sem expor a senha.

### Comandos dos dois processos supervisionados

```bash
yarn prod:api
```

```bash
yarn prod:web
```

Cadastrar separadamente no supervisor suportado pelo provedor, com diretório de trabalho na raiz privada do projeto. Não executar sequencialmente em um mesmo terminal esperando que ambos persistam: cada comando permanece em primeiro plano. Usam `.env.prod` e código previamente compilado. API usa BACKEND_PORT=4000 e web FRONTEND_PORT=3000 por padrão; PORT/HOST fornecidos por processo no painel têm prioridade e devem corresponder ao proxy. Não executam dev server, build, migrations ou seed automaticamente. Não são arquivos startup Passenger; planos com Passenger exclusivo precisam de adaptação após confirmar recursos do provedor.

Não há comando genérico de upload, reinício do supervisor ou ativação de proxy: esses passos dependem do plano/painel, ainda não informados. Usar apenas o `.htaccess` de `public_html` como entrada pública, nunca enviar `.env.prod` ou o repositório completo ao document root.

## Controlar O Container

### Reiniciar depois de alterar o backend

```bash
docker compose restart app
```

Reinicia o servico sem reconstruir a imagem. Atualmente o backend usa `nest start` sem `--watch`, portanto mudancas em controllers, services e repositories exigem esse restart para entrarem em vigor.

Também usar após a correção de `MIDIA_STORAGE_DIR` e `MIDIA_GALERIA_DIR` no `globalEnv` do `turbo.json`: o processo Turbo precisa reiniciar para repassar os diretórios ao backend. Com as variáveis e o volume já definidos no container atual, basta este restart, sem seed, migration ou recriação de mídias. Interrompe temporariamente backend, frontend e Metro do serviço `app`. Detalhes em `docs/OPERACAO_GALERIA_MIDIAS.md`.

### Parar sem remover

```bash
docker compose stop app
```

Interrompe o container e preserva sua configuracao e volumes para uma inicializacao posterior.

### Remover os containers do Compose

```bash
docker compose down
```

Para e remove os containers e a rede criada pelo Compose. Nao remove volumes nomeados sem a opcao `--volumes`.

## Diagnostico Docker E API

### Recuperar o MySQL compartilhado depois de remover containers

O Compose deste aplicativo declara somente `app`; o MySQL pertence ao projeto `infra`. Se os logs mostrarem `P1001` / `Can't reach database server at infra-mysql-1:3306`, confira primeiro a listagem de containers desta seção. Se o MySQL foi removido, recrie somente esse serviço usando o Compose original:

```bash
docker compose -p infra -f /Users/adrianofreitas/www/general-projects/infra/docker-compose.yml up -d mysql
```

Comando específico desta máquina. Cria/inicia o container MySQL e usa o volume `infra_mysql_data` e a rede `shared_net` definidos na infraestrutura original. Não executado pelo agente. O volume existente não comprova integridade nem presença dos dados; não remova volumes, não use reset nem seed como tentativa de recuperação. Se o volume tiver sido apagado, a inicialização cria uma base vazia e os dados antigos exigem backup.

```bash
docker compose -p infra -f /Users/adrianofreitas/www/general-projects/infra/docker-compose.yml logs --tail=80 mysql
```

Consulta os logs da infraestrutura. Aguarde a mensagem `ready for connections`; se o banco não iniciar, investigue esses logs antes de reiniciar o app. Com o MySQL pronto, use **Reiniciar depois de alterar o backend**, já catalogado acima, para reiniciar `app`. Não é necessário rebuild para resolver a ausência desse container.

### Conferir o estado dos servicos

```bash
docker compose ps
```

Mostra se o servico esta ativo e quais portas foram publicadas.

### Listar todos os containers do Docker

```bash
docker ps -a --format '{{.Names}}\t{{.Status}}'
```

Lista containers ativos e parados de todos os projetos, exibindo nome e estado. E util para descobrir dependencias compartilhadas, como o container do MySQL.

### Listar os servicos declarados no Compose

```bash
docker compose config --services
```

Mostra somente os nomes dos servicos definidos na configuracao final do projeto.

### Consultar os logs recentes

```bash
docker compose logs --tail=160 app
```

Exibe as ultimas 160 linhas do ambiente. Ajuste o numero quando precisar de mais ou menos contexto.

### Acompanhar logs continuamente

```bash
docker compose logs -f app
```

Mantem o terminal acompanhando novos logs. Encerre apenas o acompanhamento com `Ctrl+C`.

### Ver a configuracao final do Compose

```bash
docker compose config
```

Resolve o arquivo Compose e suas variaveis. Pode revelar valores de ambiente; nao compartilhe a saida sem revisar segredos.

### Conferir quando o container foi iniciado

```bash
docker inspect -f '{{.State.StartedAt}}' barberflow_abs_app
```

Mostra o instante de inicializacao do container. Foi usado para confirmar se o backend realmente havia sido reiniciado depois de uma alteracao.

### Executar um comando pontual no container

```bash
docker exec barberflow_abs_app COMANDO
```

Executa `COMANDO` diretamente no container ativo. Prefira `docker compose exec app` nas operacoes normais; use esta forma para diagnosticos que dependam do nome exato do container.

### Verificar a saude do backend

```bash
curl -sS -i http://localhost:4000/ping
```

Consulta o endpoint simples da API. A raiz `http://localhost:4000/` responder com `404` e normal.

### Verificar o marketplace publico

```bash
curl -sS -i "http://localhost:4000/public/estabelecimentos?cidade=Sao%20Paulo&raioKm=25"
```

Consulta estabelecimentos publicos usando o nome externo e canonico da plataforma.

### Consultar um estabelecimento publico

```bash
curl -sS -i "http://localhost:4000/public/estabelecimentos/SLUG"
```

Substitua `SLUG` pelo identificador publico do estabelecimento.

### Consultar um endpoint autenticado

```bash
curl -sS -i -H 'Authorization: Bearer SEU_TOKEN' -H 'x-estabelecimento-slug: SLUG' http://localhost:4000/ROTA
```

Consulta uma rota protegida no tenant informado. Nunca registre um token real neste arquivo, em commits ou em mensagens compartilhadas.

## Diagnostico Do Banco MySQL

Os comandos desta secao sao modelos sanitizados dos diagnosticos ja usados. Eles devem ser somente leitura. O parametro `-p` solicita a senha sem grava-la no historico do terminal.

### Abrir o cliente MySQL do container compartilhado

```bash
docker exec -it infra-mysql-1 mysql -uUSUARIO -p BANCO
```

Abre uma sessao interativa no banco escolhido. Confirme o banco antes de executar qualquer instrucao.

### Executar uma consulta SQL somente leitura

```bash
docker exec -it infra-mysql-1 mysql -uUSUARIO -p BANCO -e "SELECT * FROM TABELA LIMIT 20;"
```

Executa uma consulta e encerra a sessao. Troque os placeholders e mantenha `SELECT` para diagnosticos. Nao coloque a senha diretamente no comando.

### Inspecionar agendamentos de um profissional

```sql
SELECT id, profissionalId, estabelecimentoId, status, data, dataFim, inicioOcupacao, fimOcupacao, usuarioId, createdAt
FROM agendamentos
WHERE profissionalId = ID_PROFISSIONAL
ORDER BY COALESCE(inicioOcupacao, data);
```

Ajuda a localizar conflitos reais de agenda e diferenciar dados persistidos de cache ou erro visual.

### Inspecionar bloqueios da agenda

```sql
SELECT id, profissionalId, estabelecimentoId, unidadeId, inicio, fim, motivo
FROM bloqueios_agenda
WHERE estabelecimentoId = ID_ESTABELECIMENTO
ORDER BY inicio;
```

Lista bloqueios administrativos do estabelecimento. Adicione filtros de periodo antes de consultar bases grandes.

### Inspecionar horario de funcionamento

```sql
SELECT id, estabelecimentoId, unidadeId, diaSemana, inicio, fim, intervaloInicio, intervaloFim, ativo
FROM horarios_funcionamento
WHERE estabelecimentoId = ID_ESTABELECIMENTO
ORDER BY diaSemana, inicio;
```

Mostra expediente e intervalo configurados, permitindo comparar a grade apresentada com o banco.

## Dependencias

### Instalar as dependencias no volume Docker

Primeiro execute o comando **Parar sem remover**. Em seguida:

```bash
docker compose run --rm --no-deps app yarn install --network-timeout 600000
```

Instala as dependencias do monorepo no volume Docker. Parar o servico antes evita concorrencia sobre `node_modules`. Esse comando altera `node_modules` e pode atualizar o lockfile conforme as declaracoes existentes.

### Confirmar que um pacote esta instalado

```bash
docker compose run --rm --no-deps app node -p "require.resolve('expo-location/package.json')"
```

Mostra o caminho resolvido do pacote sem iniciar o aplicativo. Troque `expo-location` pelo pacote que deseja conferir.

### Instalar uma dependencia Expo compativel

```bash
docker compose exec -T app sh -lc 'cd apps/mobile && npx expo install NOME_DO_PACOTE'
```

Instala a versao recomendada para o SDK Expo atual. Esse comando altera dependencias e lockfile.

### Instalar a biblioteca da agenda operacional

```bash
docker compose stop app
docker compose run --rm --no-deps app yarn install --force --network-timeout 600000 --network-concurrency 1
docker compose up --force-recreate app
```

Atualiza o volume de dependencias depois da inclusao da linha estavel e MIT do calendario usado pelo adaptador mobile. O container e interrompido antes para evitar concorrencia ao relincar `node_modules`. Os scripts de instalacao precisam permanecer habilitados porque o backend utiliza o modulo nativo `bcrypt`.

### Recuperar o binario nativo do bcrypt

```bash
docker compose stop app
docker compose run --rm --no-deps app npm rebuild bcrypt
docker compose up --force-recreate app
```

Reinstala somente o binario Linux do `bcrypt` no volume `node_modules`. Use quando aparecer `Cannot find module .../bcrypt_lib.node`, normalmente depois de uma instalacao feita incorretamente com `--ignore-scripts`. Nao apaga dados nem executa testes ou build da aplicacao.

## Prisma E Banco De Dados

O banco MySQL e compartilhado. Revise a migration e tenha backup antes de alterar sua estrutura. Nao use `prisma migrate dev` nesse banco, pois o comando tenta criar um shadow database e pode falhar ou operar no ambiente errado.

### Recuperar o container depois de alterar schema ou workspaces

Use esta sequencia quando o servico `app` nao permanece ativo e, por isso, comandos com `docker compose exec` nao funcionam:

```bash
docker compose stop app
docker compose run --rm --no-deps app yarn install --network-timeout 600000
docker compose run --rm --no-deps app sh -lc 'cd apps/backend && npx prisma migrate deploy'
docker compose run --rm --no-deps app sh -lc 'cd apps/backend && npx prisma generate'
docker compose up --force-recreate app
```

O primeiro comando interrompe o ciclo de reinicio. O segundo atualiza os links dos workspaces no volume `node_modules`, inclusive `@uniflowabs/core`. Os dois comandos seguintes aplicam as migrations e sincronizam o Prisma Client com o schema atual. O ultimo recria somente o container da aplicacao, preservando o volume de dependencias e os dados do banco.

Essa sequencia nao remove `node_modules`, volumes ou dados. Antes de aplicar migrations em banco compartilhado, faca backup.

### Ver o estado das migrations

```bash
docker compose exec -T app sh -lc 'cd apps/backend && npx prisma migrate status'
```

Compara as migrations versionadas com a tabela de controle do banco sem aplicar novas migrations.

### Aplicar migrations pendentes

```bash
docker compose exec -T app sh -lc 'cd apps/backend && npx prisma migrate deploy'
```

Aplica, em ordem, somente as migrations versionadas que ainda estao pendentes. Altera a estrutura e possivelmente os dados do banco.

Para o logo configurável da unidade, `20261015230000_add_establishment_logo` adiciona `logoURL` e `logoModo` com padrão `PADRAO`, sem alterar banners ou aprovações. Fazer backup, aplicar migrations, gerar o Prisma Client e reiniciar `app` pelas rotinas já catalogadas, nessa ordem. Sem reset, seed ou nova dependência nativa. Detalhes em [PLANO_MIDIA_IMAGENS_E_IDENTIDADE.md](PLANO_MIDIA_IMAGENS_E_IDENTIDADE.md).

Para a Etapa 10 — Fase 5, aplica `20261015190000_add_loyalty_program` (oito tabelas novas, sem crédito retroativo ou ativação automática). Fazer backup e executar depois a geração do Prisma Client e o reinício de `app`, ambos já catalogados abaixo. Não executar reset ou seed. A API de atendimentos passa a depender dessas tabelas, mesmo com programa inativo: aplicar antes de utilizar a nova versão. Contratos e aceite em [ETAPA_10_RELACIONAMENTO_FIDELIZACAO_NOTIFICACOES.md](ETAPA_10_RELACIONAMENTO_FIDELIZACAO_NOTIFICACOES.md).

A migration de dados `20261015030000_retire_legacy_professional_photos` substitui apenas fotos demonstrativas conhecidas por silhuetas de acordo com o sexo cadastrado, desativa os antigos itens globais e retira seus vinculos profissionais. Preserva uploads reais e nao muda o schema; mantenha backup antes de aplicar. Procedimento e aceite em [CORRECAO_AVATARES_PROFISSIONAIS.md](CORRECAO_AVATARES_PROFISSIONAIS.md).

Na canonicalizacao da Etapa 7, esse comando aplica primeiro a capacidade operacional da Etapa 6 e depois renomeia tabelas, colunas e papeis para o vocabulario de `estabelecimento`. Faça backup antes: essa mudanca remove os aliases tecnicos antigos e exige que backend, web e mobile sejam atualizados juntos.

### Recuperar especificamente a migration de importacao de contatos

```bash
awk '/^CREATE TABLE `importacoes_contatos_lotes`/{emit=1} emit' apps/backend/prisma/migrations/20261013020000_add_contact_import_domain/migration.sql | docker compose exec -T -w /workspace/barberFlowABS/apps/backend app npx prisma db execute --stdin --schema prisma/schema.prisma
docker compose exec -T app sh -lc 'cd apps/backend && npx prisma migrate resolve --applied 20261013020000_add_contact_import_domain'
```

Procedimento excepcional usado para recuperar a falha `P3009/P2021` causada pelo nome de indice maior que o limite de 64 caracteres do MySQL. O primeiro comando aplica somente as tabelas e chaves que ficaram pendentes; o segundo registra a migration como aplicada. Nao execute em outro banco sem confirmar antes que as colunas `emailContato`, `emailTecnico`, `telefoneNormalizado` e o indice de telefone ja existem, enquanto as tabelas de importacao ainda nao existem.

### Gerar o Prisma Client

```bash
docker compose exec -T app sh -lc 'cd apps/backend && npx prisma generate'
```

Regenera o cliente a partir do `schema.prisma`. Execute depois de migrations que alterem modelos usados pelo codigo.

### Testes opcionais da fidelizacao — Etapa 10, Fase 5

```bash
docker compose exec -T app sh -lc 'cd apps/backend && yarn test "fidelidade.spec.ts|fluxo-atendimento.service.spec.ts|atendimento-aceite.spec.ts" --runInBand'
```

Executa somente os testes isolados de fidelidade e os contratos de fluxo/receita relacionados. Nao aplica migrations, nao ativa programas e nao substitui homologacao de concorrencia no MySQL. Comando disponibilizado para execucao manual; nao foi executado pelo agente.

Para o cadastro de membros com senha temporaria, aplicar a migration `20261014230000_add_member_temporary_password` com o comando acima de migrations e depois gerar o Prisma Client. A coluna nova `usuarios.trocarSenhaObrigatoria` preserva as contas existentes com valor `false`. O procedimento e o aceite manual estao em [CADASTRO_MEMBROS_E_SENHA_TEMPORARIA.md](CADASTRO_MEMBROS_E_SENHA_TEMPORARIA.md). Nao e necessario resetar a base nem executar seed.

### Executar o seed

```bash
docker compose exec -T app sh -lc 'cd apps/backend && npx prisma db seed'
```

Cria ou atualiza os dados de demonstracao definidos em `apps/backend/prisma/seed.ts`. Isso inclui os 12 estabelecimentos multissegmento do Tatuape, 48 clientes e 240 atendimentos concluidos distribuidos entre 1 e 10 de outubro de 2026. O historico cobre barbearia, salao de beleza, manicure e pedicure, clinica de estetica, spa e estudios de beleza. Mesmo usando operacoes idempotentes, o seed altera dados e deve ser revisado antes da execucao.

**Pré-requisito identificado em 22/10/2026:** o schema atual usa `engineType = "client"` e a API inicializa Prisma com `PrismaMariaDb`, mas o seed principal ainda usa `new PrismaClient()` sem adapter. Adaptar o seed antes de executá-lo com o client atual. Não executar reset contando com o seed automático enquanto essa incompatibilidade não estiver corrigida. Esta consulta não alterou o código do seed nem executou comandos no banco.

### Conferir o destino antes de seed/reset

```bash
docker compose exec -T app node -e 'const u=new URL(process.env.DATABASE_URL);console.log({host:u.hostname,porta:u.port||"3306",banco:u.pathname.slice(1)})'
```

Mostra somente host, porta e database do ambiente do container, sem usuário/senha. O comando não lê `.env.prod` automaticamente. O APK aponta para `https://api.uniflowabs.top`; alterar o banco do Docker local não altera o servidor remoto, salvo se DATABASE_URL desse container apontar explicitamente para ele. Confirmar o destino e backup antes de qualquer escrita.

### Equivalente Prisma de migrate:fresh --seed (destrutivo)

```bash
docker compose exec app sh -lc 'cd apps/backend && npx prisma migrate reset'
```

Somente para uma base de testes descartável com destino conferido. Apaga os dados do database alvo, reaplica as migrations e, no Prisma 6 deste projeto, chama o seed configurado. Exige a correção do adapter no seed descrita acima. Não usar `-T` ou `--force`: manter a confirmação interativa e conferir o banco mostrado antes de aceitar. Não apaga/recria o container MySQL inteiro, mas remove os dados da aplicação no database selecionado, incluindo usuários, unidades, agenda e financeiro; uploads em disco não são apagados e podem ficar órfãos. Recuperação dos dados anteriores exige backup. Não executado pelo agente.

Não existe refresh obrigatório para executar o seed: em base já migrada, o comando **Executar o seed** é suficiente após corrigir sua compatibilidade. Ele redefine o superadmin demonstrativo `milicofelix@gmail.com` para a senha `password` e cria outros dados demo; reservar essa conta ao operador, nunca distribuir acesso administrativo a todos os testers.

Para a exigência de teste fechado Google Play, APK instalado diretamente pelo link EAS não substitui a participação no teste fechado da Play Console. Distribuir o artefato apropriado (AAB para novos apps) pela faixa de teste exigida, conforme a conta. Referências: [requisitos de testes](https://support.google.com/googleplay/android-developer/answer/14151465), [faixas de teste](https://support.google.com/googleplay/android-developer/answer/9845334).

### Seed e reset no servidor, sem Docker

Usar somente depois de corrigir a compatibilidade do seed com o adapter `PrismaMariaDb` descrita acima. Requer Node.js 22+, repositório completo no diretório privado, Prisma CLI, ts-node e demais dependências do seed instaladas e Prisma Client atualizado. Um pacote de deploy contendo somente `dist/` e dependências de runtime pode não incluir seed/CLI/ts-node; não presumir disponibilidade nesses pacotes.

```bash
cd /home/rico4167/domains/uniflowabs.top/uniflow/apps/backend
```

O `.env.prod` usado abaixo fica na raiz privada `uniflow`, dois níveis acima. O CLI é resolvido das dependências locais com `require.resolve`, sem instalar/baixar automaticamente outra versão via npx. Variáveis já exportadas no terminal/painel têm prioridade sobre `--env-file`; conferir o destino efetivo antes de escrever.

```bash
node --env-file=../../.env.prod -e 'const u=new URL(process.env.DATABASE_URL);console.log({host:u.hostname,porta:u.port||"3306",banco:u.pathname.slice(1)})'
```

Consulta apenas host/porta/database configurados, sem conexão ao banco e sem exibir senha. Não valida que a base está vazia ou que é descartável.

```bash
node --env-file=../../.env.prod "$(node -p 'require.resolve("prisma/build/index.js")')" db seed
```

Executa o seed existente, incluindo conta administrativa demonstrativa e dados demo. Não apaga previamente as tabelas, mas altera registros e redefine a senha do superadmin demonstrativo. O processo filho ts-node herda as variáveis carregadas pelo Node. Não executar enquanto o seed não estiver adaptado ao engine atual.

```bash
node --env-file=../../.env.prod "$(node -p 'require.resolve("prisma/build/index.js")')" migrate reset
```

**Destrutivo:** equivalente funcional ao migrate:fresh --seed no Prisma 6 configurado neste projeto. Apaga os dados da aplicação no database alvo, reaplica migrations e chama o seed. Manter confirmação interativa, sem `--force`; exige backup e autorização sobre a base exata. A existência de `.env.prod` não torna o banco descartável: usar somente se confirmado que ele contém exclusivamente testes. Não executar durante atendimento de usuários; colocar a aplicação em manutenção/parar workers pelo supervisor do provedor antes. Não fornecer um restart genérico sem conhecer o supervisor instalado. O seed pode falhar após o reset e deixar a base sem os usuários esperados: corrigir o adapter primeiro. Recuperação depende de backup; arquivos de mídia não são removidos por esse comando.

Nenhum dos comandos desta subseção foi executado pelo agente. Para atualizar estrutura sem zerar dados, usar o fluxo já catalogado `yarn prod:migrate`, na raiz privada do repositório.

### Sequencia apos migrations (sem reset)

Execute, nesta ordem, os comandos já documentados em **Aplicar migrations pendentes**, **Gerar o Prisma Client** e **Reiniciar depois de alterar o backend**.

### Sequencia apos atualizar o seed

Execute, nesta ordem, os comandos já documentados em **Executar o seed** e **Reiniciar depois de alterar o backend**.

## Execucao Direta Sem Docker

```bash
export DATABASE_URL='mysql://usuario:senha@host:3306/banco'
export JWT_SECRET='segredo-local-forte'
export SUPER_ADMIN_EMAILS='admin@exemplo.com'
yarn --cwd apps/backend dev
```

Inicia somente o backend no host. O projeto nao carrega automaticamente `apps/backend/.env`, por isso as variaveis precisam estar exportadas no terminal.

### Iniciar todos os workspaces diretamente

```bash
yarn dev
```

Executa o script `dev` do Turbo fora do Docker. Exige dependencias e variaveis de ambiente configuradas no host.

## Builds E Validacoes Sob Demanda

Execute esta secao somente quando a validacao correspondente for solicitada.

### Build completo do monorepo

```bash
yarn build
```

Executa os builds coordenados pelo Turbo.

### Build somente do backend dentro do container

```bash
docker compose exec -T app sh -lc 'cd apps/backend && yarn build'
```

Compila o NestJS e ajuda a identificar erros de TypeScript do backend.

### Lint do monorepo

```bash
yarn lint
```

Executa os linters declarados pelos workspaces.

### Formatar arquivos do monorepo

```bash
yarn format
```

Executa o Prettier nos arquivos TypeScript, TSX e Markdown. Esse comando modifica arquivos e somente deve ser usado quando solicitado.

### Testes do backend

```bash
yarn --cwd apps/backend test
```

Executa os testes Jest do backend.

### Testes do mobile

```bash
yarn --cwd apps/mobile test
```

Executa o Jest do aplicativo em modo de observacao conforme o script atual.

## Investigacao De Arquivos

### Listar arquivos rastreaveis por padrao

```bash
rg --files | rg 'PADRAO'
```

Localiza nomes de arquivos rapidamente sem alterar o projeto.

### Procurar texto no codigo

```bash
rg -n 'TEXTO_OU_EXPRESSAO' apps packages docs
```

Procura ocorrencias com numero da linha nos diretorios principais.

### Exibir parte de um arquivo

```bash
sed -n 'INICIO,FIMp' CAMINHO_DO_ARQUIVO
```

Mostra apenas o intervalo de linhas solicitado, sem editar o arquivo.

## Importacao De Clientes Por VCard

### Copiar o arquivo de contatos para o container

```bash
docker compose cp '/Users/adrianofreitas/Downloads/contacts.vcf' app:/tmp/ricosty-contacts.vcf
```

Copia o arquivo exportado pelo celular para uma area temporaria do container. Repita este comando caso o container seja recriado.

### Conferir a importacao sem alterar o banco

```bash
docker compose exec -T app sh -lc 'cd apps/backend && VCF_PATH=/tmp/ricosty-contacts.vcf npx ts-node prisma/seeds/importar-clientes-vcf.seed.ts'
```

Analisa o VCF, localiza `ricosty-emagracimento`, normaliza os telefones, remove duplicidades e apresenta o resumo. Sem `CONFIRMAR_IMPORTACAO=SIM`, nenhum cliente e gravado.

### Importar os clientes da Ricosty

```bash
docker compose exec -T app sh -lc 'cd apps/backend && VCF_PATH=/tmp/ricosty-contacts.vcf CONFIRMAR_IMPORTACAO=SIM npx ts-node prisma/seeds/importar-clientes-vcf.seed.ts'
```

Cria somente os usuarios inexistentes e vincula os contatos ao estabelecimento Ricosty. O processo e idempotente: novas execucoes reconhecem telefones e vinculos ja existentes.

## Mídia, Upload E Galeria

### Validar schema e atualizar o client de mídia

```bash
docker compose exec -T app sh -lc 'cd apps/backend && npx prisma validate && npx prisma generate'
```

Confere o schema Prisma e gera o client atualizado. Não aplica a migration no banco. Para isso, utilize `prisma migrate deploy` já documentado.

### Conferir os tipos do backend sem gerar build

```bash
docker compose exec -T app sh -lc 'cd apps/backend && npx tsc --noEmit --incremental false'
```

Verifica os tipos do backend, scripts e testes sem gerar arquivos compilados. Exige client Prisma e dependências atualizados.

### Instalar o processador de imagens do backend

```bash
docker compose exec -T app sh -lc 'yarn workspace backend add sharp@^0.34.5'
```

Adiciona o Sharp ao backend para identificar formatos, corrigir orientação, redimensionar fotos e gerar WebP sem metadados. Atualiza o manifesto e o lockfile do Yarn; nas demais máquinas use a instalação de dependências já documentada.

### Popular a galeria inicial

```bash
docker compose exec -T app sh -lc 'cd apps/backend && npx ts-node prisma/seeds/galeria-midias.seed.ts'
```

Depois de aplicar a migration e montar o volume `uniflow_midias`, gera versões processadas das 23 imagens iniciais e cadastra a galeria global. É idempotente e preserva mídias já registradas. Não modifica imagens de serviços, profissionais ou usuários existentes.

### Verificar processamento e permissões de mídia

```bash
docker compose exec -T app sh -lc 'cd apps/backend && yarn test midia.spec.ts --runInBand'
```

Testa processamento de fotos reais em diretório temporário e associação/permissões com repositório simulado. Não aplica migration nem popula o banco.

## Catálogo Inteligente De Serviços

### Executar os testes de aceite do catálogo

```bash
docker compose exec -T app sh -lc 'cd apps/backend && yarn test "servico-sugeridos.spec.ts|catalogo-admin.controller.spec.ts" --runInBand'
```

Executa testes isolados de importação, idempotência, limites, permissões, requisitos e auditoria. Utiliza repositórios simulados; não altera dados reais e não substitui a validação concorrente no MySQL.

### Conferir tipos da web sem gerar arquivos

```bash
docker compose exec -T app sh -lc 'cd apps/frontend && npx tsc --noEmit --incremental false'
```

Verifica os tipos de todo o frontend no container, sem gerar build nem cache incremental. Reporta também erros existentes fora da funcionalidade em validação.

### Testar autorização e auditoria da curadoria

```bash
docker compose exec -T app sh -lc 'cd apps/backend && yarn test catalogo-admin.controller.spec.ts --runInBand'
```

Executa os testes específicos que verificam acesso exclusivo de superadmin, validação operacional e gravação conjunta da sugestão e auditoria. Não aplica migrations nem popula o banco.

### Verificar os tipos do mobile sem gerar build

```bash
/Users/adrianofreitas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node apps/mobile/node_modules/typescript/bin/tsc --project apps/mobile/tsconfig.json --noEmit
```

Executado a partir da raiz do projeto. Usa o Node disponível no ambiente Codex para verificar os tipos do aplicativo sem gerar arquivos. Em um terminal com Node no PATH, pode usar `node` no lugar do caminho absoluto. Dependências do workspace precisam estar disponíveis para a verificação completa.

### Popular somente segmentos, especialidades e serviços sugeridos

```bash
docker compose exec -T app sh -lc 'cd apps/backend && npx ts-node prisma/seeds/catalogo-servicos.seed.ts'
```

Atualiza de forma idempotente o catálogo global usado para sugerir serviços. Não cria serviços nas unidades, não altera preços e não popula os dados demonstrativos do marketplace.

## Git

### Conferir alteracoes locais

```bash
git status --short
```

Lista arquivos alterados, adicionados e removidos em formato compacto.

### Conferir o diff

```bash
git diff
```

Mostra as mudancas ainda nao adicionadas ao stage.

### Conferir problemas de espacos no diff

```bash
git diff --check
```

Detecta espacos no fim das linhas e marcadores de conflito nas alteracoes locais sem executar testes ou build.

## Recuperacao De Acesso Do Responsavel Principal

### Restaurar o proprietario do estabelecimento Jay Black

```bash
docker compose exec -T app sh -lc 'cd apps/backend && node -e "const {PrismaClient}=require(\"@prisma/client\"); const p=new PrismaClient(); const permissoes=[\"EQUIPE_GERENCIAR\",\"ESCALAS_GERENCIAR\",\"RECURSOS_GERENCIAR\",\"AGENDA_GERENCIAR\",\"FINANCEIRO_VISUALIZAR\",\"FINANCEIRO_GERENCIAR\",\"FINANCEIRO_AUDITAR\",\"RELACIONAMENTO_VISUALIZAR\",\"RELACIONAMENTO_GERENCIAR\",\"CONFIGURACOES_GERENCIAR\"]; p.\$transaction([p.usuario.update({where:{email: \"jay.black@gmail.com\"},data:{papel:\"ESTABLISHMENT_OWNER\",membroEstabelecimento:true,estabelecimentoId:2}}),p.membroEquipe.update({where:{id:4},data:{papel:\"GESTOR\",ativo:true,permissoes}})]).then(()=>console.log(\"Acesso restaurado\")).finally(()=>p.\$disconnect());"'
```

Recupera especificamente a conta principal do estabelecimento `Jay Black` (ID 2), restaurando o papel de proprietario, o vinculo de gestor ativo e todas as permissoes. Use apenas para reparar esse mesmo cadastro; os IDs nao sao genericos.

### Criar commit pelo alias do projeto

```bash
git c "tipo: mensagem"
```

Cria um commit usando o alias local solicitado para o projeto. Exemplos de tipo: `feat`, `fix`, `chore`, `docs` e `refactor`.

### Instalar acesso nativo aos contatos no mobile

```bash
docker compose exec -T app sh -lc 'cd apps/mobile && npx expo install expo-contacts'
```

Instala a versao de `expo-contacts` compativel com o SDK Expo do aplicativo. Como o pacote altera configuracoes nativas de permissao, e necessario gerar um novo development build para validar fora do Expo Go.

## Banco UniFlow ABS

### Criar o database e conceder acesso ao usuario da aplicacao

```bash
docker exec infra-mysql-1 sh -lc 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS uniflow_abs CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; GRANT ALL PRIVILEGES ON uniflow_abs.* TO '\''barberflow'\''@'\''%'\''; FLUSH PRIVILEGES;"'
```

Cria o database `uniflow_abs` no MySQL compartilhado e permite que o usuario ja utilizado pelo backend acesse somente esse database. A senha administrativa e lida de dentro do container e nao e exibida no comando.

Depois de alterar `DATABASE_URL`, recrie o servico `app`, aplique as migrations e execute o seed usando os comandos ja documentados nas secoes Docker, Prisma e Seed.

## Galeria E Upload Mobile — Fase 3

### Instalar seletor de fotos e conversão na versão compatível com o Expo

```bash
docker compose exec -T app sh -lc 'cd apps/mobile && npx expo install expo-image-picker expo-image-manipulator'
```

Comando utilizado nesta fase. Mantém as dependências e o `yarn.lock` alinhados ao SDK do projeto.

### Verificar os tipos do mobile dentro do Docker

```bash
docker compose exec -T app sh -lc 'cd apps/mobile && npx tsc --noEmit --incremental false'
```

### Gerar um novo development build no computador (não executado automaticamente)

Android, com SDK Android/JDK e aparelho ou emulador configurados:

```bash
cd apps/mobile
npx expo run:android
```

iOS, no macOS com Xcode e simulador/aparelho configurados:

```bash
cd apps/mobile
npx expo run:ios
```

Execute apenas a opção da plataforma desejada. Esses comandos geram/configuram o projeto nativo e instalam o aplicativo de desenvolvimento. O Metro/API continuam usando a configuração de rede atual. Recriar o Docker ou ler novamente o QR não adiciona módulos nativos a um development build antigo. Para builds distribuídos por EAS, use o fluxo de build da equipe em vez desses comandos locais.

Esta fase não adiciona migration. Galeria vazia ou rota de mídia indisponível exige conferir a preparação da Fase 1 (migration, volume e seed), não recriar a unidade.

### Conferir configuração pública do Expo (somente leitura)

```bash
docker compose exec -T app sh -lc 'cd apps/mobile && npx expo config --type public --json'
```

Verifica o registro do plugin e das mensagens de permissão; não gera nem instala o aplicativo nativo.

### Testar processamento e associação de imagens

```bash
docker compose exec -T app sh -lc 'cd apps/backend && npx jest midia/midia.spec.ts --runInBand'
```

Inclui preservação de proporção em imagens de serviços, validação do upload e isolamento por conta/unidade. Não altera dados da base; os testes de arquivos usam uma pasta temporária própria.

### Validar regras compartilhadas de identidade — Fase 4

```bash
docker compose exec -T app sh -lc 'cd packages/core && npx tsup src/index.ts --dts'
docker compose exec -T app sh -lc 'cd apps/backend && npx jest midia --runInBand'
```

Gera os contratos compartilhados e executa os 15 testes de processamento, associação e identidade. As checagens TypeScript web/backend/mobile estão documentadas acima. Não há migration, nova dependência nativa ou necessidade de novo build nativo específico desta fase; recarregue o bundle atualizado. O build nativo com os módulos da Fase 3 continua necessário para câmera e upload do aparelho.

### Testar agenda sem preparação antes/depois

```bash
docker compose exec -T app sh -lc 'cd apps/backend && npx jest motor-agenda.calculador --runInBand'
```

Testa duração exata, múltiplos serviços, limites de funcionamento e deslocamento domiciliar sem criar reservas reais. Não há migration neste ajuste.

### Testar pausa somente quando explicitamente configurada

```bash
docker compose exec -T app sh -lc 'cd apps/backend && npx jest intervalo-opcional --runInBand'
```

Confere a inclusão do meio-dia na grade padrão, travessia entre manhã/tarde e respeito ao intervalo cadastrado. Não grava horários nem reservas na base.

### Galeria — Fase 5: testes e padronização do catálogo

Testes executados nesta fase, sem gravar na base:

```bash
docker compose exec -T app sh -lc 'cd apps/backend && npx jest "midia|catalogo-admin" --runInBand'
```

Comandos preparados para o operador executar após o seed da galeria; não foram executados na base nesta fase:

```bash
docker compose exec -T app sh -lc 'cd apps/backend && npx ts-node prisma/seeds/vincular-catalogo-midias.seed.ts'
```

O comando acima somente simula e conta candidatos. Após conferir o ambiente, fazer backup e revisar o resultado, aplicar as referências às sugestões globais:

```bash
docker compose exec -T app sh -lc 'cd apps/backend && npx ts-node prisma/seeds/vincular-catalogo-midias.seed.ts --aplicar'
```

Não altera serviços adotados pelas unidades nem imagens personalizadas. Backup, restauração, cache, limites e órfãs: `docs/OPERACAO_GALERIA_MIDIAS.md`. Não usar reset do banco ou apagar o volume de mídias.

### Testar opções repetidas na seleção de contatos mobile

```bash
docker compose exec -T app sh -lc 'cd apps/backend && npx jest contatos-opcoes-mobile --runInBand'
```

Executa testes puros do normalizador local do mobile, sem acessar contatos reais ou alterar o banco.

## Aceite De Mídia Web/Mobile — Fase 6

### Executar validações automatizadas

```bash
docker compose exec -T app sh -lc 'cd /workspace/barberFlowABS && yarn workspace @uniflowabs/core build'
docker compose exec -T app sh -lc 'cd /workspace/barberFlowABS && yarn workspace backend build'
docker compose exec -T app sh -lc 'cd /workspace/barberFlowABS && NODE_ENV=production yarn workspace frontend build'
docker compose exec -T app sh -lc 'cd /workspace/barberFlowABS && npx tsc --noEmit --pretty false -p apps/mobile/tsconfig.json'
docker compose exec -T app sh -lc 'cd /workspace/barberFlowABS/apps/backend && npx jest src/midia/midia.spec.ts src/midia/identidade.spec.ts src/midia/midia-curadoria.spec.ts src/midia/catalogo-midias-seed.spec.ts src/catalogo/catalogo-admin.controller.spec.ts src/catalogo/catalogo.policy.spec.ts src/catalogo/catalogo.prisma.spec.ts src/gestao/contatos-opcoes-mobile.spec.ts --runInBand'
```

O prefixo `NODE_ENV=production` vale somente para o build web. O serviço de desenvolvimento continua usando `NODE_ENV=development`. Os testes não gravam dados de negócio: arquivos temporários são removidos ao final e repositórios são simulados.

### Confirmar persistência do volume após recriar o serviço

Antes da recriação, anote a quantidade e o checksum:

```bash
docker compose exec -T app sh -lc 'find /var/lib/uniflow/midias -type f | sort | wc -l; find /var/lib/uniflow/midias -type f | sort | xargs sha256sum | sha256sum'
```

Recrie somente o serviço da aplicação, sem remover volumes:

```bash
docker compose up -d --force-recreate app
```

Quando web e backend voltarem, repita o primeiro comando. Quantidade e checksum devem permanecer idênticos. Nunca use `down -v`, `docker volume rm` ou reset do banco neste teste.

### Testes Isolados Do Fluxo Automático — Fase 5

```bash
docker compose exec -T app sh -lc 'cd apps/backend && yarn test "operacao-fluxo|notificacao-concorrencia|atendimento-aceite|fluxo-atendimento.service.spec|atendimento.worker.spec|orquestrador-atendimento.service.spec|retomar-automacao.service.spec" --runInBand'
```

Execução opcional pelo usuário, com dependências e core atualizados. Cobre configuração, tenant/permissões, reprocessamento, regras de transição, aviso, receita idempotente e prioridade de comissões com repositórios simulados. Não altera dados reais, não aplica migrations e não substitui a homologação de concorrência no MySQL ou o aceite em dois dispositivos. Não foi executado automaticamente.

### Testes Isolados De Campanhas Segmentadas — Etapa 10, Fase 4

```bash
docker compose exec -T app sh -lc 'cd apps/backend && yarn test relacionamento/campanhas/campanha.spec.ts --runInBand'
```

Execução opcional pelo usuário após atualizar dependências/client Prisma. Usa mocks para validação, permissões, segmentação, congelamento, consentimento, frequência, pausa e token de descadastro; não altera dados reais nem substitui teste de concorrência no MySQL. Não foi executado automaticamente.

A migration `20261015170000_add_segmented_campaigns` usa a rotina já catalogada de **Aplicar migrations pendentes**, **Gerar Prisma Client** e **Reiniciar depois de alterar o backend**, nessa ordem. Fazer backup antes de aplicar em banco com dados. Não executar reset ou seed para habilitar campanhas. Manter provedores simulados até configurar/homologar os canais reais.

## Etapa 10 — Fase 6: ativação e testes opcionais

A migration `20261015210000_add_relationship_governance` cria políticas/protocolos e marcadores de restrição/expurgo; não elimina dados nem ativa políticas. Fazer backup e usar as rotinas já catalogadas de **Aplicar migrations pendentes**, **Gerar Prisma Client** e **Reiniciar depois de alterar o backend**, nessa ordem. Não executar reset ou seed. As novas consultas exigem schema/client atualizados.

```bash
docker compose exec -T app sh -lc 'cd apps/backend && yarn test "governanca.spec.ts|campanha.spec.ts|fidelidade.spec.ts" --runInBand'
```

Testes isolados opcionais, não executados pelo agente. Não substituem conferência do SQL/concorrência no MySQL ou revisão jurídica. Expurgo/exclusão não possuem comando genérico pronto: exigem identidade, permissões e confirmações pelos contratos em [ETAPA_10_FASE_6_METRICAS_GOVERNANCA.md](ETAPA_10_FASE_6_METRICAS_GOVERNANCA.md). Nenhuma exportação, exclusão ou limpeza real foi executada automaticamente.

## Testes opcionais do logo da unidade

```bash
docker compose exec -T app sh -lc 'cd apps/backend && yarn test "logo-estabelecimento.spec.ts|midia.spec.ts" --runInBand'
```

Comando opcional para os testes isolados de modos de logo, titularidade, associação de mídia e armazenamento. Não executado pelo agente; não substitui conferência visual na web e em Android/iOS. Não aplica migrations.

## Testes opcionais da fundação e integração do tour do mapa

```bash
docker compose exec -T app sh -lc 'cd apps/backend && yarn test tour/tour-mapa.spec.ts --runInBand'
```

Executa os testes isolados do contrato/controlador compartilhado, persistência simulada, versionamento, registro de alvos mobile, interação de marcadores, coordenadas/projeção e fluxo de consentimento da localização. Requer o serviço `app` em execução e dependências existentes. Não aplica migrations, não acessa dados de clientes e não substitui homologação da sobreposição em Android/iOS. Comando não executado pelo agente. O tour real pode ser reaberto em Perfil → Ver tour do mapa novamente, para clientes/visitantes; a demonstração independente continua restrita a desenvolvimento. Roteiro manual em `docs/PLANO_TOUR_GUIADO_MAPA.md`, Fase 2.

## Limpezas Destrutivas

Comandos de remocao de `node_modules`, lockfiles, volumes ou dados nao ficam prontos para copiar nesta secao. A necessidade e o alvo devem ser diagnosticados primeiro para evitar apagar dependencias ou dados de outros projetos que compartilham a infraestrutura.

