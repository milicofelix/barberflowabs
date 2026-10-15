# Etapa 10 — Relacionamento, Fidelizacao E Notificacoes

Status: Fases 1 a 4 implementadas (domínio e APIs). A Fase 4 exige aplicar sua migration, gerar o Prisma Client e reiniciar o backend. Telas completas de relacionamento/campanhas seguem previstas na Fase 7; aceite manual permanece separado da implementação.

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
  -d '{"nome":"Validacao manual Fase 2","evento":"LEMBRETE_AGENDAMENTO","canal":"EMAIL","assunto":"Ola, {{nome}}","conteudo":"Mensagem simulada para {{nome}}.","ativo":true}'
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

- [x] Enfileirar confirmacao ao criar ou confirmar um agendamento.
- [x] Agendar lembretes configuraveis por estabelecimento.
- [x] Cancelar lembretes obsoletos em cancelamento ou reagendamento.
- [x] Incluir links seguros para confirmar, reagendar ou cancelar.
- [x] Respeitar fuso horario do estabelecimento e janela silenciosa.

Implementado em 13/10/2026:

- criação e reagendamento sincronizam a fila persistente sem fazer uma falha de provedor desfazer o agendamento;
- chaves idempotentes impedem confirmação ou lembrete duplicado para o mesmo evento, canal e revisão;
- preferências e consentimentos da Fase 1 continuam obrigatórios para cada canal;
- templates-padrão de confirmação e lembrete são criados somente quando o estabelecimento ainda não possui um template para o canal;
- lembretes usam a antecedência configurada, o fuso IANA do estabelecimento e são deslocados para o fim da janela silenciosa;
- reagendamento cancela lembretes pendentes e gera a nova programação; cancelamento e `NO_SHOW` encerram todas as mensagens pendentes;
- links assinados e com expiração permitem consultar, confirmar e cancelar sem expor dados pessoais; reagendamento direciona para autenticação;
- web e mobile permitem configurar ativação, antecedência e janela silenciosa.

### Aceite Manual Da Fase 3

1. Aplique a migration e gere novamente o Prisma Client com os comandos documentados em `docs/COMANDOS.md`.
2. Em Configurações da agenda, habilite os lembretes, escolha a antecedência e salve a janela silenciosa.
3. Em Relacionamento, registre consentimento explícito em ao menos um canal para o cliente usado no teste.
4. Crie um agendamento futuro e confirme que a fila contém uma confirmação e um lembrete por canal consentido.
5. Reagende e confira que o lembrete anterior está `CANCELADO` e que há um novo lembrete com a nova data.
6. Abra os links de confirmação e cancelamento em janela anônima; a consulta deve ser pública, mas cada ação deve aceitar apenas seu token específico.
7. Cancele o agendamento e confirme que nenhuma mensagem pendente permanece ativa.

## Fase 4 — Campanhas Segmentadas

- [x] Criar campanhas em rascunho, agendadas, em execucao, pausadas e concluidas.
- [x] Segmentar por tags, unidade, servico, profissional, recorrencia e inatividade.
- [x] Gerar audiencia congelada para auditoria antes do disparo.
- [x] Aplicar limites de frequencia, descadastro e supressao.

### Implementação Da Fase 4 — 15/10/2026

A entrega desta fase é de **domínio, persistência e API**, sem antecipar as centrais de gestão web/mobile da Fase 7. Foi adicionada a página pública `/comunicacoes/descadastro` para confirmar a retirada de campanhas sem login. Nenhum teste, build, typecheck, lint, migration, seed, restart, chamada de API ou disparo foi executado nesta entrega.

Migration nova: `20261015170000_add_segmented_campaigns`. Cria `campanhas_comunicacao`, `campanhas_destinatarios` e `supressoes_comunicacao`, relaciona os envios à campanha e adiciona índice de frequência. Aplicar os comandos já catalogados de **migrate deploy**, **prisma generate** e **restart app**, nessa ordem. Não usar reset do banco.

#### Contratos Autenticados

Todas as rotas abaixo ficam em `/relacionamento/campanhas`, usam o estabelecimento da sessão e não aceitam tenant escolhido pelo corpo:

| Método e rota | Finalidade | Permissão |
| --- | --- | --- |
| `GET /` | Listar campanhas, `pagina`/`limite`, padrão 25 e máximo 100 | `RELACIONAMENTO_VISUALIZAR` |
| `POST /` | Criar rascunho | `RELACIONAMENTO_GERENCIAR` |
| `GET /:id` | Configuração e contadores da audiência/envios por estado | `RELACIONAMENTO_VISUALIZAR` |
| `PUT /:id` | Editar rascunho ainda não congelado | `RELACIONAMENTO_GERENCIAR` |
| `POST /:id/congelar` | Fixar audiência e conteúdo do template, sem enviar | `RELACIONAMENTO_GERENCIAR` |
| `GET /:id/audiencia` | Conferir audiência paginada, evidência, supressões e estado do envio | `RELACIONAMENTO_VISUALIZAR` |
| `POST /:id/agendar` | Agendar audiência congelada; sem data significa início assim que processado | `RELACIONAMENTO_GERENCIAR` |
| `POST /:id/pausar` | Pausar campanha agendada/em execução | `RELACIONAMENTO_GERENCIAR` |
| `POST /:id/retomar` | Voltar campanha pausada à fila, sem congelar outra audiência | `RELACIONAMENTO_GERENCIAR` |
| `POST /supressoes` | Ativar/desativar bloqueio de marketing por cliente e canal, com motivo | `RELACIONAMENTO_GERENCIAR` |

Exemplo de corpo para criar/editar (os IDs devem pertencer ao estabelecimento):

```json
{
  "nome": "Retorno de clientes VIP",
  "templateId": 1,
  "intervaloMinimoHoras": 168,
  "filtros": {
    "tags": ["VIP"],
    "unidadeId": 1,
    "servicoId": 2,
    "profissionalId": 3,
    "recorrenciaMinima": 2,
    "inatividadeDias": 30
  }
}
```

Filtros são opcionais e combinados por **E**; dentro de `tags`, basta corresponder a uma tag exata. Unidade significa a filial física (`Unidade`) do histórico. Serviço/profissional/unidade/recorrência consideram agendamentos **CONCLUIDO**, da própria unidade SaaS, ocorridos até o instante do congelamento; recorrência é a contagem histórica que corresponde aos filtros, não previsão ou análise por período. Inatividade usa o último atendimento concluído em todo o estabelecimento; quem nunca concluiu atendimento não entra nesse filtro. Sem filtros, os candidatos são todos os clientes ativos do estabelecimento.

A seleção lê clientes em lotes de 250 e agrega o histórico por usuário, sem fazer uma consulta por atendimento. O limite é 5.000 candidatos por campanha; excedê-lo recusa o congelamento inteiro e exige filtros mais específicos. A audiência congela **candidatos correspondentes ao segmento**, não uma promessa de entrega: consentimento, status, destino, supressão e frequência podem excluir destinatários na execução. Evidências guardam contagem/data, não nome, telefone ou procedimento. Alterar tags, cadastrar novos clientes ou editar o template posteriormente não muda essa audiência/conteúdo. Repetir o congelamento conserva os mesmos registros. Para mudar uma campanha congelada, criar outro rascunho.

Somente template ativo, do evento `CAMPANHA` e do próprio estabelecimento pode ser usado. O snapshot admite `{{nome}}`, `{{estabelecimento}}` e `{{descadastroUrl}}`; variáveis desconhecidas recusam o congelamento. Dados de contato são consultados na preparação do envio, não copiados para a evidência da audiência. Alterar o destino depois do enfileiramento cancela o envio e requer nova campanha, evitando encaminhar conteúdo para contato não conferido.

Agendamento recebe `{ "agendadoPara": "2026-10-20T14:00:00-03:00" }`, sempre com fuso explícito, e é persistido como instante UTC. A Fase 4 não aplica a janela silenciosa transacional às campanhas: o operador deve escolher o horário apropriado de disparo; adequações por canal/provedor ficam para a operação real. O worker reutiliza `NOTIFICACOES_WORKER_ATIVO` e `NOTIFICACOES_WORKER_INTERVALO_MS`, consulta até cinco campanhas por ciclo e prepara até 25 destinatários de cada uma. Os envios seguem pelo worker/provedores da Fase 2, ainda simulados.

Transições e preparação são protegidas por transação/lock da campanha; destinatário é único por campanha/usuário e envio usa chave `campanha:ID:usuario:ID`. Pausar impede novas preparações e o gate antes do provedor adia mensagens já na fila por um minuto, sem consumir tentativa; ao retomar, pode haver essa latência. Mensagens cuja chamada ao provedor já começou não podem ser recolhidas. `CONCLUIDA` significa que não há mais destinatário pendente nem envio em processamento/retentativa; falhas e supressões continuam nos contadores, sem fingir entrega bem-sucedida.

#### Frequência, Consentimento E Descadastro

- Frequência por estabelecimento/usuário/canal, entre **24 e 720 horas**, padrão 168. Preparação considera reservas/envios de outras campanhas. Antes do provedor, um marcador persistente sob lock impede que campanhas concorrentes autorizem dois disparos no intervalo. Uma tentativa autorizada reserva a janela mesmo se houver falha posterior; retries do mesmo envio podem continuar, respeitando o limite de tentativas. É uma política conservadora contra excesso de marketing, não uma garantia de entrega.
- Consentimento explícito e cliente ativo são exigidos na preparação e imediatamente antes de entregar ao provedor; supressão tem precedência. Contatos importados não ganham consentimento por participar da audiência.
- Supressão recebe `{ "clienteId": 10, "canal": "EMAIL", "ativa": true, "motivo": "Solicitação do cliente" }`. Desativá-la não concede consentimento nem reabre mensagens canceladas. A tabela também conserva os marcadores de frequência com `ativa=false`.
- Toda mensagem acrescenta link de descadastro. Token assinado, expiração de 180 dias, chave derivada e escopo exclusivo: não serve como token de login ou link de agendamento. Não registrar tokens/conteúdo em logs/analytics; configurar `PUBLIC_APP_URL` com o endereço público correto antes de usar provedores reais.
- `GET /public/comunicacoes/descadastro?token=...` somente consulta o canal; não altera preferências. `POST /public/comunicacoes/descadastro` com `{ "token": "..." }` revoga consentimento do canal/unidade, ativa supressão e cancela campanhas ainda agendadas/em retentativa. A página web exige botão explícito para não executar a retirada por scanner de links. Token expirado exige novo link ou alteração autenticada das preferências.
- O endpoint genérico `POST /relacionamento/envios` não aceita mais template/evento `CAMPANHA`; usar a audiência congelada. Reprocessamento genérico de envios de campanha é recusado para não reabrir campanhas encerradas por fora do fluxo. Mensagens antigas rotuladas `CAMPANHA` sem associação são canceladas pelo gate. Comunicação transacional continua no contrato existente.

Foram escritos testes isolados de validação, permissões, segmentação, congelamento repetido, pausa, consentimento, gate do worker e escopo do token. Não foram executados. Concorrência real, índices/FKs e a aplicação da migration precisam ser conferidos no ambiente de destino; os testes com mocks não homologam a infraestrutura.

#### Aceite Manual Da Fase 4

1. Aplicar migration, gerar client e reiniciar `app`; manter os adaptadores simulados. Usar exclusivamente contas e contatos de teste.
2. Criar template ativo `CAMPANHA`, clientes com/sem consentimento e histórico concluído em filiais/serviços/profissionais diferentes; criar o rascunho pelo contrato acima.
3. Congelar, consultar audiência e repetir congelamento: mesmos IDs, sem duplicação. Alterar tags/template depois e confirmar que o snapshot permanece intacto.
4. Agendar e conferir transições/contadores; clientes sem consentimento, bloqueados, sem destino, suprimidos ou dentro da frequência não devem chegar ao provedor.
5. Pausar antes do horário e durante a fila; confirmar ausência de novas chamadas após o gate e preservação do envio. Retomar e conferir continuidade sem outra audiência.
6. Revogar consentimento após enfileirar; conferir cancelamento antes do provedor. Executar campanhas concorrentes para o mesmo cliente/canal e conferir um único disparo autorizado na janela.
7. Abrir link sem confirmar: nada muda. Confirmar descadastro e repetir: consentimento permanece revogado, supressão ativa e auditoria de mudança não duplica. Conferir outro canal/estabelecimento preservado.
8. Tentar IDs de outro tenant, perfis sem permissão, template transacional e filtros inválidos; nenhuma gravação parcial ou exposição cruzada.
9. Interromper/reiniciar durante a preparação e repetir ciclos; conferir chave única de envio, audiência fixa, tentativas e conclusão com contadores coerentes.

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
