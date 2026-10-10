# System Design - Barber Flow ABS

Este documento existe para orientar evolucoes do projeto sem quebrar o ambiente. Antes de qualquer fase nova, este arquivo deve ser consultado junto com `docs/ENGINEERING_GUIDELINES.md`, `docs/adr/0001-evolucao-multissegmento.md` e `docs/ROADMAP_MULTISSEGMENTO.md`. Os roadmaps `docs/ROADMAP_SAAS.md` e `docs/ROADMAP_ADMIN_MARKETPLACE.md` permanecem como historico e referencia do estado implementado.

## Principios De Evolucao

- Alteracoes devem ser pequenas, rastreaveis e validadas por contrato.
- Mudancas de banco exigem schema, migration, Prisma Client, seed e backend compatíveis.
- Mudancas de API exigem ajuste do frontend consumidor no mesmo ciclo.
- Seed deve ser idempotente: rodar duas vezes nao pode duplicar entidades principais.
- Dados demo nao podem vazar regras erradas de multi-tenant.
- O ambiente Docker local usa MySQL externo compartilhado; evitar comandos que dependam de criar banco shadow.
- Antes de concluir uma fase, validar pelo menos compilacao leve ou endpoint critico quando possivel.

## Arquitetura Atual

O projeto e um monorepo com Yarn Workspaces e Turborepo.

```text
barberFlowABS
├── apps
│   ├── backend   NestJS + Prisma + MySQL
│   ├── frontend  Next.js
│   └── mobile    Expo / React Native
├── packages
│   ├── core      dominio compartilhado
│   └── ui        pacote UI compartilhado
└── docs          roadmaps e decisoes tecnicas
```

## Servicos E Portas

| Porta | Servico | Uso |
| --- | --- | --- |
| `3000` | Frontend Next.js | Web principal |
| `4000` | Backend NestJS | API HTTP |
| `8081` | Expo / Metro web | App mobile em modo web |

O container principal e `barberflow_abs_app`. O banco MySQL nao e criado por este projeto; ele roda em outro container na rede externa `shared_net`.

## Banco De Dados

Banco alvo: MySQL.

`DATABASE_URL` padrao:

```text
mysql://barberflow:barberflow@infra-mysql-1:3306/barberflow_abs
```

Como o MySQL e compartilhado e o usuario pode nao ter permissao de criar databases, usar:

```bash
npx prisma migrate deploy
```

Evitar em ambiente Docker compartilhado:

```bash
npx prisma migrate dev
```

Motivo: `migrate dev` tenta criar shadow database e pode falhar com `P3014`.

## Ordem Segura Para Mudancas Com Banco

1. Alterar `apps/backend/prisma/schema.prisma`.
2. Criar migration SQL em `apps/backend/prisma/migrations`.
3. Ajustar backend usando casts temporarios quando o Prisma Client local ainda nao conhece relações novas.
4. Ajustar frontend que consome os novos campos.
5. Ajustar seed somente depois que schema e migration estiverem coerentes.
6. Informar no final que o usuario deve rodar `migrate deploy`, `prisma generate` e `restart`.

Checklist tecnico:

- `schema.prisma` tem relacoes nos dois lados.
- A migration cria indices e foreign keys esperadas.
- O codigo TypeScript nao depende de Prisma Client antigo sem cast.
- Endpoints novos aparecem nos logs do Nest apos restart.
- O frontend trata campo ausente com fallback.
- Seed novo usa `upsert`, `createMany(skipDuplicates)` ou checagem de existencia.

## Multi-Tenant

Entidade raiz de tenant: `Estabelecimento`.

Campos esperados nas entidades operacionais:

- `estabelecimentoId` em `Usuario`
- `estabelecimentoId` em `Profissional`
- `estabelecimentoId` em `Servico`
- `estabelecimentoId` em `Agendamento`
- `estabelecimentoId` em configuracoes, financeiro, relacionamento e avaliacoes

Regras:

- Rotas autenticadas de membro do estabelecimento/dono devem priorizar `usuario.estabelecimentoId`.
- Rotas autenticadas de cliente, como agendamento e historico do cliente, devem resolver a estabelecimento pelo tenant publico selecionado (`x-estabelecimento-slug`).
- Usuario `ESTABLISHMENT_MEMBER` dentro do fluxo publico de `/agendamento` atua como cliente e deve usar o tenant publico selecionado, nao a propria estabelecimento.
- Cliente logado sem estabelecimento selecionada deve ser conduzido ao marketplace publico antes de abrir formulario de agendamento.
- `x-estabelecimento-id` so deve ser enviado pelo frontend para usuarios operacionais da estabelecimento; cliente usa slug publico selecionado.
- `x-estabelecimento-slug` e `x-estabelecimento-id` ajudam na resolucao inicial, mas nao devem permitir que membro do estabelecimento/dono acesse dados de outra estabelecimento quando esta logado.
- Servicos, profissionais, agendamentos, clientes e financeiro devem sempre filtrar por `estabelecimentoId`.
- Nova estabelecimento criada pelo onboarding deve nascer sem servicos/profissionais copiados da estabelecimento padrao.
- `Usuario.estabelecimentoId` nao representa carteira de clientes no marketplace. Cliente pode pertencer a varias estabelecimentos pela tabela `ClienteEstabelecimento`.
- Ao concluir um agendamento, o usuario deve ser vinculado automaticamente como cliente da estabelecimento agendada.
- Um usuario `ESTABLISHMENT_MEMBER` tambem pode existir como cliente em outra estabelecimento pela tabela `ClienteEstabelecimento`; papel operacional nao deve impedir essa associacao.

## Horarios E Fuso

- Status publico de funcionamento deve calcular "agora" com fuso explicito `America/Sao_Paulo`.
- Nao usar `new Date().getHours()` diretamente para decidir `ABERTA` ou `FECHADA`; container ou host podem estar em UTC.
- O filtro `abertaAgora=true` de `GET /public/estabelecimentos` depende desse mesmo calculo.
- Horarios de agenda e horarios publicos precisam comparar dia da semana e minutos do dia no mesmo fuso.

## Papeis E Acesso

Estado atual:

- `SUPER_ADMIN`: dono do app/SaaS.
- `ESTABLISHMENT_MEMBER`: responsavel ou profissional da estabelecimento.
- `CUSTOMER`: cliente final.
- Campo legado `membro do estabelecimento` ainda existe por compatibilidade.

Regra de transicao:

- Backend deve aceitar `papel` e `role` enquanto a normalizacao final nao for feita.
- `SUPER_ADMIN_EMAILS` no ambiente pode promover usuario para super admin em tempo de request.
- `SUPER_ADMIN` e papel de plataforma, nao tenant de estabelecimento.
- `SUPER_ADMIN` nao deve carregar `estabelecimentoId`, `membro do estabelecimento`, agenda, gestao operacional, perfil publico ou cobranca de estabelecimento.
- Donos/responsaveis de estabelecimento usam `ESTABLISHMENT_MEMBER` com `membro do estabelecimento=true` e `estabelecimentoId` definido.
- Depois de alterar papel ou token, fazer logout/login ou chamar refresh.

## Planos E Pagamento

- Planos comerciais iniciais: `Mensal`, `Trimestral` e `Anual`.
- O campo tecnico atual `precoMensal` representa o valor cobrado no ciclo enquanto nao houver migration dedicada para renomear o campo.
- Mensal parte de R$ 49,90.
- Trimestral e Anual comunicam desconto e previsibilidade em relacao ao mensal.
- Pagamento inicial deve ser tratado como PIX.
- Enquanto nao houver gateway, troca de plano apenas atualiza a assinatura e o fim do periodo conforme o ciclo:
  - Mensal: 30 dias.
  - Trimestral: 90 dias.
  - Anual: 365 dias.

## Contratos Principais De API

Publico:

- `GET /public/estabelecimentos`
- `GET /public/estabelecimentos/:slug`
- `POST /public/estabelecimentos/:slug/denuncias`

Estabelecimento:

- `GET /estabelecimentos`
- `GET /estabelecimentos/:slug`
- `POST /estabelecimentos`
- `GET /estabelecimentos/minha/perfil-publico`
- `PUT /estabelecimentos/minha/perfil-publico`

Agenda:

- `GET /agenda/horarios/:data`
- `GET /agenda/configuracao/horarios`
- `PUT /agenda/configuracao/horarios`

Agendamentos:

- `POST /agendamentos`
- `GET /agendamentos`
- `POST /agendamentos/:id/avaliacao`
- `GET /agendamentos/ocupacao/:profissional/:data`
- `DELETE /agendamentos/:id`: cancela o horario do cliente, mantendo o registro com status `CANCELADO`.

Regras de agendamento:

- Nao pode existir mais de um agendamento ativo para a mesma estabelecimento, profissional e data/hora.
- Status considerados ativos para bloqueio de horario: `AGENDADO`, `CONFIRMADO` e `CHECKIN`.
- A criacao de agendamento deve serializar a reserva por profissional antes de gravar, evitando duplo clique ou duas requisicoes simultaneas no mesmo horario.

Admin SaaS:

- `GET /saas/admin/me`
- `GET /saas/admin/planos`
- `PUT /saas/admin/planos/:id`
- `GET /saas/admin/notificacoes`
- `GET /saas/admin/denuncias-perfil`
- `PUT /saas/admin/denuncias-perfil/:id`
- `GET /saas/admin/estabelecimentos`
- `GET /saas/admin/estabelecimentos/pendentes`
- `PUT /saas/admin/estabelecimentos/:id/status`
- `PUT /saas/admin/estabelecimentos/:id/destaque`
- `PUT /saas/admin/estabelecimentos/:id/comercial`
- `PUT /saas/admin/estabelecimentos/:id/aprovar`
- `PUT /saas/admin/estabelecimentos/:id/reprovar`
- `GET /saas/admin/auditoria`

Cobrança Da Estabelecimento:

- `GET /saas/cobranca`
- `PUT /saas/cobranca/plano`
- Compatibilidade legada:
  - `GET /saas/billing`
  - `PUT /saas/billing/plano`

## Regras Para Frontend

- Frontend deve usar `NEXT_PUBLIC_API_URL=http://localhost:4000`.
- Chamadas autenticadas devem passar `Authorization` e headers de tenant.
- Telas publicas podem usar `fetch` direto no endpoint `/public`.
- Campos opcionais vindos do backend devem usar fallback defensivo.
- Rotas novas do backend normalmente exigem `docker compose restart app`.
- Se a tela mostra “Nao foi possivel carregar”, checar primeiro `/ping` e depois o endpoint direto.

## Regras Para Seeds

- Seed deve ser idempotente.
- Nao usar `create` simples para entidade com risco de duplicacao.
- Usar `upsert` quando existir chave unica.
- Usar `createMany({ skipDuplicates: true })` quando a tabela tiver unique adequado.
- Se criar dados dependentes de migration nova, avisar que migration precisa estar aplicada antes do seed.
- Seeds demo devem criar dados por estabelecimento, nunca compartilhar profissionais/servicos entre tenants.

## Checklist Antes De Entregar Codigo

Para qualquer mudanca:

- Conferir `git diff`.
- Conferir imports removidos/adicionados.
- Verificar se rotas dinamicas do Nest nao engolem rotas especificas. Rotas como `minha/perfil-publico` devem vir antes de `:slug`.
- Confirmar se a mudanca precisa de migration.
- Confirmar se a mudanca precisa de `prisma generate`.
- Confirmar se a mudanca precisa de restart.
- Escrever passo a passo manual no final.
- Escrever sugestao de commit no formato `git c "tipo:mensagem"`.

Para mudancas com banco:

- Validar se `migrate deploy` e o comando correto.
- Evitar `migrate dev` no MySQL compartilhado.
- Conferir se o Prisma Client pode estar desatualizado.
- Evitar quebrar compilacao por tipagem gerada antiga.

Para mudancas publicas:

- Testar ou orientar teste de `/public/estabelecimentos`.
- Testar ou orientar teste de `/estabelecimentos`.
- Verificar se estabelecimento precisa estar `APPROVED`, `ACTIVE/TRIAL` e com coordenadas para aparecer.

## Diagnostico Rapido

Backend parece fora:

```bash
docker compose ps
docker compose logs --tail=160 app
curl -sS -i http://localhost:4000/ping
```

API publica de estabelecimentos:

```bash
curl -sS -i "http://localhost:4000/public/estabelecimentos?cidade=Sao%20Paulo&raioKm=25"
```

Alias publico canonico para novos consumidores:

```bash
curl -sS -i "http://localhost:4000/public/estabelecimentos?cidade=Sao%20Paulo&raioKm=25"
curl -sS -i "http://localhost:4000/public/estabelecimentos/barber-flow-abs"
```

Rotas novas nao aparecem:

```bash
docker compose restart app
docker compose logs --tail=180 app
```

Migration em MySQL compartilhado:

```bash
docker compose exec -T app sh -lc 'cd apps/backend && npx prisma migrate deploy'
docker compose exec -T app sh -lc 'cd apps/backend && npx prisma generate'
docker compose restart app
```

Seed:

```bash
docker compose exec -T app sh -lc 'cd apps/backend && npx prisma db seed'
docker compose restart app
```

## Validacao Manual Padrao No Browser

1. Abrir frontend:

```text
http://localhost:3000
```

2. Validar backend:

```text
http://localhost:4000/ping
```

3. Validar busca publica:

```text
http://localhost:3000/estabelecimentos
```

4. Validar mapa:

```text
http://localhost:3000/estabelecimentos
```

Entrar na aba `Mapa`, permitir localizacao e usar raio `25 km`.

5. Validar admin:

```text
http://localhost:3000/admin
```

6. Validar configuracoes da estabelecimento:

```text
http://localhost:3000/configuracoes
```

7. Validar gestao:

```text
http://localhost:3000/gestao
```

## Riscos Conhecidos

- `nest start` nao roda em watch real para algumas mudancas de rota; restart pode ser necessario.
- `migrate dev` pode falhar por falta de permissao para shadow database.
- Prisma Client desatualizado pode quebrar TypeScript apos schema novo.
- Expo pode mostrar warnings de versao sem impedir backend/frontend.
- Frontend pode manter token antigo; logout/login resolve alteracoes de papel.
- Endpoint publico nao retorna estabelecimentos pendentes, reprovadas, suspensas ou canceladas.
- Estabelecimentos sem coordenadas aparecem na lista, mas nao aparecem como marcador real no mapa.

## Regra De Ouro

Antes de avançar fase, responder mentalmente:

1. O que muda no banco?
2. O que muda no contrato da API?
3. Quem consome esse contrato?
4. Qual comando manual o usuario precisa rodar?
5. Qual teste de browser confirma que funcionou?

Se qualquer resposta estiver incerta, parar e inspecionar o codigo antes de editar.
