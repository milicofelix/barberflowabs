# Plano — Fluxo Automático De Atendimentos

## Objetivo

Transformar o agendamento em um fluxo operacional ativo, com início e conclusão automáticos, aviso interno antes do horário e precedência absoluta das decisões manuais da equipe.

O fluxo deve aproveitar os contratos já existentes:

- `AGENDADO` e `CONFIRMADO` continuam representando a reserva futura;
- o status existente `CHECKIN` será apresentado ao usuário como **Em atendimento**;
- o status existente `CONCLUIDO` será apresentado como **Finalizado**;
- `CANCELADO` e `NO_SHOW` continuam terminais;
- será adicionado somente `ATRASADO` para representar um atraso assumido pela operação.

Não será criado um segundo status apenas para mudar os textos da interface. API, web e mobile continuarão usando os códigos canônicos acima.

## Regras Do Fluxo

### Automático

1. Dez minutos antes do horário, o profissional recebe uma notificação interna no sino.
2. A notificação oferece acesso direto ao atendimento e às ações operacionais permitidas.
3. Ao atingir o horário agendado, `AGENDADO` ou `CONFIRMADO` muda para `CHECKIN`, exibido como **Em atendimento**.
4. Ao atingir `dataFim`, `CHECKIN` muda para `CONCLUIDO`, exibido como **Finalizado**.
5. Cada operação deve ser idempotente: reinícios do worker ou ciclos repetidos não podem duplicar transições, notificações, receitas ou auditorias.

### Manual

- Qualquer mudança manual para `ATRASADO`, `CHECKIN`, `CONCLUIDO`, `CANCELADO` ou `NO_SHOW` interrompe a automação daquele agendamento.
- `ATRASADO` nunca inicia ou finaliza sozinho. A equipe decide quando iniciar, concluir, cancelar ou registrar ausência.
- A interface deve mostrar **Fluxo manual** e quem assumiu o controle.
- Deve existir a ação explícita **Retomar automação** enquanto o atendimento não estiver em estado terminal.
- Ao retomar a automação depois de um atraso, o término previsto será recalculado a partir do início efetivo e da duração comercial dos serviços. Preparação, intervalo ou deslocamento não aumentam a duração apresentada ao cliente.

### Exceções

- Reagendamento cancela as transições programadas anteriores, limpa o controle manual e cria uma nova revisão do fluxo.
- Cancelamento e ausência encerram todas as transições e notificações operacionais pendentes.
- Um agendamento criado já dentro da janela de dez minutos gera apenas uma notificação imediata.
- Se o horário já tiver passado quando o worker voltar, ele executa somente a próxima transição válida, respeitando o status e a revisão atuais.
- Fuso horário é usado apenas para apresentação. As comparações continuam usando os instantes UTC persistidos em `data` e `dataFim`.

## Destinatários Da Notificação Interna

Ordem de resolução:

1. membro ativo da equipe vinculado ao `profissionalId` do agendamento;
2. se o profissional não possuir conta vinculada, membros ativos com `AGENDA_GERENCIAR`;
3. gestor proprietário da unidade como último fallback.

A notificação do sino é operacional e independe do consentimento de marketing. Ela não substitui os lembretes já enviados ao cliente por push, e-mail ou WhatsApp.

## Configuração Por Estabelecimento

Adicionar em Configurações → Agenda:

- **Fluxo automático de atendimento**;
- **Iniciar automaticamente no horário**;
- **Finalizar automaticamente ao término**;
- **Avisar profissional com antecedência**, inicialmente 10 minutos;
- limite validado para antecedência, por exemplo de 1 a 60 minutos.

Para implantação segura, a migration mantém a automação desabilitada nos estabelecimentos existentes. Depois do aceite, cada unidade pode ativá-la. Novos estabelecimentos podem receber o padrão definido pelo produto.

## Modelo De Dados

### Agendamento

Adicionar os campos necessários para leitura rápida e concorrência:

- `automacaoAtendimentoAtiva`;
- `controleManualEm`;
- `controleManualPorId`;
- `iniciadoEm`;
- `finalizadoEm`;
- `revisaoFluxo`, incrementada em reagendamentos e alterações relevantes.

### Transições persistentes

Criar uma entidade de transição programada com:

- agendamento, estabelecimento, revisão e tipo (`AVISO`, `INICIAR`, `FINALIZAR`);
- data prevista, status, tentativas, bloqueio do worker, erro e datas de processamento;
- chave idempotente única composta pelo agendamento, revisão, tipo e destinatário quando aplicável.

O histórico não deve ser apagado ao reagendar. Transições antigas ficam canceladas para auditoria.

### Auditoria

Registrar, sem dados sensíveis:

- status anterior e novo;
- origem `AUTOMATICA` ou `MANUAL`;
- usuário responsável quando manual;
- data prevista e data efetiva;
- motivo opcional para atraso, cancelamento e ausência.

## Serviço Único De Transição

Criar um serviço de domínio responsável por toda mudança de status. Tanto o endpoint manual quanto o worker devem chamá-lo.

Esse serviço deve, na mesma operação lógica:

- validar a máquina de estados e o tenant;
- aplicar trava otimista pela revisão/status atual;
- persistir os horários efetivos e o controle manual;
- registrar auditoria;
- publicar a revisão da agenda em tempo real;
- cancelar ou recriar mensagens da jornada quando necessário;
- gerar a receita somente uma vez ao concluir.

Isso substitui a regra atualmente espalhada entre o controller de gestão e o repositório. O worker não poderá escrever `status` diretamente no Prisma.

## Máquina De Estados

| Estado atual | Automático | Ações manuais permitidas |
| --- | --- | --- |
| `AGENDADO` | `CHECKIN` no horário | confirmar, atrasar, iniciar, cancelar, ausência após o horário |
| `CONFIRMADO` | `CHECKIN` no horário | atrasar, iniciar, cancelar, ausência após o horário |
| `ATRASADO` | nenhuma | iniciar, concluir, cancelar, ausência, retomar automação |
| `CHECKIN` | `CONCLUIDO` em `dataFim` ou término recalculado | atrasar, concluir, cancelar, retomar automação |
| `CONCLUIDO` | terminal | nenhuma alteração comum |
| `CANCELADO` | terminal | nenhuma alteração comum |
| `NO_SHOW` | terminal | nenhuma alteração comum |

Reabertura de estados terminais, se necessária futuramente, deverá ser uma ação administrativa separada e auditada.

## Fase 1 — Domínio, Contratos E Persistência

- [x] Definir constantes e tipos compartilhados dos status, origem e transições.
- [x] Criar migration dos campos, configurações, transições e índices por status/data prevista.
- [x] Implementar o serviço único de transição com idempotência e trava concorrente.
- [x] Migrar o endpoint manual existente para o novo serviço.
- [x] Preservar a geração única de receita em `CONCLUIDO`.
- [x] Cobrir máquina de estados, tenant, concorrência e efeitos colaterais com testes.

### Implementação Da Fase 1

Os contratos compartilhados agora expõem os sete estados canônicos, seus rótulos, as origens manual/automática e os tipos/status das tarefas persistentes. `ATRASADO` passou a ocupar agenda como os demais estados ativos, impedindo dupla reserva enquanto a operação decide iniciar, cancelar ou registrar ausência.

A migration `20261014020000_add_automatic_appointment_flow` adiciona configurações por estabelecimento, controle automático/manual e horários efetivos no agendamento, revisão de fluxo e a tabela `transicoes_agendamentos`, com chave idempotente e índices para o worker da Fase 2. Unidades existentes permanecem com o fluxo automático desabilitado. O endpoint de configuração aceita os campos novos sem obrigar web/mobile antigos a enviá-los.

Toda mudança operacional feita pela gestão, pelos cancelamentos autenticados e pelos links públicos de confirmação/cancelamento passa por `FluxoAtendimentoService`. O serviço valida tenant e máquina de estados, usa atualização otimista por status/revisão, registra auditoria na mesma transação, cancela tarefas pendentes ao assumir controle manual e publica a revisão da agenda. Reagendamento limpa o controle manual, incrementa a revisão e cancela tarefas da revisão anterior.

Conclusão continua gerando uma única conta a receber pela restrição única de `agendamentoId`; uma repetição recupera apenas o efeito idempotente sem duplicar status ou auditoria. Transições automáticas antes do início/término são rejeitadas, e qualquer controle manual bloqueia automações posteriores.

Verificação executada: schema Prisma válido, migration aplicada em `uniflow_abs`, 71 testes em 15 suites aprovados, builds do core/backend e TypeScript de web/mobile aprovados. O backend reiniciou e o Nest registrou as rotas sem erro de dependência. A Fase 1 não inicia o worker nem altera visualmente web/mobile; esses itens pertencem às Fases 2–4.

## Fase 2 — Orquestração Automática E Notificação

- [ ] Criar transições ao agendar e recriá-las ao reagendar.
- [ ] Implementar worker persistente com lock expirante, tentativas e recuperação após reinício.
- [ ] Gerar a notificação interna de dez minutos com chave idempotente.
- [ ] Resolver profissional, equipe autorizada e fallback do gestor.
- [ ] Cancelar tarefas em cancelamento, ausência e controle manual.
- [ ] Expor métricas e logs de falha sem dados do cliente.

## Fase 3 — Operação Web

- [ ] Exibir rótulos **Em atendimento**, **Em atraso** e **Finalizado** na agenda e na Home operacional.
- [ ] Destacar atendimentos que começam em até dez minutos.
- [ ] Adicionar ações rápidas: atrasar, iniciar, finalizar, ausência e retomar automação.
- [ ] Mostrar indicador **Automático** ou **Manual**, responsável e horário efetivo.
- [ ] Abrir o atendimento correto ao tocar na notificação do sino.
- [ ] Atualizar agenda, Home e sino sem refresh completo.

## Fase 4 — Paridade Mobile

- [ ] Replicar estados, cores, ações, confirmação e indicador de controle.
- [ ] Abrir o detalhe correto a partir da notificação.
- [ ] Atualizar cards e calendário pela revisão leve já existente.
- [ ] Garantir botões acessíveis, tema claro/escuro e telas pequenas.
- [ ] Validar Android e iOS com o app em primeiro plano, segundo plano e após retomada.

## Fase 5 — Configuração, Observabilidade E Aceite

- [ ] Entregar os controles por estabelecimento na web e no mobile.
- [ ] Criar painel de tarefas atrasadas/falhas e reprocessamento seguro.
- [ ] Medir transições automáticas, intervenções manuais, atrasos e divergências.
- [ ] Validar conclusão financeira única e comissões.
- [ ] Executar aceite com relógio controlado, reinício do worker e dois dispositivos simultâneos.
- [ ] Ativar gradualmente por estabelecimento depois da homologação.

## Cenários Obrigatórios De Aceite

1. Agendamento às 13:00, com fim às 14:30: notifica às 12:50, inicia às 13:00 e finaliza às 14:30.
2. Às 12:55 o profissional marca atraso: nenhuma transição automática posterior ocorre.
3. O profissional inicia às 13:20: fica manual e não finaliza sozinho; ao usar **Retomar automação**, o novo término considera a duração a partir de 13:20.
4. Dois workers processam a mesma tarefa: há uma transição, uma notificação e uma receita.
5. Reagendamento após o aviso: tarefas antigas são canceladas e uma nova revisão é programada.
6. Cancelamento ou ausência: não ocorre início ou conclusão posterior.
7. Reinício do backend durante o horário: tarefas vencidas são retomadas sem pular estados nem duplicar efeitos.
8. Profissional sem usuário vinculado: a equipe autorizada ou o gestor recebe o aviso.
9. Alteração manual simultânea ao worker: a decisão manual vence e fica auditada.
10. Web e mobile refletem a alteração no ciclo de sincronização atual, sem recarregar toda a agenda.

## Fora Do Escopo Inicial

- localização do profissional ou do cliente;
- confirmação biométrica ou por QR Code;
- múltiplas subetapas específicas por segmento, como “lavando” ou “preparando”;
- reabertura comum de atendimento finalizado;
- cobrança automática baseada apenas no relógio sem passar pelo serviço de conclusão.

