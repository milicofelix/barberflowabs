# Etapa 10 — Relacionamento, Fidelizacao E Notificacoes

Status: Fases 1 e 2 implementadas; migrations, Prisma Client, reinicio e validacao manual pendentes.

## Principios

- consentimento explicito e revogavel por estabelecimento, cliente e canal;
- isolamento integral por `estabelecimentoId`;
- nenhum envio sem preferencia valida, salvo comunicacao transacional estritamente necessaria;
- provedores externos atras de adaptadores, sem acoplamento do dominio;
- filas idempotentes, retentativas limitadas e auditoria de cada tentativa;
- contratos unicos para paridade entre web e mobile;
- metricas agregadas sem expor dados pessoais desnecessarios.

## Fase 1 — Fundacao, Clientes, Consentimentos E Templates

Status: implementada; ativacao no banco pendente.

- [x] Evoluir a central multissegmento de clientes com status, tags, observacoes e ultima interacao.
- [x] Registrar consentimento independente para push, e-mail e WhatsApp.
- [x] Registrar origem, versao dos termos, concessao e revogacao do consentimento.
- [x] Criar templates por estabelecimento, evento e canal.
- [x] Criar estrutura de envios, agendamento, retentativas e auditoria tecnica.
- [x] Adicionar permissoes `RELACIONAMENTO_VISUALIZAR` e `RELACIONAMENTO_GERENCIAR`.
- [x] Disponibilizar contratos iniciais em `/relacionamento`.
- [x] Preparar massa idempotente com 48 clientes, consentimentos e 240 atendimentos multissegmento entre 1 e 10 de outubro de 2026.
- [ ] Aplicar migration, gerar Prisma Client, reiniciar e validar manualmente.

Contratos iniciais:

- `GET /relacionamento/clientes`
- `GET|PUT /relacionamento/clientes/:id`
- `GET|PUT /relacionamento/clientes/:id/preferencias`
- `GET|POST /relacionamento/templates`
- `PUT /relacionamento/templates/:id`

## Fase 2 — Orquestracao E Provedores

Status: implementada em 2026-10-12; ativacao no banco e validacao manual pendentes.

- [x] Criar fila persistente e worker concorrente com lock expirante de cinco minutos.
- [x] Implementar politica exponencial de retentativas, limitada a uma hora, e fila morta.
- [x] Criar adaptadores simulados de push, e-mail e WhatsApp atras de um registro de provedores.
- [x] Processar callbacks dos provedores com chave idempotente por provedor e evento.
- [x] Expor consulta paginada de envios, historico completo, falhas e reprocessamento.
- [x] Isolar criacao, consulta e reprocessamento por estabelecimento e permissoes de relacionamento.
- [ ] Aplicar migration, gerar Prisma Client, reiniciar e validar manualmente.

Contratos da orquestracao:

- `POST /relacionamento/envios` — cria um envio idempotente a partir de cliente, template e consentimento.
- `GET /relacionamento/envios` — lista por `status`, `canal`, `pagina` e `limite`.
- `GET /relacionamento/envios/:id` — retorna mensagem, tentativas e callbacks.
- `POST /relacionamento/envios/:id/reprocessar` — devolve falha permanente ou fila morta para processamento.
- `POST /relacionamento/callbacks/:provedor` — callback publico autenticado pelo header `x-uniflow-callback-secret`.

Operacao inicial simulada:

- `NOTIFICACOES_WORKER_ATIVO` habilita ou desabilita o worker no processo do backend;
- `NOTIFICACOES_WORKER_INTERVALO_MS` controla a frequencia de busca, com minimo efetivo de um segundo;
- `NOTIFICACOES_CALLBACK_SECRET` protege os callbacks; o valor padrao local e apenas para desenvolvimento;
- destinos contendo `falha-temporaria` simulam retentativas e destinos contendo `falha-permanente` simulam descarte imediato;
- a substituicao futura por provedores reais fica restrita aos adaptadores, sem alterar fila, API ou dominio.

## Fase 3 — Jornada Do Agendamento

- [ ] Enfileirar confirmacao ao criar ou confirmar um agendamento.
- [ ] Agendar lembretes configuraveis por estabelecimento.
- [ ] Cancelar lembretes obsoletos em cancelamento ou reagendamento.
- [ ] Incluir links seguros para confirmar, reagendar ou cancelar.
- [ ] Respeitar fuso horario do estabelecimento e janela silenciosa.

## Fase 4 — Campanhas Segmentadas

- [ ] Criar campanhas em rascunho, agendadas, em execucao, pausadas e concluidas.
- [ ] Segmentar por tags, unidade, servico, profissional, recorrencia e inatividade.
- [ ] Gerar audiencia congelada para auditoria antes do disparo.
- [ ] Aplicar limites de frequencia, descadastro e supressao.

## Fase 5 — Fidelizacao

- [ ] Configurar programa, validade e regras de pontuacao por estabelecimento.
- [ ] Implementar saldo, extrato imutavel, niveis e recompensas.
- [ ] Criar cupons com periodo, limites e elegibilidade.
- [ ] Criar indicacoes com atribuição e prevencao de autofraude.
- [ ] Integrar ganho e resgate ao agendamento e financeiro.

## Fase 6 — Metricas E Governanca

- [ ] Medir entrega, abertura quando suportada, clique, conversao e cancelamento.
- [ ] Medir retorno, retencao, reativacao e receita atribuida.
- [ ] Criar trilha de auditoria funcional e politica de retencao de dados.
- [ ] Implementar exportacao e exclusao conforme LGPD.

## Fase 7 — Paridade Web E Mobile

- [ ] Criar central de clientes e detalhe do relacionamento na web.
- [ ] Criar preferencias, templates, campanhas e fidelizacao na web.
- [ ] Replicar os mesmos recursos e permissoes no mobile.
- [ ] Validar paridade com o mesmo tenant, usuario e periodo.

## Dependencias Externas Pendentes

- provedor de push e credenciais de producao;
- provedor de e-mail e dominio autenticado;
- WhatsApp Business Platform ou parceiro oficial;
- textos juridicos e versao dos termos de consentimento;
- politica comercial de pontos, validade, cupons e indicacoes.

Nenhuma migration, geracao de Prisma Client, teste ou build foi executado automaticamente nesta etapa.
