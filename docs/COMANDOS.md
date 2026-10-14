# Comandos Do Projeto

Catalogo unico de comandos operacionais do UniFlow ABS. Execute-os a partir da raiz do monorepo, salvo quando a secao indicar outro diretorio.

Antes de usar um comando, leia a explicacao e confirme se ele apenas consulta informacoes ou se altera containers, dependencias ou banco de dados. Substitua valores como `SEU_IP`, `usuario`, `senha` e `banco` pelos dados do ambiente. Nunca versione segredos reais.

## Regra De Manutencao

- Todo comando novo sugerido durante a evolucao do projeto deve ser registrado neste arquivo.
- Antes de adicionar um comando, pesquise se ele ja existe aqui e evite duplicatas.
- Quando duas variantes tiverem finalidades diferentes, mantenha ambas e explique a diferenca.
- Comandos de teste, build, lint, migration, seed, instalacao ou restart somente devem ser executados quando solicitados explicitamente.

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

## Controlar O Container

### Reiniciar depois de alterar o backend

```bash
docker compose restart app
```

Reinicia o servico sem reconstruir a imagem. Atualmente o backend usa `nest start` sem `--watch`, portanto mudancas em controllers, services e repositories exigem esse restart para entrarem em vigor.

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

### Executar o seed

```bash
docker compose exec -T app sh -lc 'cd apps/backend && npx prisma db seed'
```

Cria ou atualiza os dados de demonstracao definidos em `apps/backend/prisma/seed.ts`. Isso inclui os 12 estabelecimentos multissegmento do Tatuape, 48 clientes e 240 atendimentos concluidos distribuidos entre 1 e 10 de outubro de 2026. O historico cobre barbearia, salao de beleza, manicure e pedicure, clinica de estetica, spa e estudios de beleza. Mesmo usando operacoes idempotentes, o seed altera dados e deve ser revisado antes da execucao.

### Sequencia apos migrations

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

## Limpezas Destrutivas


Comandos de remocao de `node_modules`, lockfiles, volumes ou dados nao ficam prontos para copiar nesta secao. A necessidade e o alvo devem ser diagnosticados primeiro para evitar apagar dependencias ou dados de outros projetos que compartilham a infraestrutura.

