# Plano — Agenda Operacional Avancada

Status: Fases 1, 2 e 3 implementadas; agendamento assistido completo pendente.

## Objetivo

Substituir progressivamente a lista diaria da Gestao Diaria por uma agenda operacional completa, sem perder as validacoes do motor universal de agendamento. A visualizacao deve atender recepcao, gestores e profissionais no mobile e, posteriormente, manter paridade com a web.

## Entrega Imediata

- [x] Navegacao por dia anterior, hoje e proximo dia.
- [x] Manter entrada direta de uma data especifica.
- [x] Home do estabelecimento com os proximos agendamentos em ordem cronologica.
- [x] Aba Agendar do estabelecimento separada do fluxo do cliente.
- [x] Agendamento assistido para um cliente vinculado ao estabelecimento.

## Fase 1 — Contratos E Consulta Por Periodo

- [x] Evoluir a consulta de um unico dia para intervalo com inicio e fim.
- [x] Adicionar filtros por unidade, profissional, recurso, servico e status.
- [x] Retornar periodos de ocupacao, preparacao e deslocamento separadamente.
- [x] Criar paginacao por cursor e limitar a janela temporal a 31 dias.
- [x] Padronizar fuso horario do estabelecimento nos contratos.

### Contrato entregue

- `GET /gestao/agenda` recebe `inicio` e `fim` em ISO 8601 com fuso horario.
- O intervalo segue a convencao `[inicio,fim)`: inclui o inicio e exclui o fim.
- Filtros opcionais: `unidadeId`, `profissionalId`, `recursoId`, `servicoId` e `status` (um ou mais separados por virgula).
- Paginacao opcional: `limite` entre 1 e 200 e `cursor` devolvido em `pagina.proximoCursor`.
- A resposta informa `periodo.fusoHorario` e separa ocupacao, deslocamento, preparacao e atendimento.
- O fuso IANA do estabelecimento fica persistido na configuracao da agenda; o padrao inicial e `America/Sao_Paulo`.
- A consulta antiga por um unico dia foi preservada temporariamente para compatibilidade.

## Fase 2 — Fundacao Visual E Biblioteca

- [x] Fazer uma prova tecnica com bibliotecas compativeis com a versao atual do Expo e React Native.
- [x] Avaliar manutencao, acessibilidade, desempenho, suporte a gestos, recursos por coluna e licenca comercial.
- [x] Encapsular a biblioteca escolhida em componentes proprios para evitar dependencia direta nas telas.
- [x] Implementar modos dia, tres dias, semana e lista.
- [x] Criar linha de horario atual, zoom e navegacao por gesto.

### Decisao tecnica

- Biblioteca escolhida: `react-native-big-calendar` 4.19, linha estavel v4 e licenca MIT.
- Compatibilidade declarada: React Native em Android, iOS e Web; a integracao usa apenas APIs JavaScript compativeis com Expo.
- Recursos utilizados: modos `day`, `3days`, `week` e `schedule`, indicador do horario atual, gesto lateral, temas e eventos customizaveis.
- A biblioteca fica isolada em `AgendaCalendario`; telas e contratos nao importam sua API diretamente.
- A agenda limita cada consulta a sua janela visivel e usa os contratos paginados da Fase 1.
- Arrastar e soltar nao integra a fundacao: a linha v4 estavel nao oferece o recurso nativamente e a Fase 3 confirmou a manutencao do fluxo assistido seguro.
- Colunas/focos por profissional e recurso sao compostos fora da biblioteca, mantendo a dependencia encapsulada.

## Fase 3 — Operacao De Agenda

- [x] Exibir profissionais ou recursos em colunas/focos configuraveis.
- [x] Abrir detalhes do agendamento sem sair do calendario.
- [x] Criar pelo fluxo operacional existente, confirmar, realizar check-in, concluir, cancelar e marcar ausencia.
- [x] Reagendar por fluxo assistido; arrastar e soltar permanece desabilitado enquanto a biblioteca estavel nao permitir validacao segura.
- [x] Destacar conflitos, bloqueios, intervalos, preparacao e atendimento domiciliar.
- [x] Impedir movimentos invalidos com pre-validacao no motor universal antes do reagendamento.

### Operacao entregue

- Filtros por profissional, recurso e status consultam novamente somente a janela visivel.
- Preparacao, deslocamento, atendimento, bloqueios gerais e indisponibilidades de recursos possuem faixas e legenda proprias.
- O detalhe no calendario apresenta cliente, profissional, servicos, unidade, modalidade e acoes validas para o status atual.
- Mudancas de status exigem confirmacao e respeitam a sequencia operacional: agendado, confirmado, check-in e concluido.
- O reagendamento informa data, horario e motivo, consulta disponibilidade ignorando apenas a propria reserva e somente depois chama o comando transacional.
- A inclusao de novos agendamentos continua disponivel pelo fluxo operacional de agendamento assistido; sua ampliacao pertence a Fase 4.

## Fase 4 — Agendamento Assistido Completo

- [ ] Buscar cliente por nome, telefone ou e-mail.
- [ ] Criar ou vincular cliente atendido fora do aplicativo sem exigir que ele use tecnologia.
- [ ] Escolher unidade, modalidade, profissional, servicos e recursos.
- [ ] Mostrar preco, duracao, preparacao e disponibilidade antes da confirmacao.
- [ ] Registrar autor, origem e observacao do agendamento para auditoria.

## Fase 5 — Tempo Real, Desempenho E Paridade

- [ ] Atualizar inclusoes e alteracoes sem recarregar o calendario inteiro.
- [ ] Aplicar atualizacao otimista com reversao em caso de conflito.
- [ ] Cachear janelas ja consultadas e invalidar apenas periodos afetados.
- [ ] Tratar concorrencia entre recepcionistas e reservas publicas.
- [ ] Entregar os mesmos contratos e regras na web e no mobile.

## Criterios De Aceite

- nenhuma acao pode ignorar conflitos do motor universal;
- mudancas de data ou filtro nao devem remontar toda a tela;
- agenda permanece utilizavel com alto volume de profissionais e horarios;
- operacoes criticas exigem confirmacao e produzem auditoria;
- acessibilidade, tema claro/escuro e telas pequenas permanecem suportados;
- biblioteca escolhida deve possuir licenca compativel com o produto.
