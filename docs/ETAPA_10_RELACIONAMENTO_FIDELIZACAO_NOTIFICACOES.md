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
- [x] Aplicar migration, gerar Prisma Client, reiniciar e validar manualmente.

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
- [x] Aplicar migration, gerar Prisma Client, reiniciar e validar manualmente.

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

### Validacao Manual Da Fase 2

Pre-requisitos:

- aplicar a migration `20261012020000_add_communication_orchestration`;
- gerar novamente o Prisma Client e reiniciar o backend;
- manter `NOTIFICACOES_WORKER_ATIVO=true`;
- usar uma conta vinculada a um estabelecimento com `RELACIONAMENTO_VISUALIZAR` e `RELACIONAMENTO_GERENCIAR`;
- possuir ao menos um cliente ativo vinculado ao mesmo estabelecimento.

Defina o endereco do backend e autentique-se. O endpoint de login retorna o JWT como uma string JSON, por isso o exemplo remove as aspas:

```bash
export API_BASE='http://localhost:4000'
export TOKEN="$(curl -sS -X POST "$API_BASE/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"EMAIL_DO_GESTOR","senha":"SENHA_DO_GESTOR"}' | tr -d '"')"
```

Liste os clientes e anote o `id` do registro de relacionamento, nao o `usuario.id`:

```bash
curl -sS "$API_BASE/relacionamento/clientes" \
  -H "Authorization: Bearer $TOKEN"
```

Autorize o canal de e-mail para o cliente escolhido, substituindo `CLIENTE_ID`:

```bash
curl -sS -X PUT "$API_BASE/relacionamento/clientes/CLIENTE_ID/preferencias" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"preferencias":[{"canal":"EMAIL","consentido":true,"origem":"USUARIO","versaoTermos":"2026-10"}]}'
```

Crie um template e anote seu `id`:

```bash
curl -sS -X POST "$API_BASE/relacionamento/templates" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"nome":"Validacao manual Fase 2","evento":"CAMPANHA","canal":"EMAIL","assunto":"Ola, {{nome}}","conteudo":"Mensagem simulada para {{nome}}.","ativo":true}'
```

Enfileire a mensagem usando uma chave exclusiva e substituindo `CLIENTE_ID` e `TEMPLATE_ID`:

```bash
curl -sS -X POST "$API_BASE/relacionamento/envios" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"clienteId":CLIENTE_ID,"templateId":TEMPLATE_ID,"chaveIdempotencia":"validacao-fase2-001","maximoTentativas":3,"variaveis":{"nome":"Cliente Teste"}}'
```

O retorno inicial deve conter `status: "AGENDADO"`. Em ate um ciclo do worker, normalmente cinco segundos, consulte a fila:

```bash
curl -sS "$API_BASE/relacionamento/envios?canal=EMAIL&pagina=1&limite=25" \
  -H "Authorization: Bearer $TOKEN"
```

O envio deve passar para `ENVIADO`, conter `provedor: "email-simulado"`, `referenciaExterna` e uma tentativa com status `ACEITO`. Consulte o historico completo substituindo `ENVIO_ID`:

```bash
curl -sS "$API_BASE/relacionamento/envios/ENVIO_ID" \
  -H "Authorization: Bearer $TOKEN"
```

Para validar a idempotencia da fila, repita o `POST /relacionamento/envios` com a mesma `chaveIdempotencia`. O resultado esperado e `409 Conflict`, sem criar uma segunda mensagem.

Para validar callbacks, use o mesmo provedor e a `referenciaExterna` retornada pelo envio. O segredo precisa ser o mesmo configurado em `NOTIFICACOES_CALLBACK_SECRET`:

```bash
curl -sS -X POST "$API_BASE/relacionamento/callbacks/email-simulado" \
  -H 'x-uniflow-callback-secret: SEU_SEGREDO_DE_CALLBACK' \
  -H 'Content-Type: application/json' \
  -d '{"eventoId":"callback-manual-001","referenciaExterna":"REFERENCIA_EXTERNA","tipo":"ENTREGUE","payload":{"simulado":true}}'
```

Repita exatamente o mesmo callback. A segunda resposta deve conter `duplicado: true`, e o detalhe do envio deve continuar com apenas um callback para esse evento.

Para validar retentativas e fila morta, use um cliente de teste cujo e-mail contenha `falha-temporaria`, por exemplo `falha-temporaria@example.com`, autorize e-mail e enfileire com `maximoTentativas: 3`. Os estados esperados sao:

1. `PROCESSANDO` durante a tentativa;
2. `RETENTATIVA`, com `proximaTentativaEm` preenchida;
3. novos processamentos apos aproximadamente um e dois minutos;
4. `FILA_MORTA` depois da terceira falha, preservando as tres tentativas no historico.

Um destino contendo `falha-permanente` deve ir diretamente para `FALHA_PERMANENTE`. Para devolver qualquer um desses dois estados a fila:

```bash
curl -sS -X POST "$API_BASE/relacionamento/envios/ENVIO_ID/reprocessar" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"tentativasAdicionais":3}'
```

O envio deve voltar para `AGENDADO`, sem apagar as tentativas anteriores. Se a causa simulada continuar presente, ele falhara novamente; altere o destino do cliente de teste antes de reprocessar para validar a recuperacao com sucesso.

Criterios de aceite manual:

- nenhuma mensagem duplicada para a mesma chave dentro do estabelecimento;
- consentimento ausente ou revogado impede o enfileiramento;
- worker processa mensagens sem intervencao manual;
- falhas temporarias respeitam retentativa exponencial e terminam na fila morta;
- falhas permanentes nao consomem retentativas desnecessarias;
- historico conserva todas as tentativas e callbacks;
- callback repetido nao gera segundo evento;
- reprocessamento conserva a auditoria anterior;
- outro estabelecimento nao consegue consultar ou reprocessar o envio.

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
