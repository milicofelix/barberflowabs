# Roadmap Admin E Marketplace Publico - Barber Flow ABS

Este plano organiza a evolucao do Barber Flow ABS para um SaaS com dono do app, aprovacao de barbearias e uma area publica de descoberta por mapa.

## Objetivos

- Ter um usuario dono do app com acesso administrativo confiavel.
- Aprovar, reprovar, suspender e auditar cadastros de barbearias.
- Criar uma vitrine publica onde clientes encontrem barbearias proximas.
- Permitir busca por mapa, raio, status de funcionamento, servicos e reputacao.
- Manter o isolamento multi-tenant e evitar depender de ajustes manuais no banco.

## Fase A0 - Corrigir Dono Do App E Admin SaaS

Status: concluida para o MVP.

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

Status: em andamento.

Objetivo: toda nova barbearia entra em analise antes de aparecer publicamente.

Checklist:

- [x] Adicionar status de revisao da barbearia:
  - `PENDING_REVIEW`
  - `APPROVED`
  - `REJECTED`
  - `SUSPENDED`
- [x] Atualizar onboarding para criar barbearia como `PENDING_REVIEW`.
- [x] Criar campos de revisao:
  - `approvedAt`
  - `approvedById`
  - `rejectedAt`
  - `rejectedById`
  - `reviewReason`
- [x] Criar endpoints admin:
  - `GET /saas/admin/barbearias/pendentes`
  - `PUT /saas/admin/barbearias/:id/aprovar`
  - `PUT /saas/admin/barbearias/:id/reprovar`
- [x] Registrar auditoria em cada decisao.
- [x] Atualizar painel admin com fila de aprovacao.
- [x] Garantir que barbearias novas iniciem sem servicos/profissionais demo.
- [x] Priorizar `barbeariaId` da sessao nas chamadas logadas de servicos/profissionais.
- [x] Bloquear barbearias nao aprovadas da busca publica quando os endpoints publicos forem criados.

Validacao manual:

- Criar barbearia pelo onboarding.
- Conferir se ela aparece como pendente no admin.
- Aprovar.
- Conferir se aparece na area publica.
- Reprovar outra e conferir se nao aparece publicamente.

## Fase A2 - Perfil Publico Da Barbearia

Status: concluida para o MVP.

Objetivo: cada barbearia aprovada deve ter uma pagina publica consultavel.

Checklist:

- [x] Criar campos publicos da barbearia:
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
- [x] Criar endpoint publico:
  - `GET /public/barbearias/:slug`
- [x] Retornar servicos, profissionais e horarios publicos.
- [x] Criar pagina web:
  - `/barbearias/[slug]`
- [x] Exibir status operacional:
  - aberta agora
  - fechada
  - abre em breve
- [x] Adicionar chamada para agendamento usando o slug escolhido na URL.

Melhorias futuras:

- Fazer o fluxo autenticado de agendamento consumir o slug da URL como tenant selecionado.
- Permitir a barbearia editar seus dados publicos pela tela de configuracoes.
- Adicionar imagens reais por barbearia.
- Melhorar status operacional considerando fuso horario da barbearia.

Validacao manual:

- Abrir uma barbearia pelo slug.
- Conferir servicos, horarios e profissionais.
- Clicar para agendar.
- Validar se o agendamento usa a barbearia correta.

## Fase A3 - Mapa Publico E Busca Por Proximidade

Status: concluida para o MVP.

Objetivo: permitir que clientes encontrem barbearias proximas com raio e filtros.

Checklist:

- [x] Criar endpoint publico:
  - `GET /public/barbearias`
- [x] Suportar filtros:
  - `lat`
  - `lng`
  - `raioKm`
  - `q`
  - `cidade`
  - `estado`
  - `servico`
  - `abertaAgora`
  - `status`
- [x] Calcular distancia aproximada por Haversine.
- [x] Ordenar por proximidade quando `lat/lng` forem informados.
- [x] Criar pagina publica:
  - `/barbearias`
- [x] Criar alternancia lista/mapa.
- [x] Solicitar localizacao do navegador com permissao do usuario.
- [x] Permitir busca manual por cidade/bairro.
- [x] Mostrar raio configuravel:
  - 2 km
  - 5 km
  - 10 km
  - 25 km
- [x] Mostrar markers com:
  - nome
  - distancia
  - aberta/fechada
  - botao ver perfil
  - botao agendar
- [x] Definir estrategia de mapa:
  - visualizacao interna para MVP, sem chave paga e sem dependencia nova
  - Leaflet/OpenStreetMap como melhoria futura
  - Google Maps/Mapbox como alternativa futura

Observacao: o MVP usa uma visualizacao propria de mapa/lista sem biblioteca externa para evitar dependencia de chave paga e instalacao adicional. A integracao Leaflet/OpenStreetMap fica como melhoria tecnica da proxima iteracao, quando as coordenadas reais estiverem editaveis pela barbearia.

Validacao manual:

- Abrir `/barbearias`.
- Permitir localizacao no browser.
- Alterar raio.
- Buscar por cidade.
- Clicar em um marker.
- Ir para perfil e agendar.

## Fase A4 - Gestao De Localizacao Pela Barbearia

Status: concluida para o MVP.

Objetivo: permitir que o dono da barbearia mantenha dados publicos e localizacao.

Checklist:

- [x] Criar aba `Perfil publico` em `/configuracoes`.
- [x] Permitir editar endereco e coordenadas.
- [x] Permitir controlar agendamento online no perfil publico.
- [x] Criar campo de observacao para aprovacao.
- [x] Quando dados criticos mudarem, voltar para `PENDING_REVIEW`.
- [x] Validar campos obrigatorios para aparecer no mapa.

Observacao: no MVP, a visibilidade publica continua governada pelo `reviewStatus`. Ao alterar dados criticos, a barbearia volta para revisao e sai dos endpoints publicos ate nova aprovacao. Um campo dedicado de visibilidade pode entrar numa evolucao posterior de schema.

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
