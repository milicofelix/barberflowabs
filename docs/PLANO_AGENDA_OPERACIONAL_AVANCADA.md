# Plano — Agenda Operacional Avancada

Status: Fase 1 implementada; fundacao visual e calendario avancado pendentes.

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

- [ ] Fazer uma prova tecnica com bibliotecas compativeis com a versao atual do Expo e React Native.
- [ ] Avaliar manutencao, acessibilidade, desempenho, suporte a gestos, recursos por coluna e licenca comercial.
- [ ] Encapsular a biblioteca escolhida em componentes proprios para evitar dependencia direta nas telas.
- [ ] Implementar modos dia, tres dias, semana e lista.
- [ ] Criar linha de horario atual, zoom e navegacao por gesto.

Nenhuma biblioteca sera instalada antes dessa prova tecnica e da confirmacao de licenca e compatibilidade.

## Fase 3 — Operacao De Agenda

- [ ] Exibir profissionais ou recursos em colunas configuraveis.
- [ ] Abrir detalhes do agendamento sem sair do calendario.
- [ ] Criar, confirmar, realizar check-in, concluir, cancelar e marcar ausencia.
- [ ] Reagendar por fluxo assistido e, quando seguro, por arrastar e soltar.
- [ ] Destacar conflitos, bloqueios, intervalos, preparacao e atendimento domiciliar.
- [ ] Impedir visualmente qualquer movimento invalido antes de enviar ao backend.

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
