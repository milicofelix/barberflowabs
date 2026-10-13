# Plano — Agenda Operacional Avancada

Status: Fases 1 a 5 implementadas.

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
- A agenda mobile possui modo de tela cheia, sobrepondo a navegacao inferior e preservando data, visualizacao, filtros, zoom e operacoes.

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

- [x] Buscar cliente por nome, telefone ou e-mail.
- [x] Criar ou vincular cliente atendido fora do aplicativo sem exigir que ele use tecnologia.
- [x] Escolher unidade, modalidade, profissional e servicos; recursos sao alocados pelo motor universal.
- [x] Mostrar preco, duracao e disponibilidade antes da confirmacao; preparacao integra o periodo validado.
- [x] Registrar autor, origem e observacao do agendamento para auditoria.

### Fluxo entregue

- A busca de clientes e feita no servidor, limitada ao estabelecimento e aos primeiros 30 resultados.
- Um cliente presencial pode ser criado com nome, e-mail e telefone; uma credencial interna aleatoria e gerada sem exigir cadastro no aplicativo.
- Unidade e modalidade alteram a consulta de horarios; atendimento domiciliar exige endereco e aceita tempo de deslocamento.
- O resumo final apresenta cliente, profissional, servicos, duracao, valor e observacao antes da confirmacao.
- Antes de criar, o aplicativo consulta o motor universal para validar escala, bloqueios, profissional, recursos, preparacao e deslocamento.
- Recursos sao escolhidos automaticamente conforme tipo, capacidade, unidade e disponibilidade, evitando escolhas tecnicas incorretas pela recepcao.
- Origem e autoria ficam persistidas no agendamento para consulta operacional e auditoria.

### Aceite manual da Fase 4

1. Entre com uma conta que possua `AGENDA_GERENCIAR` e abra a aba **Agendar cliente**.
2. Pesquise um cliente por parte do nome, telefone e e-mail; confirme que os três critérios retornam somente clientes do estabelecimento.
3. Use **+ Novo**, cadastre nome, e-mail e telefone e confirme que o cliente fica selecionado sem criação manual de senha.
4. Selecione unidade e modalidade. Para domiciliar, confirme que endereço é obrigatório e informe o deslocamento.
5. Escolha profissional, múltiplos serviços, data e horário. Confira duração, preparação e preço no resumo final.
6. Escolha a origem, preencha uma observação e toque em **Validar e agendar**.
7. Tente repetir o mesmo horário ou usar um período bloqueado; o motor deve recusar antes da criação.
8. Em **Operação > Agenda**, abra o evento e confira origem, responsável pelo registro e observação.
9. Confirme no banco que `criadoPorId`, `origem` e `observacoes` foram persistidos no registro de `agendamentos`.

## Fase 5 — Tempo Real, Desempenho E Paridade

- [x] Atualizar inclusoes e alteracoes sem recarregar o calendario inteiro.
- [x] Aplicar atualizacao otimista com reversao em caso de conflito.
- [x] Cachear janelas ja consultadas e invalidar apenas periodos afetados.
- [x] Tratar concorrencia entre recepcionistas e reservas publicas.
- [x] Entregar os mesmos contratos e regras na web e no mobile.

### Sincronizacao e desempenho entregues

- Cada estabelecimento possui uma revisao leve da agenda, atualizada depois de criacao, reagendamento, cancelamento e mudanca de status.
- Web e mobile consultam essa revisao a cada cinco segundos e recarregam somente a janela visivel quando detectam uma alteracao externa.
- Janelas consultadas ficam em cache por cinco minutos; mudancas confirmadas invalidam o cache antes da reconciliacao com o servidor.
- Mudanca de status e reagendamento no mobile, e mudanca de status na web, atualizam a interface imediatamente e revertem o estado local quando o servidor recusa a operacao.
- A web passou a consumir `GET /gestao/agenda` com intervalo ISO 8601, limite e a mesma estrutura utilizada pelo mobile.
- A concorrencia continua decidida pelo motor universal dentro das transacoes do banco; a sincronizacao apenas reflete o resultado, sem substituir a validacao autoritativa.

### Aceite manual da Fase 5

1. Abra a mesma agenda operacional na web e no mobile com duas contas autorizadas do mesmo estabelecimento.
2. Crie uma reserva pelo fluxo publico ou assistido e confirme que ela aparece nas duas agendas em ate cinco segundos, sem trocar de tela.
3. Altere o status em um dispositivo e confirme a atualizacao automatica no outro.
4. Tente reagendar dois atendimentos para o mesmo profissional e periodo; confirme que apenas a primeira operacao valida permanece e a outra interface reverte a alteracao.
5. Navegue entre dia, tres dias e semana, retorne a uma janela ja vista e confirme que ela aparece imediatamente pelo cache.
6. Cancele uma reserva pelo cliente e confirme que a agenda operacional e atualizada automaticamente.

## Criterios De Aceite

- nenhuma acao pode ignorar conflitos do motor universal;
- mudancas de data ou filtro nao devem remontar toda a tela;
- agenda permanece utilizavel com alto volume de profissionais e horarios;
- operacoes criticas exigem confirmacao e produzem auditoria;
- acessibilidade, tema claro/escuro e telas pequenas permanecem suportados;
- biblioteca escolhida deve possuir licenca compativel com o produto.
