# Roadmap Admin E Marketplace Publico - Barber Flow ABS

Este plano organiza a evolucao do Barber Flow ABS para um SaaS com dono do app, aprovacao de estabelecimentos e uma area publica de descoberta por mapa.

## Objetivos

- Ter um usuario dono do app com acesso administrativo confiavel.
- Aprovar, reprovar, suspender e auditar cadastros de estabelecimentos.
- Vender planos por ciclo: Mensal, Trimestral e Anual, inicialmente via PIX.
- Criar uma vitrine publica onde clientes encontrem estabelecimentos proximas.
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
  - `membro do estabelecimento`
  - se entrou por env ou por banco
- [x] Criar tela/box de diagnostico quando `/admin` for negado.
- [ ] Padronizar papeis finais:
  - `APP_OWNER`
  - `ESTABLISHMENT_OWNER`
  - `ESTABLISHMENT_MEMBER`
  - `CUSTOMER`
- [ ] Criar migration de normalizacao de papeis, preservando compatibilidade com `SUPER_ADMIN`.

Validacao manual:

- Rodar seed.
- Fazer logout/login.
- Abrir `/admin`.
- Conferir se o menu mostra `Admin SaaS`.
- Conferir se o endpoint admin responde sem depender de atualizar manualmente o banco.

## Fase A1 - Aprovacao De Cadastros De Estabelecimentos

Status: em andamento.

Objetivo: toda nova estabelecimento entra em analise antes de aparecer publicamente.

Checklist:

- [x] Adicionar status de revisao da estabelecimento:
  - `PENDING_REVIEW`
  - `APPROVED`
  - `REJECTED`
  - `SUSPENDED`
- [x] Atualizar onboarding para criar estabelecimento como `PENDING_REVIEW`.
- [x] Criar campos de revisao:
  - `approvedAt`
  - `approvedById`
  - `rejectedAt`
  - `rejectedById`
  - `reviewReason`
- [x] Criar endpoints admin:
  - `GET /saas/admin/estabelecimentos/pendentes`
  - `PUT /saas/admin/estabelecimentos/:id/aprovar`
  - `PUT /saas/admin/estabelecimentos/:id/reprovar`
- [x] Registrar auditoria em cada decisao.
- [x] Atualizar painel admin com fila de aprovacao.
- [x] Garantir que estabelecimentos novas iniciem sem servicos/profissionais demo.
- [x] Priorizar `estabelecimentoId` da sessao nas chamadas logadas de servicos/profissionais.
- [x] Bloquear estabelecimentos nao aprovadas da busca publica quando os endpoints publicos forem criados.

Validacao manual:

- Criar estabelecimento pelo onboarding.
- Conferir se ela aparece como pendente no admin.
- Aprovar.
- Conferir se aparece na area publica.
- Reprovar outra e conferir se nao aparece publicamente.

## Fase A2 - Perfil Publico Da Estabelecimento

Status: concluida para o MVP.

Objetivo: cada estabelecimento aprovada deve ter uma pagina publica consultavel.

Checklist:

- [x] Criar campos publicos da estabelecimento:
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
  - `GET /public/estabelecimentos/:slug`
- [x] Retornar servicos, profissionais e horarios publicos.
- [x] Criar pagina web:
  - `/estabelecimentos/[slug]`
- [x] Exibir status operacional:
  - aberta agora
  - fechada
  - abre em breve
- [x] Adicionar chamada para agendamento usando o slug escolhido na URL.
- [x] Fazer o fluxo autenticado de agendamento consumir o slug da URL como tenant selecionado.

Melhorias futuras:

- Permitir a estabelecimento editar seus dados publicos pela tela de configuracoes.
- Adicionar imagens reais por estabelecimento.
- Melhorar status operacional considerando fuso horario da estabelecimento.

Validacao manual:

- Abrir uma estabelecimento pelo slug.
- Conferir servicos, horarios e profissionais.
- Clicar para agendar.
- Validar se o agendamento usa a estabelecimento correta.

## Fase A3 - Mapa Publico E Busca Por Proximidade

Status: concluida para o MVP.

Objetivo: permitir que clientes encontrem estabelecimentos proximas com raio e filtros.

Checklist:

- [x] Criar endpoint publico:
  - `GET /public/estabelecimentos`
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
  - `/estabelecimentos`
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
  - Leaflet/OpenStreetMap via carregamento client-side
  - Google Maps/Mapbox como alternativa futura

Observacao: o MVP usa Leaflet/OpenStreetMap sem chave paga e sem instalar dependencia local. Uma evolucao futura pode empacotar `leaflet` no workspace em vez de carregar por CDN.

Validacao manual:

- Abrir `/estabelecimentos`.
- Permitir localizacao no browser.
- Alterar raio.
- Buscar por cidade.
- Clicar em um marker.
- Ir para perfil e agendar.

## Fase A4 - Gestao De Localizacao Pela Estabelecimento

Status: concluida para o MVP.

Objetivo: permitir que o dono da estabelecimento mantenha dados publicos e localizacao.

Checklist:

- [x] Criar aba `Perfil publico` em `/configuracoes`.
- [x] Permitir editar endereco e coordenadas.
- [x] Permitir controlar agendamento online no perfil publico.
- [x] Criar campo de observacao para aprovacao.
- [x] Quando dados criticos mudarem, voltar para `PENDING_REVIEW`.
- [x] Validar campos obrigatorios para aparecer no mapa.

Observacao: no MVP, a visibilidade publica continua governada pelo `reviewStatus`. Ao alterar dados criticos, a estabelecimento volta para revisao e sai dos endpoints publicos ate nova aprovacao. Um campo dedicado de visibilidade pode entrar numa evolucao posterior de schema.

Validacao manual:

- Editar endereco.
- Salvar.
- Conferir se a estabelecimento volta para analise.
- Aprovar no admin.
- Conferir no mapa publico.

## Fase A5 - Qualidade, Reputacao E Destaques

Status: concluida para o MVP.

Objetivo: melhorar ranking e confianca da busca publica.

Checklist:

- [x] Criar avaliacao por atendimento concluido.
- [x] Calcular media real por estabelecimento.
- [x] Mostrar quantidade de avaliacoes.
- [x] Criar regras de destaque administradas pelo dono do app.
- [x] Permitir destaque manual no admin.
- [x] Ordenar resultados por:
  - distancia
  - aberta agora
  - destaque
  - avaliacao
- [x] Criar denuncia/revisao de perfil publico.

Observacao: a avaliacao do MVP fica disponivel no historico do cliente em `/agendamento` para atendimentos com status `CONCLUIDO`. Cada agendamento pode receber uma unica avaliacao. Denuncias de perfil publico entram pela pagina da estabelecimento e sao revisadas no Admin SaaS.

Validacao manual:

- Concluir atendimento.
- Registrar avaliacao.
- Conferir media no perfil e no mapa.
- Marcar estabelecimento como destaque no admin.
- Enviar denuncia pelo perfil publico.
- Revisar denuncia no Admin SaaS.

## Fase A6 - Operacao Comercial Do SaaS

Status: em andamento.

Objetivo: fechar o ciclo comercial com aprovacao, cobranca e comunicacao.

Checklist:

- [x] Enviar notificacao interna para o dono do app em novos cadastros.
- [x] Criar tela de detalhes comerciais da estabelecimento.
- [x] Criar notas internas admin.
- [x] Criar status de lead/comercial:
  - novo
  - em contato
  - aprovado
  - recusado
  - convertido
- [x] Registrar auditoria ao atualizar dados comerciais.
- [x] Permitir que o dono do software gerencie preco e limites dos planos no Admin SaaS.
- [x] Separar `SUPER_ADMIN` de tenant operacional de estabelecimento.
- [ ] Integrar pagamento real.
- [x] Bloquear recursos operacionais para estabelecimentos com status `PAST_DUE`.
- [ ] Bloquear recursos conforme inadimplencia real vinda do gateway.

Observacao: a A6 agora possui notificacao interna no Admin SaaS, gestao comercial manual e bloqueio operacional por status. Notificacao externa, gateway de pagamento e inadimplencia automatica ficam para recortes seguintes.

Validacao manual:

- Criar cadastro publico.
- Ver lead no admin.
- Atualizar status comercial.
- Aprovar.
- Associar plano.

## Sugestoes De Commits

```bash
git c "fix:normalizar acesso do dono do app"
git c "feat:adicionar aprovacao de estabelecimentos"
git c "feat:criar perfil publico de estabelecimento"
git c "feat:criar busca publica por mapa"
git c "feat:adicionar gestao de localizacao publica"
git c "feat:adicionar reputacao de estabelecimentos"
git c "feat:adicionar operacao comercial saas"
```
