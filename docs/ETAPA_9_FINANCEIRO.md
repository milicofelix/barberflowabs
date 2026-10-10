# Etapa 9 — Financeiro, Pagamentos E Comissoes

Status: implementacao funcional concluida em 2026-10-10; migration, Prisma Client, reinicio e validacao manual pendentes.

## Escopo Entregue

- comissao padrao, por profissional, por servico e pela combinacao profissional/servico;
- contas a pagar e receber com baixa parcial ou integral;
- conta a receber gerada de forma idempotente ao concluir um atendimento;
- abertura e fechamento de caixa com diferenca entre saldo esperado e informado;
- calculo de repasses a partir de agendamentos concluidos;
- formas de pagamento, taxas e prazo de recebimento;
- cobrancas vinculadas a assinatura do estabelecimento;
- eventos de gateway idempotentes, validados por segredo de webhook;
- processamento administrativo de inadimplencia e bloqueio pelo status `PAST_DUE`;
- resumo financeiro, conciliacao e auditoria por tenant;
- permissoes separadas para visualizar, gerenciar e auditar;
- central financeira web em `/financeiro`;
- protecao contra dois caixas abertos e contra recalculo de repasses ja pagos.

## Prioridade Das Comissoes

Para cada item de servico concluido, o motor usa a primeira regra encontrada:

1. profissional e servico;
2. servico;
3. profissional;
4. regra padrao do estabelecimento.

A migration cria uma regra padrao de 40% para os estabelecimentos existentes, preservando o comportamento anterior.

## Gateway

O dominio nao depende de um fornecedor. O endpoint `POST /pagamentos/gateway/webhooks/:provedor` recebe eventos normalizados com `eventoId`, `referencia`, `status`, `tipo` e `pagoEm`. O header `x-webhook-secret` deve corresponder a `PAYMENT_WEBHOOK_SECRET`.

O modo inicial e manual. A contratacao e configuracao de Mercado Pago, Asaas ou outro provedor ainda exige decisao comercial, credenciais e um adaptador de criacao de cobranca especifico. Eventos repetidos nao duplicam pagamentos por causa da chave unica `provedor + eventoExternoId`.

## Contratos Principais

- `GET /financeiro/resumo`
- `GET|PUT /financeiro/comissoes`
- `GET|POST|PUT /financeiro/formas-pagamento`
- `GET|POST /financeiro/contas`
- `PUT /financeiro/contas/:id/baixar`
- `PUT /financeiro/contas/:id/cancelar`
- `GET /financeiro/caixas`
- `POST /financeiro/caixas/abrir`
- `POST /financeiro/caixas/:id/fechar`
- `GET /financeiro/repasses`
- `POST /financeiro/repasses/calcular`
- `PUT /financeiro/repasses/:id/pagar`
- `GET|POST /financeiro/conciliacoes`
- `GET /financeiro/assinatura`
- `POST /financeiro/assinatura/cobrancas`
- `GET /financeiro/auditoria`
- `POST /saas/admin/inadimplencia/processar`

## Validacao Manual Pendente

1. Aplicar a migration, gerar o Prisma Client e reiniciar o ambiente usando a sequencia ja documentada em `docs/COMANDOS.md`.
2. Entrar como responsavel de um estabelecimento e abrir `/financeiro`.
3. Confirmar as formas de pagamento e a regra padrao de 40%.
4. Criar uma conta a receber, dar baixa e conferir o resumo.
5. Abrir e fechar o caixa, verificando a diferenca informada.
6. Concluir um agendamento, calcular o repasse e marcar o pagamento.
7. Registrar uma conciliacao com e sem divergencia.
8. Confirmar que um membro apenas com `FINANCEIRO_VISUALIZAR` nao consegue alterar dados.
9. Validar cobranca, webhook e inadimplencia somente em ambiente de homologacao.

O arquivo `rollback.sql` ao lado da migration existe apenas para recuperacao manual. Ele remove os dados financeiros da etapa e deve ser usado somente depois de backup e validacao explicita.

Nenhuma migration, geracao, validacao, teste ou build foi executado automaticamente nesta etapa.
