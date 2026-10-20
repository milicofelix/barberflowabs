# Roadmap SaaS - Barber Flow ABS

Este roadmap consolida o plano para transformar o projeto atual em um SaaS multi-estabelecimento. Ele foi baseado no documento de avaliacao arquitetural enviado como referencia e ajustado para as decisoes atuais do projeto.

## Decisoes Do Projeto

- Banco de dados alvo: MySQL.
- MySQL roda em servico externo compartilhado, na rede Docker `shared_net`.
- O `docker-compose.yml` deste projeto deve apontar para o container MySQL externo, sem criar um MySQL local.
- Nome publico do produto: `Barber Flow ABS`.
- Slug padrao de desenvolvimento: `barber-flow-abs`.
- Planos comerciais iniciais: `Mensal`, `Trimestral` e `Anual`.
- Mensal a partir de R$ 49,90.
- Pagamento inicial dos planos: PIX.
- Planos Trimestral e Anual devem comunicar vantagem por desconto/previsibilidade em relacao ao mensal.
- Os pacotes tecnicos foram canonicalizados como `@uniflowabs/core` e `@uniflowabs/ui` na Etapa 7.
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
- Entidades iniciais de SaaS: `Estabelecimento` e `Unidade`.
- Dados principais vinculados a `estabelecimentoId`.
- Resolucao inicial de tenant por headers:
  - `x-estabelecimento-slug`
  - `x-estabelecimento-id`

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
- Criadas entidades `Estabelecimento` e `Unidade`.
- `Usuario`, `Profissional`, `Servico` e `Agendamento` possuem `estabelecimentoId`.
- Criados indices e unicidades por estabelecimento onde aplicavel.
- Seed/base local aponta para `Barber Flow ABS`.

Pendente:

- Criar entidade `Cliente` separada de `Usuario`, se o dominio exigir.
- Criar entidade de plano/assinatura.

## Fase 2 - SaaS E Multi-Tenant

Status: concluida para o MVP SaaS.

Objetivo: garantir isolamento por estabelecimento.

Concluido:

- Criado `TenantService`.
- Suporte a tenant via `x-estabelecimento-slug` e `x-estabelecimento-id`.
- Rotas `servicos` e `profissionais` filtram por estabelecimento.
- Cadastro de usuario usa o estabelecimento resolvido no request.
- Agendamentos usam o estabelecimento do usuario autenticado.
- Criadas rotas iniciais:
  - `GET /estabelecimentos`
  - `GET /estabelecimentos/:slug`
  - `POST /estabelecimentos`

Pendente:

- Criar testes automatizados garantindo que Estabelecimento A nao acessa dados da Estabelecimento B.
- Criar middleware/interceptor global de tenant, se fizer sentido para reduzir repeticao.
- Criar painel para selecionar/gerenciar estabelecimento e unidades.
- Definir estrategia futura de subdominio/domino por estabelecimento.

## Fase 3 - Seguranca E Contratos De API

Status: concluida para o MVP SaaS.

Objetivo: preparar a API para uso real em producao.

Concluido:

- Criados DTOs iniciais para entrada:
  - `RegistrarUsuarioDto`
  - `LoginDto`
  - `CriarAgendamentoDto`
  - `CriarEstabelecimentoDto`
- Criada validacao manual inicial para:
  - registro
  - login
  - criacao de estabelecimento
  - criacao/consulta/exclusao de agendamento
- Payload do JWT deixou de assinar o objeto inteiro do usuario e passou a usar campos explicitos:
  - `sub`
  - `id`
  - `nome`
  - `email`
  - `estabelecimentoId`
  - `membro do estabelecimento`
- Web e mobile leem `estabelecimentoId` do token.
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
  - `ESTABLISHMENT_MEMBER`
  - `CUSTOMER`

Melhorias futuras:

- Trocar a validacao interna por `class-validator` e `class-transformer` quando a fase de normalizacao de dependencias for executada.
- Ativar `ValidationPipe` global com `whitelist`, `transform` e `forbidNonWhitelisted`.
- Evoluir refresh token para persistencia, rotacao e revogacao em banco.
- Trocar definitivamente `membro do estabelecimento: boolean` por RBAC completo no banco.
- Substituir rate limit em memoria por estrategia distribuida com Redis antes de producao multi-instancia.

## Fase 4 - Agenda Profissional

Status: concluida para o MVP SaaS.

Objetivo: transformar agenda simples em agenda operacional de estabelecimento.

Concluido:

- Criada tabela `horarios_funcionamento`.
- Criada tabela `bloqueios_agenda`.
- Seed/migration criam horario padrao do estabelecimento de segunda a sabado:
  - `08:00` a `21:00`
  - intervalo de `12:00` a `13:00`
- Criada antecedencia minima configuravel por estabelecimento, com padrao de `30` minutos.
- Criado endpoint autenticado:
  - `GET /agenda/horarios/:data`
- Criados endpoints administrativos para configuracao:
  - `GET /agenda/configuracao/horarios`
  - `PUT /agenda/configuracao/horarios`
- Disponibilidade respeita:
  - estabelecimento do usuario autenticado
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

Status: concluida para o MVP SaaS.

Objetivo: entregar valor para donos e equipes.

Concluido:

- Criado CRUD backend multi-tenant de profissionais:
  - `GET /profissionais`
  - `POST /profissionais`
  - `PUT /profissionais/:id`
  - `DELETE /profissionais/:id`
- Criado CRUD backend multi-tenant de servicos:
  - `GET /servicos`
  - `POST /servicos`
  - `PUT /servicos/:id`
  - `DELETE /servicos/:id`
- Rotas de escrita protegidas para usuarios membro do estabelecimentos.
- Frontend e mobile passaram a carregar servicos/profissionais da API.
- Criada tela web inicial de gestao:
  - `/gestao`
- Menu web mostra `Gestao` para usuarios membro do estabelecimentos.
- Validado fluxo de criar, editar e excluir registros temporarios via API.
- Criados campos operacionais em agendamentos:
  - `status`
  - `valorTotal`
  - `createdAt`
  - `updatedAt`
- Criada tabela `lancamentos_financeiros`.
- Criado modulo backend de gestao com endpoints autenticados:
  - `GET /gestao/dashboard`
  - `GET /gestao/clientes`
  - `POST /gestao/clientes`
  - `PUT /gestao/clientes/:id`
  - `DELETE /gestao/clientes/:id`
  - `GET /gestao/clientes/:id/historico`
  - `GET /gestao/agendamentos`
  - `PUT /gestao/agendamentos/:id/status`
  - `GET /gestao/financeiro`
  - `POST /gestao/financeiro`
  - `DELETE /gestao/financeiro/:id`
  - `GET /gestao/relatorios`
- Tela `/gestao` ampliada com abas:
  - Dashboard
  - Agenda
  - Clientes
  - Caixa
  - Relatorios
  - Servicos
  - Profissionais
- Atendimento/check-in implementado por status do agendamento:
  - `AGENDADO`
  - `CONFIRMADO`
  - `CHECKIN`
  - `CONCLUIDO`
  - `CANCELADO`
  - `NO_SHOW`
- Caixa inicial permite registrar receitas e despesas.
- Relatorios iniciais calculam receitas, despesas, saldo, comissoes e servicos vendidos.
- Historico do cliente mostra seus agendamentos por estabelecimento.

Melhorias futuras:

- Criar entidade `Cliente` separada de `Usuario`, se o dominio exigir dados comerciais mais ricos.
- Parametrizar percentual de comissao por profissional/servico.
- Baixar comissoes e fechar caixa por periodo.
- Criar exportacao CSV/PDF dos relatorios.
- Adicionar testes automatizados para todos os endpoints de gestao.

## Fase 6 - Experiencia SaaS

Status: concluida para o MVP SaaS.

Objetivo: transformar o produto em plataforma comercializavel.

Concluido:

- Criados modelos SaaS no Prisma:
  - `PlanoAssinatura`
  - `AssinaturaEstabelecimento`
  - `LogAuditoria`
- `Estabelecimento` passou a ter:
  - `status`
  - `trialEndsAt`
- `Usuario` passou a ter `papel`, preservando `membro do estabelecimento` para compatibilidade.
- Payload de sessao suporta:
  - `SUPER_ADMIN`
  - `ESTABLISHMENT_MEMBER`
  - `CUSTOMER`
- Criado onboarding publico:
  - `GET /saas/planos`
  - `POST /saas/onboarding`
- Onboarding cria:
  - estabelecimento
  - unidade matriz
  - assinatura em trial
  - usuario dono/membro do estabelecimento
  - log de auditoria
- Criada area de cobranca:
  - `GET /saas/cobranca`
  - `PUT /saas/cobranca/plano`
  - aliases legados mantidos em `/saas/billing`
- Criada area Super Admin:
  - `GET /saas/admin/planos`
  - `PUT /saas/admin/planos/:id`
  - `GET /saas/admin/estabelecimentos`
  - `PUT /saas/admin/estabelecimentos/:id/status`
  - `GET /saas/admin/auditoria`
- Frontend criado:
  - `/onboarding`
  - `/cobranca`
  - `/admin`
- Menu web exibe Cobranca para responsaveis de estabelecimento e Admin SaaS para super admins.
- Super admin foi separado do tenant operacional:
  - sem `estabelecimentoId` no token
  - sem acesso a agendamento, gestao, perfil publico, agenda e cobranca de estabelecimento

Melhorias futuras:

- Integrar gateway real de pagamento.
- Criar checkout hospedado e webhooks de assinatura.
- Bloquear recursos automaticamente conforme limites do plano.
- Criar convite de equipe.
- Criar painel de troca de dominio/subdominio por estabelecimento.
- Expandir auditoria para todas as acoes sensiveis.

## Fase 7 - Relacionamento E Inteligencia

Status: concluida para o MVP SaaS.

Objetivo: criar diferenciais competitivos.

Concluido:

- Adicionado campo opcional de data de nascimento no cadastro de clientes.
- Criada tabela de lembretes de relacionamento:
  - cliente opcional
  - tipo
  - canal
  - status
  - mensagem
  - data prevista
  - data de envio manual
- Criado endpoint autenticado:
  - `GET /gestao/relacionamento`
- Criados endpoints de lembrete:
  - `POST /gestao/relacionamento/lembretes`
  - `PUT /gestao/relacionamento/lembretes/:id/status`
- Painel de gestao ganhou aba `Relacionamento`.
- Relacionamento mostra:
  - total de clientes
  - clientes atendidos
  - clientes recorrentes
  - taxa de retorno
  - clientes sem retorno ha mais de 45 dias
  - aniversariantes dos proximos 30 dias
  - agendamentos das proximas 48 horas ainda pendentes de confirmacao
  - lembretes pendentes/agendados
  - sugestoes iniciais de campanha
- Lembretes podem ser criados manualmente e marcados como enviados ou cancelados.

Melhorias futuras:

- Integrar WhatsApp real via provedor externo.
- Criar fila de envio e worker para disparos automaticos.
- Criar confirmacao automatica com link unico.
- Criar programa de fidelidade com pontuacao/recompensas.
- Evoluir previsao de demanda com historico por dia/horario/profissional.
- Criar campanhas segmentadas com templates.
- Registrar logs de auditoria para disparos e alteracoes de lembrete.

## Fase 8 - Governanca De Plano E Limites

Status: concluida para o MVP SaaS.

Objetivo: fazer os planos deixarem de ser apenas informativos e começarem a controlar uso da plataforma.

Concluido:

- Criado servico backend de limites de plano.
- Cobranca passou a retornar objeto estruturado de uso:
  - profissionais
  - unidades
  - servicos
  - percentual de uso
  - indicadores de limite atingido
- Super Admin passou a receber a mesma visao de limites por estabelecimento.
- Criacao de servicos respeita `limiteServicos`.
- Criacao de profissionais respeita `limiteUsuarios`, usado no MVP como limite de equipe/profissionais.
- Estabelecimentos com status `PAST_DUE`, `SUSPENDED` ou `CANCELED` ficam impedidas de:
  - criar agendamentos
  - criar/editar/excluir servicos
  - criar/editar/excluir profissionais
- Tela de Cobranca mostra barras de uso e alerta de limite.
- Tela de Admin SaaS mostra uso dos limites por estabelecimento.

Melhorias futuras:

- Separar formalmente `limiteUsuarios` de `limiteProfissionais`.
- Criar entidade de membros/equipe com convites e papeis.
- Aplicar limites para unidades quando existir CRUD de unidades.
- Aplicar feature flags por recurso do plano.
- Integrar checkout, webhooks e status de assinatura com gateway real.
- Criar telas de upgrade contextual quando um limite for atingido.

## Proximas Fases

O detalhamento do dono do app, aprovacao de estabelecimentos e marketplace publico com mapa esta em:

- `docs/ROADMAP_ADMIN_MARKETPLACE.md`

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

4. Validar estabelecimento padrao no browser:

```text
http://localhost:4000/estabelecimentos/barber-flow-abs
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
git c "feat: iniciar multiempresa por estabelecimento"
git c "feat: adicionar validacao de entrada na api"
git c "feat: configurar agenda profissional"
git c "feat: adicionar gestao operacional"
git c "feat: adicionar onboarding saas"
git c "feat: adicionar relacionamento e inteligencia"
git c "feat: aplicar limites dos planos saas"
```
