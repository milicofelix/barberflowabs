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

- Definir vocabulario canonico e mapa de compatibilidade.
- Modelar tipo de estabelecimento e modelo de atendimento.
- Planejar aliases e versionamento de APIs.
- Criar migrations aditivas e reversiveis.
- Preservar `barbeariaId` enquanto consumidores legados dependerem dele.
- Adicionar testes de isolamento multi-tenant antes de ampliar o dominio.

## Etapa 2 - Segmentos, Especialidades E Catalogo

- Categorias e subcategorias de estabelecimentos.
- Multiplas especialidades por estabelecimento e profissional.
- Servicos com duracao, preco, imagens e requisitos.
- Configuracao por segmento sem duplicacao de modulos.

## Etapa 3 - Profissionais, Equipes E Recursos

- Vinculos entre profissionais, especialidades e servicos.
- Papeis e permissoes de equipe.
- Salas, cadeiras, macas e equipamentos reservaveis.
- Atendimento fisico, domiciliar ou hibrido.

## Etapa 4 - Motor Universal De Agendamentos

- Duracoes variaveis e multiplos servicos.
- Preparacao e intervalo entre atendimentos.
- Disponibilidade de profissional e recurso.
- Reagendamento, bloqueios e prevencao transacional de conflitos.

## Etapa 5 - Onboarding Multissegmento

- Selecao de segmento e modelo de atendimento.
- Configuracao guiada de catalogo, profissionais, recursos e horarios.
- Separacao entre adesao ao SaaS e publicacao no marketplace.

## Etapa 6 - Marketplace Multissegmento

- Busca por categoria, especialidade, localizacao, preco e disponibilidade.
- Perfil publico generalizado.
- Reavaliacao do mapa nativo mobile.
- Moderacao, reputacao e denuncia adaptadas ao novo dominio.

## Etapa 7 - Mobile Operacional

- Retomar operacao, configuracoes e administracao no dominio generalizado.
- Atualizar identidade somente apos aprovacao da marca definitiva.
- Preparar novos identificadores e materiais de loja quando necessario.

## Etapas Posteriores

- Financeiro, pagamentos e comissoes.
- Relacionamento, fidelizacao e notificacoes.
- Inteligencia artificial com governanca.
- Homologacao, seguranca e lancamento gradual.
