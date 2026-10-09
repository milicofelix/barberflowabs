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
- [x] Preservar `barbeariaId` enquanto consumidores legados dependerem dele.
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
- [x] Responsavel criado com perfil `BARBERSHOP_OWNER`.
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

- Papeis e permissoes detalhados de equipe.
- Escalas individuais por profissional.
- Manutencao e indisponibilidade programada de recursos.
- Capacidade simultanea por unidade e regras de excecao.

## Etapas Posteriores

- Financeiro, pagamentos e comissoes.
- Relacionamento, fidelizacao e notificacoes.
- Inteligencia artificial com governanca.
- Homologacao, seguranca e lancamento gradual.
