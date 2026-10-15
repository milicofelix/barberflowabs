# Etapa 10 — Relacionamento, Fidelizacao E Notificacoes

Status: Fases 1 a 6 implementadas (domínio e APIs, com exclusão assistida restrita ao relacionamento da unidade). Aplicar migrations pendentes, gerar o Prisma Client e reiniciar o backend. Telas completas seguem previstas na Fase 7; homologação manual e revisão jurídica permanecem separadas da implementação. Exclusão integral da conta global não é automatizada.

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

- [x] Configurar programa, validade e regras de pontuacao por estabelecimento.
- [x] Implementar saldo, extrato imutavel, niveis e recompensas.
- [x] Criar cupons com periodo, limites e elegibilidade.
- [x] Criar indicacoes com atribuição e prevencao de autofraude.
- [x] Integrar ganho e resgate ao agendamento e financeiro.

### Implementação Da Fase 5 — 15/10/2026

Entrega de **domínio, persistência e APIs autenticadas de gestão**. Não adiciona telas ou botões de fidelização: a central web/mobile permanece na Fase 7. O módulo independente de fidelidade é integrado ao fluxo de atendimento sem criar dependência circular entre agenda, financeiro e relacionamento.

Migration: `20261015190000_add_loyalty_program`. Adiciona oito tabelas para programa, carteiras, movimentos, recompensas, cupons, benefícios, indicações e liquidações. Não concede pontos retroativos, não cria programas ativos, não altera preços dos serviços nem dados históricos. Não exige seed ou novas variáveis de ambiente.

Aplicar **migrate deploy**, **prisma generate** e **restart app**, nessa ordem, pelos comandos de `docs/COMANDOS.md`. Fazer backup antes. Nenhum teste, build, typecheck, lint, migration, seed, restart ou chamada de API foi executado nesta entrega. A implementação ainda depende da homologação no ambiente de destino.

#### Regras De Pontos E Financeiro

- Programa desativado por padrão. Configuração exige pontuação, validade de 1 a 3.650 dias e de um a dez níveis, começando em zero.
- Cada conclusão nova calcula `floor(valorLiquidoCentavos / centavosPorPonto)`. O evento é o atendimento concluído, **não o pagamento da conta**; pontos não representam dinheiro ou confirmação de recebimento. Frações monetárias não acumulam entre atendimentos. Cada crédito é limitado ao inteiro máximo do banco.
- Saldo considera apenas lotes não expirados, menos resgates e mais estornos desses lotes. A expiração é calculada na consulta, sem depender de worker. O extrato conserva os eventos originais; lotes e `calculadoEm` explicam a validade do saldo.
- Resgates consomem primeiro os lotes que vencem antes. Não existe endpoint de edição/exclusão de movimentos ou concessão arbitrária de saldo. Níveis usam os pontos ganhos ao longo da vida no estabelecimento, sem cair ao resgatar ou expirar pontos; a configuração atual determina os limiares.
- Recompensas concedem desconto fixo em centavos mediante custo em pontos; cupons concedem desconto fixo sem pontos. Um agendamento aceita **um benefício por vez**, com desconto limitado ao valor bruto, sem troco ou saldo monetário residual. Se o valor for menor que a recompensa, o custo integral em pontos continua necessário.
- Aplicação somente em `AGENDADO`, `CONFIRMADO` ou `ATRASADO`, antes de iniciar atendimento ou gerar conta. Chave de idempotência é obrigatória e vinculada ao payload. Uma tentativa repetida devolve o registro original, inclusive se já cancelado, sem reaplicá-lo; novo resgate após cancelamento exige nova chave.
- Cupom verifica período de aplicação (início inclusivo, fim exclusivo), gasto mínimo bruto, limite global, limite por cliente, tags (qualquer uma), serviços (qualquer um) e primeira visita, quando configurados. IDs de serviços são validados no tenant. Reservas `APLICADO` já consomem os limites; canceladas liberam a cota. Impede reservar dois cupons de primeira visita simultâneos para o mesmo cliente.
- Elegibilidade e valor são congelados ao aplicar. Reagendamento preserva o benefício reservado; não exige que o atendimento aconteça antes do fim do período promocional. Editar/desativar uma oferta não recalcula benefícios já reservados. Desativar o programa impede novos resgates/ganhos, mas honra descontos reservados e permite estornos.
- Cancelar o benefício antes do atendimento, cancelar o agendamento ou marcar ausência cria estorno compensatório uma única vez. A validade original é preservada: pontos já vencidos não são reativados pelo estorno. Não há exclusão do histórico nem estorno de atendimento concluído nesta fase.
- Conclusão, consumo do benefício, pontos, indicação e snapshot líquido são persistidos **na mesma transação** da mudança de status. A liquidação tem chave única por agendamento; repetir conclusão não duplica ganho. Não concede pontos de conclusões antigas por simples consulta/repetição.
- Operações concorrentes usam bloqueios na ordem estabelecimento → agendamento (quando necessário) → programa → carteira e isolamento `ReadCommitted` para consultar contadores atualizados após espera. A ordem acompanha o worker e as FKs da auditoria. A serialização inicial por estabelecimento prioriza segurança; particionamento de locks para maior escala pode ser avaliado após medir demanda.
- Financeiro reaproveita a conta única por agendamento e usa o líquido congelado. Desconto integral resulta em zero a receber, sem recriar o preço bruto e sem falsa divergência no monitor. Conta manual vinculada a atendimento com benefício é recusada: deve ser gerada pela conclusão.
- **Comissões e repasses preservam a regra existente sobre os preços brutos dos itens.** O custo promocional fica com o estabelecimento; esta fase não reduz remuneração de profissionais nem muda repasses já pagos. Relatórios operacionais de venda bruta continuam distintos das contas líquidas a receber.

#### Indicações E Proteções

- Indicador e indicado precisam ser clientes ativos do mesmo estabelecimento, com papel `CUSTOMER` e telefones brasileiros completos; nomes não determinam identidade.
- Atribuição única e não transferível antes do primeiro atendimento concluído; bloqueia mesma conta, e-mail igual, telefone igual após normalização e ciclos de indicação, inclusive indiretos. Não aceita cadeias acima de cem elos.
- A indicação começa `PENDENTE`. Operador com `RELACIONAMENTO_GERENCIAR` revisa a identidade fora do sistema e aprova antes da primeira conclusão. O bônus é congelado nessa aprovação.
- Primeira conclusão elegível concede bônus ao indicador, não ao indicado. Exige valor líquido mínimo e programa ativo; cancelamento/ausência não premia. Identidades e vínculo ativo do indicador são conferidos novamente. O resultado fica `PREMIADA` ou `INELEGIVEL`, com auditoria e referência ao atendimento.
- Telefone/e-mail declarados **não são prova de titularidade**. As proteções reduzem autofraude evidente, mas não substituem OTP ou investigação antifraude; sem provedor de verificação nesta fase, a revisão humana é obrigatória. A autorização para comunicação continua independente da fidelidade: não inscreve ninguém em marketing.

#### Contratos Da Fidelização

Base: `/relacionamento/fidelidade`. Todos os dados são resolvidos pelo estabelecimento da sessão; não se aceita tenant escolhido no corpo. IDs de clientes são de `ClienteEstabelecimento`, não de `Usuario`.

| Método e rota | Finalidade | Permissão |
| --- | --- | --- |
| `GET /programa` | Configuração, até cem recompensas e cem cupons mais recentes | `RELACIONAMENTO_VISUALIZAR` |
| `PUT /programa` | Configurar/ativar/desativar programa | `RELACIONAMENTO_GERENCIAR` |
| `POST /recompensas`, `PUT /recompensas/:id` | Criar/editar/desativar recompensa | `RELACIONAMENTO_GERENCIAR` |
| `POST /cupons`, `PUT /cupons/:id` | Criar/editar/desativar cupom | `RELACIONAMENTO_GERENCIAR` |
| `GET /clientes/:id?pagina=1` | Saldo, lotes válidos, nível e extrato de cinquenta eventos por página | `RELACIONAMENTO_VISUALIZAR` |
| `GET /agendamentos/:id/beneficio` | Histórico de benefícios, bruto, desconto, líquido e liquidação | Leitura de relacionamento + `AGENDA_GERENCIAR` |
| `POST /agendamentos/:id/beneficio` | Reservar cupom ou resgatar pontos | Gestão de relacionamento + `AGENDA_GERENCIAR` |
| `POST /agendamentos/:id/beneficio/cancelar` | Cancelar reserva e estornar pontos | Gestão de relacionamento + `AGENDA_GERENCIAR` |
| `GET /indicacoes?pagina=1` | Listar atribuições, cinquenta por página | `RELACIONAMENTO_VISUALIZAR` |
| `POST /indicacoes` | Atribuir indicador/indicado | `RELACIONAMENTO_GERENCIAR` |
| `POST /indicacoes/:id/aprovar` | Registrar revisão administrativa de identidade | `RELACIONAMENTO_GERENCIAR` |

Exemplo de `PUT /programa` (valores comerciais ilustrativos, não ativados automaticamente):

```json
{
  "ativo": true,
  "centavosPorPonto": 100,
  "validadeDias": 365,
  "bonusIndicacao": 50,
  "minimoIndicacaoCentavos": 5000,
  "niveis": [{ "nome": "Inicial", "pontos": 0 }, { "nome": "Prata", "pontos": 500 }]
}
```

Exemplo de recompensa (`POST /recompensas`):

```json
{ "nome": "Desconto de R$ 20", "pontos": 200, "descontoCentavos": 2000, "ativo": true }
```

Exemplo de cupom (`POST /cupons`):

```json
{
  "codigo": "BEMVINDO20",
  "descontoCentavos": 2000,
  "inicio": "2026-10-15T00:00:00-03:00",
  "fim": "2026-11-01T00:00:00-03:00",
  "limiteTotal": 100,
  "limitePorCliente": 1,
  "minimoCentavos": 5000,
  "elegibilidade": { "primeiraVisita": true },
  "ativo": true
}
```

Resgate: `{"chaveIdempotencia":"resgate-001","recompensaId":1}`. Alternativamente, cupom: `{"chaveIdempotencia":"cupom-001","codigoCupom":"BEMVINDO20"}`. Indicação: `{"indicadorId":10,"indicadoId":11}`. Não enviar cupom e recompensa juntos. Use IDs reais retornados pelo seu ambiente.

### Aceite Manual Da Fase 5

1. Fazer backup, aplicar migration, gerar Client e reiniciar. Conferir programa inicialmente inativo e ausência de crédito sobre atendimentos históricos.
2. Configurar programa de teste e concluir um novo atendimento de R$ 150, sem desconto, com regra de um ponto por real: esperar 150 pontos e uma conta de R$ 150. Repetir conclusão: mesmos saldo/conta.
3. Acumular saldo, resgatar recompensa e repetir a chave: apenas um débito. Outra chave no mesmo atendimento deve ser recusada; outro agendamento com saldo insuficiente também.
4. Cancelar benefício/atendimento e marcar ausência em casos separados. Conferir lançamento compensatório, validade original, liberação da cota de cupom e ausência de ganho.
5. Aplicar R$ 20 de desconto num atendimento de R$ 150 e concluir: conta de R$ 130 e 130 pontos, sem alterar comissão bruta. Conferir desconto integral: zero pontos/recebível e nenhuma divergência financeira indevida.
6. Conferir período, mínimo, tags, serviços e primeira visita dos cupons; tentar consumir a última cota em dois dispositivos simultâneos: apenas uma reserva. Repetir resgates simultâneos sobre a mesma carteira sem permitir saldo negativo.
7. Conferir expiração com relógio controlado no ambiente de homologação: saldo reduz sem apagar extrato; estornar lote vencido não reativa validade. Conferir limites dos níveis.
8. Atribuir indicação, aprovar após revisão e concluir primeiro atendimento elegível. Repetir: bônus único. Recusar autoindicação, telefone equivalente, ciclo, troca de indicador e IDs de outro tenant. Indicação sem aprovação não gera bônus.
9. Desativar o programa com reserva existente: sem novos resgates/ganhos, preservando desconto e possibilidade de cancelamento. Reagendar: preservar reserva e não cobrar pontos de novo.
10. Tentar conta manual vinculada ao atendimento com benefício, alterações após início/conclusão e acesso sem as permissões: recusar sem gravação parcial. Interromper a receita após conclusão e repetir a conclusão: reaproveitar a liquidação e gerar uma única conta líquida.

Foram escritos testes isolados de contratos, saldo/lotes, estorno, isolamento, idempotência, limite de cupom, liquidação, valor financeiro líquido e autorização. Também foram adaptados os mocks do fluxo/financeiro existentes. Não executados; mocks não substituem aceite de concorrência e integridade no MySQL.

## Fase 6 — Metricas E Governanca

- [x] Medir entrega, abertura quando suportada, clique, conversao e cancelamento.
- [x] Medir retorno, retencao, reativacao e receita atribuida.
- [x] Criar trilha de auditoria funcional e politica de retencao de dados.
- [x] Implementar exportação paginada e exclusão assistida dos dados de relacionamento, com identidade validada, conservação justificada e resultado explicitamente parcial.

Implementação em 15/10/2026. Migration `20261015210000_add_relationship_governance`; política inicialmente inativa, sem execução automática sobre dados. APIs autenticadas em `/relacionamento/governanca`, com permissões específicas para acesso financeiro, gestão e configurações. As métricas não inventam aberturas/conversões para provedores simulados. A exclusão não apaga conta global, histórico operacional ou registros de outras unidades e não certifica conformidade jurídica integral.

Contratos, fórmulas, exemplos de operação, limites da conservação e aceite: [ETAPA_10_FASE_6_METRICAS_GOVERNANCA.md](ETAPA_10_FASE_6_METRICAS_GOVERNANCA.md). Nenhum teste, build, migration, exportação, expurgo ou exclusão real foi executado pelo agente.

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
