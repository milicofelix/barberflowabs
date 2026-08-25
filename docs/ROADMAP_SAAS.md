# Roadmap SaaS - Barber Flow ABS

Este roadmap consolida o plano para transformar o projeto atual em um SaaS multi-barbearia. Ele foi baseado no documento de avaliacao arquitetural enviado como referencia e ajustado para as decisoes atuais do projeto.

## Decisoes Do Projeto

- Banco de dados alvo: MySQL.
- MySQL roda em servico externo compartilhado, na rede Docker `shared_net`.
- O `docker-compose.yml` deste projeto deve apontar para o container MySQL externo, sem criar um MySQL local.
- Nome publico do produto: `Barber Flow ABS`.
- Slug padrao de desenvolvimento: `barber-flow-abs`.
- Pacotes tecnicos `@barbabrutal/core` e `@barbabrutal/ui` devem ser preservados ate haver uma fase propria de migracao tecnica, para evitar quebra dos workspaces.
- Gerenciador de pacotes preferencial: Yarn.
- Portas de desenvolvimento:
  - `3000`: frontend Next.js.
  - `4000`: backend NestJS.
  - `8081`: mobile/web Expo.

## Estado Atual

O projeto ja possui uma base forte:

- Monorepo com Turborepo e Yarn Workspaces.
- Frontend em Next.js.
- Backend em NestJS.
- Mobile em Expo/React Native.
- Dominio compartilhado em `packages/core`.
- Autenticacao com JWT e bcrypt.
- Agenda baseada em slots de 15 minutos.
- Agenda profissional com horarios de funcionamento e bloqueios.
- Prisma configurado para MySQL.
- Entidades iniciais de SaaS: `Barbearia` e `Unidade`.
- Dados principais vinculados a `barbeariaId`.
- Resolucao inicial de tenant por headers:
  - `x-barbearia-slug`
  - `x-barbearia-id`

## Fase 0 - Fundacao Tecnica

Status: parcialmente concluida.

Objetivo: estabilizar o ambiente antes de crescer funcionalidades.

Concluido:

- Ambiente Docker voltou a funcionar com as portas `3000`, `4000` e `8081`.
- Banco foi migrado de SQLite para MySQL.
- Projeto passou a usar MySQL externo na rede `shared_net`.
- Branding publico principal foi ajustado para `Barber Flow ABS`.
- Corrigido problema visual da tela de login do app web na porta `8081`.
- Corrigido erro de Tailwind relacionado a `border-border`.

Pendente:

- Remover `package-lock.json` e padronizar totalmente em Yarn.
- Revisar versoes de Expo, React, React Native e tipos.
- Corrigir typecheck do mobile, atualmente afetado por `unmountOnBlur`.
- Fazer varredura final de textos/imagens antigas sem alterar nomes tecnicos de pacotes.
- Documentar comandos oficiais de desenvolvimento.

## Fase 1 - Banco MySQL E Modelagem Base

Status: concluida como base inicial.

Objetivo: preparar o banco para SaaS.

Concluido:

- Prisma usa `provider = "mysql"`.
- `Servico.preco` usa `Decimal(10, 2)`.
- Criadas entidades `Barbearia` e `Unidade`.
- `Usuario`, `Profissional`, `Servico` e `Agendamento` possuem `barbeariaId`.
- Criados indices e unicidades por barbearia onde aplicavel.
- Seed/base local aponta para `Barber Flow ABS`.

Pendente:

- Criar entidade `Cliente` separada de `Usuario`, se o dominio exigir.
- Criar entidade de plano/assinatura.

## Fase 2 - SaaS E Multi-Tenant

Status: concluida para o MVP SaaS.

Objetivo: garantir isolamento por barbearia.

Concluido:

- Criado `TenantService`.
- Suporte a tenant via `x-barbearia-slug` e `x-barbearia-id`.
- Rotas `servicos` e `profissionais` filtram por barbearia.
- Cadastro de usuario usa a barbearia resolvida no request.
- Agendamentos usam a barbearia do usuario autenticado.
- Criadas rotas iniciais:
  - `GET /barbearias`
  - `GET /barbearias/:slug`
  - `POST /barbearias`

Pendente:

- Criar testes automatizados garantindo que Barbearia A nao acessa dados da Barbearia B.
- Criar middleware/interceptor global de tenant, se fizer sentido para reduzir repeticao.
- Criar painel para selecionar/gerenciar barbearia e unidades.
- Definir estrategia futura de subdominio/domino por barbearia.

## Fase 3 - Seguranca E Contratos De API

Status: concluida para o MVP SaaS.

Objetivo: preparar a API para uso real em producao.

Concluido:

- Criados DTOs iniciais para entrada:
  - `RegistrarUsuarioDto`
  - `LoginDto`
  - `CriarAgendamentoDto`
  - `CriarBarbeariaDto`
- Criada validacao manual inicial para:
  - registro
  - login
  - criacao de barbearia
  - criacao/consulta/exclusao de agendamento
- Payload do JWT deixou de assinar o objeto inteiro do usuario e passou a usar campos explicitos:
  - `sub`
  - `id`
  - `nome`
  - `email`
  - `barbeariaId`
  - `barbeiro`
- Web e mobile leem `barbeariaId` do token.
- Criados DTOs para:
  - `CriarServicoDto`
  - `CriarProfissionalDto`
- Criado endpoint compativel de renovacao de token:
  - `POST /auth/refresh`
- Criado rate limit simples em memoria para:
  - `POST /auth/login`
  - `POST /auth/registrar`
  - `POST /auth/refresh`
- Adicionado `role` derivado no JWT e no modelo compartilhado:
  - `BARBER`
  - `CUSTOMER`

Melhorias futuras:

- Trocar a validacao interna por `class-validator` e `class-transformer` quando a fase de normalizacao de dependencias for executada.
- Ativar `ValidationPipe` global com `whitelist`, `transform` e `forbidNonWhitelisted`.
- Evoluir refresh token para persistencia, rotacao e revogacao em banco.
- Trocar definitivamente `barbeiro: boolean` por RBAC completo no banco.
- Substituir rate limit em memoria por estrategia distribuida com Redis antes de producao multi-instancia.

## Fase 4 - Agenda Profissional

Status: concluida para o MVP SaaS.

Objetivo: transformar agenda simples em agenda operacional de barbearia.

Concluido:

- Criada tabela `horarios_funcionamento`.
- Criada tabela `bloqueios_agenda`.
- Seed/migration criam horario padrao da barbearia de segunda a sabado:
  - `08:00` a `21:00`
  - intervalo de `12:00` a `13:00`
- Criada antecedencia minima configuravel por barbearia, com padrao de `30` minutos.
- Criado endpoint autenticado:
  - `GET /agenda/horarios/:data`
- Criados endpoints administrativos para configuracao:
  - `GET /agenda/configuracao/horarios`
  - `PUT /agenda/configuracao/horarios`
- Disponibilidade respeita:
  - barbearia do usuario autenticado
  - unidade opcional
  - profissional opcional
  - bloqueios globais ou do profissional
  - horarios ja passados no dia atual
  - antecedencia minima para novos agendamentos
- Frontend e mobile consomem horarios disponiveis da API.
- Frontend possui tela inicial de configuracao em `/configuracoes`.
- Selecionar/agendar deixa de depender da regra fixa `8h-20h`.
- Mantido fallback para a grade antiga quando nao houver configuracao no banco.

Melhorias futuras:

- Criar CRUD de bloqueios, folgas, ferias e excecoes.
- Tratar feriados nacionais/municipais.
- Proteger concorrencia de agendamento com transacao/constraint.
- Criar regras de cancelamento.
- Criar fluxo de no-show.

## Fase 5 - Gestao Operacional

Status: pendente.

Objetivo: entregar valor para donos e equipes.

Itens:

- CRUD de clientes.
- CRUD de profissionais.
- CRUD de servicos.
- Dashboard operacional.
- Historico do cliente.
- Atendimento/check-in.
- Caixa.
- Despesas.
- Comissoes.
- Relatorios.

## Fase 6 - Experiencia SaaS

Status: pendente.

Objetivo: transformar o produto em plataforma comercializavel.

Itens:

- Onboarding de nova barbearia.
- Trial.
- Planos.
- Assinaturas.
- Limites por plano.
- Super Admin.
- Tela de billing.
- Auditoria de acoes sensiveis.

## Fase 7 - Relacionamento E Inteligencia

Status: pendente.

Objetivo: criar diferenciais competitivos.

Itens:

- Lembretes por WhatsApp.
- Confirmacao automatica de horario.
- Aniversariantes.
- Fidelidade.
- Metricas de retorno.
- Previsao de demanda.
- Sugestoes inteligentes para agenda e campanhas.

## Checklist De Validacao Manual

Use este checklist apos cada fase importante.

1. Subir o ambiente:

```bash
docker compose up -d app
```

2. Validar frontend no browser:

```text
http://localhost:3000
```

3. Validar backend no browser:

```text
http://localhost:4000/ping
```

4. Validar barbearia padrao no browser:

```text
http://localhost:4000/barbearias/barber-flow-abs
```

5. Validar mobile/web no browser:

```text
http://localhost:8081
```

6. Se algo parecer antigo/cacheado, fazer hard refresh:

```text
Mac: Cmd + Shift + R
Windows/Linux: Ctrl + Shift + R
```

7. Validar build do backend:

```bash
docker compose exec -T app sh -lc 'cd apps/backend && yarn build'
```

## Sugestoes De Commits Por Fase

```bash
git c "chore: documentar roadmap saas"
git c "chore: estabilizar ambiente docker"
git c "feat: preparar banco mysql para saas"
git c "feat: iniciar multiempresa por barbearia"
git c "feat: adicionar validacao de entrada na api"
git c "feat: configurar agenda profissional"
git c "feat: adicionar gestao operacional"
git c "feat: adicionar onboarding saas"
```
