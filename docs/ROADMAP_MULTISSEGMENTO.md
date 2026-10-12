# Roadmap De Transicao Multissegmento

Este roadmap substitui, para novas funcionalidades, a sequencia mobile orientada exclusivamente a barbearias. O sistema existente sera migrado progressivamente, sem reescrita integral.

## Etapa 0 - Decisao E Protecao Do Estado Atual

Status: concluida em 2026-10-09.

- [x] Consolidar a Fase 3 mobile em um checkpoint rastreavel.
- [x] Criar ADR da evolucao multissegmento.
- [x] Congelar o roadmap mobile antigo.
- [x] Registrar `UniFlow ABS` como nome escolhido para o produto.
- [x] Executar verificacao preliminar de dominio, lojas e INPI.
- [x] Bloquear rebranding definitivo ate validacao comercial e juridica.

## Etapa 1 - Dominio Multissegmento Compativel

Objetivo: introduzir o conceito de estabelecimento sem quebrar contratos atuais.

Status: implementacao concluida; migration aplicada e validada no ambiente Docker em 2026-10-09.

- [x] Definir vocabulario canonico e mapa de compatibilidade.
- [x] Modelar tipo de estabelecimento e modelo de atendimento.
- [x] Introduzir segmentos, especialidades e requisitos sem antecipar a gestao completa do catalogo.
- [x] Disponibilizar aliases externos em `/public/estabelecimentos`.
- [x] Planejar convivencia e versionamento de APIs.
- [x] Criar migration aditiva com rollback manual documentado.
- [x] Preservar temporariamente o identificador legado durante a fase aditiva.
- [x] Adicionar testes direcionados para classificacao e resolucao isolada de tenant.

## Etapa 2 - Segmentos, Especialidades E Catalogo

Status: implementacao backend concluida; migration aplicada e validada no ambiente Docker em 2026-10-09.

- [x] Categorias e subcategorias de estabelecimentos.
- [x] Multiplas especialidades por estabelecimento, profissional e servico.
- [x] Servicos com duracao, preco, imagens, observacoes e requisitos.
- [x] Atendimento presencial, domiciliar ou hibrido.
- [x] Configuracao por segmento sem duplicacao de modulos.
- [x] Isolamento de tenant nas associacoes operacionais.
- [x] Contratos e roteiro manual de validacao documentados.

## Etapa 3 - Motor Universal De Agenda

Status: implementacao backend concluida; migration aplicada e validada no ambiente Docker em 2026-10-09.

- [x] Duracoes reais e multiplos servicos ordenados.
- [x] Preparacao anterior, posterior e entre servicos.
- [x] Habilitacao entre profissional e servico.
- [x] Unidade e atendimento fisico, domiciliar ou hibrido.
- [x] Deslocamento para atendimento domiciliar.
- [x] Salas, cadeiras, macas e equipamentos reservaveis por capacidade.
- [x] Reagendamento com historico.
- [x] Bloqueios e prevencao transacional de conflitos de profissional e recurso.
- [x] Contratos e validacao manual documentados.

## Etapa 4 - Onboarding E Marketplace

Status: implementacao concluida em 2026-10-09; instalacao da dependencia do mapa e validacao manual pendentes.

- [x] Onboarding com tipo de estabelecimento, modelo de atendimento, segmentos e especialidades.
- [x] Responsavel criado com perfil `ESTABLISHMENT_OWNER`.
- [x] Marketplace publico por categoria e especialidade.
- [x] Filtros por localizacao, avaliacao, preco, funcionamento e disponibilidade de profissional.
- [x] Perfis publicos consumidos pelo contrato externo de estabelecimentos.
- [x] Lista e mapa nativo no mobile.
- [x] Paginacao e ordenacao preparadas na API.

## Etapa 5 - Retomar A Evolucao Mobile

Status: implementacao funcional concluida em 2026-10-09; validacao manual pendente.

- [x] Operacao do estabelecimento com resumo diario.
- [x] Agenda por data, profissional e atualizacao de status.
- [x] Configuracoes do perfil publico e horarios de funcionamento.
- [x] Cadastro e visualizacao da equipe.
- [x] Lancamentos e resumo financeiro.
- [x] Administracao mobile com revisao de estabelecimentos pendentes.
- [x] Novo fluxo de cadastro multissegmento com plano, responsavel e especialidades.
- [x] Navegacao condicionada aos perfis operacionais e administrativos.
- [x] Roteiro manual de validacao documentado.

## Etapa 6 - Equipes E Capacidade Operacional

Status: implementacao concluida em 2026-10-10; migration e validacao manual pendentes por decisao do responsavel.

- [x] Papeis e permissoes detalhados de equipe.
- [x] Vinculo opcional entre usuario e perfil profissional.
- [x] Escalas individuais por profissional, com intervalo e unidade opcional.
- [x] Manutencao e indisponibilidade programada de recursos.
- [x] Capacidade simultanea por recurso e unidade.
- [x] Escalas e indisponibilidades conectadas ao motor universal de agenda.
- [x] Gestao mobile de membros, escalas, recursos e bloqueios de manutencao.

## Etapa 7 - Canonicalizacao Definitiva Do Dominio

Status: implementacao concluida em 2026-10-10; migration, geracao do Prisma Client e validacao manual pendentes.

- [x] Substituir `Barbearia`, `barbeariaId` e `barbearias` no dominio ativo.
- [x] Renomear modelos, tabelas, colunas, relacoes e chaves compostas.
- [x] Adotar `ESTABLISHMENT_OWNER` e `ESTABLISHMENT_MEMBER`.
- [x] Adotar headers `x-estabelecimento-id` e `x-estabelecimento-slug`.
- [x] Renomear rotas, arquivos, componentes, contextos e hooks web/mobile.
- [x] Renomear o pacote compartilhado para `@uniflowabs/core`.
- [x] Criar migration de dados e estrutura com rollback manual.
- [x] Preservar `BARBEARIA` somente como categoria de estabelecimento.
- [x] Registrar a decisao no ADR 0002.

## Etapa 9 - Financeiro, Pagamentos E Comissoes

Status: implementacao funcional web e paridade financeira mobile concluidas em 2026-10-10; migration, Prisma Client, reinicio, aceite manual e ativacao de gateway externo pendentes.

- [x] Comissoes configuraveis por estabelecimento, profissional e servico.
- [x] Fechamento de caixa, contas a pagar e receber.
- [x] Repasses e formas de pagamento.
- [x] Cobrancas de assinatura e inadimplencia.
- [x] Contrato idempotente para eventos de gateway.
- [x] Relatorios, conciliacao e auditoria financeira.
- [x] Central financeira web e permissoes especificas.
- [x] Implementar as Fases 1 a 8 da paridade financeira mobile documentadas em `docs/ETAPA_9_PARIDADE_FINANCEIRA_MOBILE.md`.
- [ ] Validar manualmente a paridade financeira entre web e mobile com o mesmo perfil, estabelecimento e periodo.
- [ ] Selecionar, contratar e ativar um gateway externo em homologacao.

## Etapa 10 - Relacionamento, Fidelizacao E Notificacoes

Status: Fase 1 implementada em 2026-10-11; migration, Prisma Client, reinicio e validacao manual pendentes.

- [x] Fundacao da central de clientes, consentimentos, templates e auditoria de envios.
- [x] Prioridade: cadastro e aprovacao de estabelecimentos, endereco via CEP, mascaras e central de notificacoes. Fases A–D concluidas; aceite manual permanece na Fase E.
- [ ] Orquestracao de filas e adaptadores push, e-mail e WhatsApp.
- [ ] Confirmacao e lembrete automatico de agendamentos.
- [ ] Campanhas segmentadas.
- [ ] Pontos, niveis, recompensas, cupons e indicacoes.
- [ ] Metricas de retorno, retencao e conversao.
- [ ] Paridade funcional web e mobile.

Plano detalhado: `docs/ETAPA_10_RELACIONAMENTO_FIDELIZACAO_NOTIFICACOES.md`.

Fase prioritaria: `docs/FASE_PRIORITARIA_CADASTRO_ESTABELECIMENTO.md`.

## Etapas Posteriores

- Inteligencia artificial com governanca.
- Homologacao, seguranca e lancamento gradual.
