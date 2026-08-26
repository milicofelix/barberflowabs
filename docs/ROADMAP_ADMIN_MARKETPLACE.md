# Roadmap Admin E Marketplace Publico - Barber Flow ABS

Este plano organiza a evolucao do Barber Flow ABS para um SaaS com dono do app, aprovacao de barbearias e uma area publica de descoberta por mapa.

## Objetivos

- Ter um usuario dono do app com acesso administrativo confiavel.
- Aprovar, reprovar, suspender e auditar cadastros de barbearias.
- Criar uma vitrine publica onde clientes encontrem barbearias proximas.
- Permitir busca por mapa, raio, status de funcionamento, servicos e reputacao.
- Manter o isolamento multi-tenant e evitar depender de ajustes manuais no banco.

## Fase A0 - Corrigir Dono Do App E Admin SaaS

Status: em andamento.

Objetivo: tornar o acesso admin previsivel, profissional e sem gambiarra de token antigo.

Checklist:

- [x] Manter `SUPER_ADMIN_EMAILS` como fallback por ambiente.
- [x] Fazer o frontend admin consultar o backend antes de negar acesso.
- [x] Renovar token automaticamente via `/auth/refresh` ao carregar sessao web.
- [x] Aceitar `papel` e `role` no frontend durante a transicao.
- [x] Ajustar seed para promover emails de `SUPER_ADMIN_EMAILS` para `SUPER_ADMIN`.
- [x] Buscar `papel` no repositorio de usuario do backend.
- [x] Criar endpoint de diagnostico admin autenticado:
  - e-mail logado
  - `papel`
  - `role`
  - `barbeiro`
  - se entrou por env ou por banco
- [x] Criar tela/box de diagnostico quando `/admin` for negado.
- [ ] Padronizar papeis finais:
  - `APP_OWNER`
  - `BARBERSHOP_OWNER`
  - `BARBER`
  - `CUSTOMER`
- [ ] Criar migration de normalizacao de papeis, preservando compatibilidade com `SUPER_ADMIN`.

Validacao manual:

- Rodar seed.
- Fazer logout/login.
- Abrir `/admin`.
- Conferir se o menu mostra `Admin SaaS`.
- Conferir se o endpoint admin responde sem depender de atualizar manualmente o banco.

## Fase A1 - Aprovacao De Cadastros De Barbearias

Status: pendente.

Objetivo: toda nova barbearia entra em analise antes de aparecer publicamente.

Checklist:

- [ ] Adicionar status de revisao da barbearia:
  - `PENDING_REVIEW`
  - `APPROVED`
  - `REJECTED`
  - `SUSPENDED`
- [ ] Atualizar onboarding para criar barbearia como `PENDING_REVIEW`.
- [ ] Criar campos de revisao:
  - `approvedAt`
  - `approvedById`
  - `rejectedAt`
  - `rejectedById`
  - `reviewReason`
- [ ] Criar endpoints admin:
  - `GET /saas/admin/barbearias/pendentes`
  - `PUT /saas/admin/barbearias/:id/aprovar`
  - `PUT /saas/admin/barbearias/:id/reprovar`
- [ ] Registrar auditoria em cada decisao.
- [ ] Atualizar painel admin com fila de aprovacao.
- [ ] Bloquear barbearias nao aprovadas da busca publica.

Validacao manual:

- Criar barbearia pelo onboarding.
- Conferir se ela aparece como pendente no admin.
- Aprovar.
- Conferir se aparece na area publica.
- Reprovar outra e conferir se nao aparece publicamente.

## Fase A2 - Perfil Publico Da Barbearia

Status: pendente.

Objetivo: cada barbearia aprovada deve ter uma pagina publica consultavel.

Checklist:

- [ ] Criar campos publicos da barbearia:
  - nome publico
  - descricao
  - imagem/banner
  - endereco completo
  - cidade
  - estado
  - bairro
  - latitude
  - longitude
  - aceita agendamento online
  - destaque
- [ ] Criar endpoint publico:
  - `GET /public/barbearias/:slug`
- [ ] Retornar servicos, profissionais e horarios publicos.
- [ ] Criar pagina web:
  - `/barbearias/[slug]`
- [ ] Exibir status operacional:
  - aberta agora
  - fechada
  - abre em breve
- [ ] Adicionar chamada para agendamento usando o tenant correto.

Validacao manual:

- Abrir uma barbearia pelo slug.
- Conferir servicos, horarios e profissionais.
- Clicar para agendar.
- Validar se o agendamento usa a barbearia correta.

## Fase A3 - Mapa Publico E Busca Por Proximidade

Status: pendente.

Objetivo: permitir que clientes encontrem barbearias proximas com raio e filtros.

Checklist:

- [ ] Criar endpoint publico:
  - `GET /public/barbearias`
- [ ] Suportar filtros:
  - `lat`
  - `lng`
  - `raioKm`
  - `q`
  - `cidade`
  - `estado`
  - `servico`
  - `abertaAgora`
  - `status`
- [ ] Calcular distancia aproximada por Haversine.
- [ ] Ordenar por proximidade quando `lat/lng` forem informados.
- [ ] Criar pagina publica:
  - `/barbearias`
- [ ] Criar alternancia lista/mapa.
- [ ] Solicitar localizacao do navegador com permissao do usuario.
- [ ] Permitir busca manual por cidade/bairro.
- [ ] Mostrar raio configuravel:
  - 2 km
  - 5 km
  - 10 km
  - 25 km
- [ ] Mostrar markers com:
  - nome
  - distancia
  - aberta/fechada
  - botao ver perfil
  - botao agendar
- [ ] Definir biblioteca de mapa:
  - Leaflet/OpenStreetMap para MVP sem chave paga
  - Google Maps/Mapbox como melhoria futura

Validacao manual:

- Abrir `/barbearias`.
- Permitir localizacao no browser.
- Alterar raio.
- Buscar por cidade.
- Clicar em um marker.
- Ir para perfil e agendar.

## Fase A4 - Gestao De Localizacao Pela Barbearia

Status: pendente.

Objetivo: permitir que o dono da barbearia mantenha dados publicos e localizacao.

Checklist:

- [ ] Criar aba `Perfil publico` em `/configuracoes`.
- [ ] Permitir editar endereco e coordenadas.
- [ ] Permitir marcar barbearia como visivel/invisivel publicamente.
- [ ] Criar campo de observacao para aprovacao.
- [ ] Quando dados criticos mudarem, voltar para `PENDING_REVIEW`.
- [ ] Validar campos obrigatorios para aparecer no mapa.

Validacao manual:

- Editar endereco.
- Salvar.
- Conferir se a barbearia volta para analise.
- Aprovar no admin.
- Conferir no mapa publico.

## Fase A5 - Qualidade, Reputacao E Destaques

Status: pendente.

Objetivo: melhorar ranking e confianca da busca publica.

Checklist:

- [ ] Criar avaliacao por atendimento concluido.
- [ ] Calcular media real por barbearia.
- [ ] Mostrar quantidade de avaliacoes.
- [ ] Criar regras de destaque administradas pelo dono do app.
- [ ] Permitir destaque manual no admin.
- [ ] Ordenar resultados por:
  - distancia
  - aberta agora
  - destaque
  - avaliacao
- [ ] Criar denuncia/revisao de perfil publico.

Validacao manual:

- Concluir atendimento.
- Registrar avaliacao.
- Conferir media no perfil e no mapa.
- Marcar barbearia como destaque no admin.

## Fase A6 - Operacao Comercial Do SaaS

Status: pendente.

Objetivo: fechar o ciclo comercial com aprovacao, billing e comunicacao.

Checklist:

- [ ] Enviar notificacao para o dono do app em novos cadastros.
- [ ] Criar tela de detalhes comerciais da barbearia.
- [ ] Criar notas internas admin.
- [ ] Criar status de lead/comercial:
  - novo
  - em contato
  - aprovado
  - recusado
  - convertido
- [ ] Integrar pagamento real.
- [ ] Bloquear recursos conforme inadimplencia real.

Validacao manual:

- Criar cadastro publico.
- Ver lead no admin.
- Atualizar status comercial.
- Aprovar.
- Associar plano.

## Sugestoes De Commits

```bash
git c "fix:normalizar acesso do dono do app"
git c "feat:adicionar aprovacao de barbearias"
git c "feat:criar perfil publico de barbearia"
git c "feat:criar busca publica por mapa"
git c "feat:adicionar gestao de localizacao publica"
git c "feat:adicionar reputacao de barbearias"
git c "feat:adicionar operacao comercial saas"
```
