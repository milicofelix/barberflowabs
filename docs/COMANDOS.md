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

## Limpezas Destrutivas

Comandos de remocao de `node_modules`, lockfiles, volumes ou dados nao ficam prontos para copiar nesta secao. A necessidade e o alvo devem ser diagnosticados primeiro para evitar apagar dependencias ou dados de outros projetos que compartilham a infraestrutura.

