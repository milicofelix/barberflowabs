# Etapa 9 — Paridade Financeira Mobile

Status: Fases 1 a 7 implementadas em 2026-10-10, com validacao manual pendente; resta a fase de corte do legado e aceite de paridade.

## Objetivo

Entregar no aplicativo as mesmas capacidades financeiras disponiveis na web, usando os contratos `/financeiro` e as mesmas regras de tenant, permissao, concorrencia e auditoria.

Paridade significa equivalencia funcional e de regras. A interface mobile deve ser adaptada a toque, teclado, telas pequenas e navegacao nativa; nao deve copiar literalmente o layout desktop.

## Estado Atual

O mobile ainda utiliza o financeiro legado:

- `GET /gestao/financeiro`;
- `POST /gestao/financeiro`.

Esse fluxo permite apenas consultar e criar lancamentos simples. Ainda nao oferece contas, caixa, comissoes, repasses, formas de pagamento, cobrancas, conciliacao ou auditoria.

## Fase 1 — Fundacao, Contratos, Navegacao E Permissoes

- criar tipos para resumo, contas, formas de pagamento, caixa, comissoes, repasses, assinatura, conciliacao e auditoria;
- criar um hook financeiro dedicado, sem ampliar `useOperacao`;
- consumir exclusivamente os endpoints `/financeiro` para as novas telas;
- criar navegacao tipada para a central financeira e seus detalhes;
- aplicar `FINANCEIRO_VISUALIZAR`, `FINANCEIRO_GERENCIAR` e `FINANCEIRO_AUDITAR` na exibicao e nas acoes;
- reutilizar carregamento, erro, estado vazio, confirmacao e feedback de sucesso;
- impedir envios duplicados e atualizar dados depois de cada mutacao;
- manter o financeiro legado acessivel apenas durante a transicao.

Implementado:

- contratos mobile tipados para todos os dominios financeiros;
- hook dedicado consumindo `/financeiro`, com recarga por periodo e bloqueio de envios duplicados;
- rota tipada e central financeira preparada para os modulos funcionais;
- leitura condicional da auditoria e ocultacao de acoes conforme permissoes;
- atalho para a nova central mantendo o financeiro legado durante a transicao.

Critério de conclusão: a central abre para os perfis autorizados, carrega o periodo selecionado e nao apresenta acoes proibidas.

## Fase 2 — Resumo E Relatorios

- indicadores de recebido, a receber, pago e repasses pendentes;
- selecao de periodo com atalhos para hoje, semana e mes;
- valores formatados em Real;
- separacao visual entre receitas, despesas e obrigacoes futuras;
- sinalizacao de divergencias de conciliacao;
- atualizar por gesto de arrastar e respeitar tema claro/escuro.

Implementado:

- atalhos de periodo para hoje, semana e mes, alem do intervalo informado manualmente;
- indicadores de recebido, a receber, pago, a pagar e repasses pendentes;
- valores em Real e separacao visual entre receitas, despesas e obrigacoes;
- alerta com quantidade e valor das divergencias de conciliacao;
- atualizacao por gesto e componentes adaptados aos temas claro e escuro.

Critério de conclusão: os totais do mesmo tenant e periodo coincidem com os exibidos na web.

## Fase 3 — Contas A Pagar E Receber

- listar contas com status, vencimento, categoria e saldo;
- filtros por tipo, status e periodo;
- destacar contas vencidas;
- criar contas a pagar e receber;
- registrar baixa integral ou parcial;
- selecionar forma de pagamento;
- cancelar contas sem pagamento;
- exibir o vinculo com o atendimento quando existir;
- pedir confirmacao antes de baixa ou cancelamento;
- apresentar conflitos de concorrencia com mensagem para atualizar a tela.

Implementado:

- listagem por periodo com filtros de tipo e status;
- destaque de contas atrasadas, saldo pendente e vinculo com atendimento;
- criacao de contas a pagar e receber para usuarios com permissao de gestao;
- baixa integral ou parcial com data e forma de pagamento;
- cancelamento protegido por confirmacao e pelas regras do backend;
- bloqueio de envios duplicados e exibicao das mensagens de conflito da API.

Critério de conclusão: criar, baixar, cancelar e consultar uma conta no mobile produz exatamente o mesmo resultado observado na web.

## Fase 4 — Caixa E Formas De Pagamento

- mostrar caixa atual e historico;
- abrir caixa com saldo inicial;
- fechar caixa com saldo contado, esperado e diferenca;
- impedir visualmente uma segunda abertura;
- listar formas de pagamento, taxas e prazo de recebimento;
- criar, ativar e desativar formas de pagamento;
- manter as acoes protegidas por `FINANCEIRO_GERENCIAR`.

Implementado:

- exibicao do caixa atual e do historico de aberturas e fechamentos;
- abertura com saldo inicial e observacoes;
- fechamento confirmado com saldo contado, esperado e diferenca;
- impedimento visual e protecao do backend contra dois caixas abertos;
- cadastro de formas de pagamento com taxas e prazo de recebimento;
- ativacao e desativacao de formas existentes;
- formularios e acoes restritos a `FINANCEIRO_GERENCIAR`.

Critério de conclusão: somente um caixa permanece aberto por estabelecimento e as formas ativas coincidem entre web e mobile.

## Fase 5 — Comissoes E Repasses

- listar regras de comissao e sua prioridade;
- configurar comissao padrao, por profissional, por servico ou combinada;
- selecionar profissional e servico com busca;
- calcular repasses pelo periodo;
- detalhar receita bruta, percentual medio, ajustes e valor liquido;
- marcar repasse pendente como pago mediante confirmacao;
- impedir que recalculos alterem repasses pagos.

Implementado:

- listagem das regras com estado e prioridade explicita;
- configuracao padrao, por profissional, por servico ou pela combinacao dos dois;
- seletores com busca para profissionais e servicos;
- ativacao e desativacao das regras existentes;
- calculo dos repasses conforme o periodo selecionado na central;
- detalhamento de receita, percentual medio, comissao, ajustes e valor liquido;
- confirmacao antes de marcar um repasse pendente como pago;
- preservacao de repasses pagos garantida pelo backend durante recalculos.

Critério de conclusão: as regras e os valores calculados no mobile coincidem com a web para o mesmo periodo.

## Fase 6 — Assinatura, Cobrancas E Inadimplencia

- exibir plano, status, fim do periodo e historico de cobrancas;
- gerar cobranca manual para perfis autorizados;
- mostrar estados pendente, pago, atrasado, falhou e cancelado;
- apresentar bloqueio `PAST_DUE` com orientacao clara;
- no perfil `SUPER_ADMIN` ou `APP_OWNER`, disponibilizar o processamento administrativo de inadimplencia;
- nunca armazenar segredo de webhook ou credencial de gateway no aplicativo.

Implementado:

- resumo do plano, valor mensal, status, trial, periodo atual e cancelamento programado;
- historico com todos os estados de cobranca e datas de vencimento e pagamento;
- exibicao de codigo PIX selecionavel e abertura segura do link de pagamento quando fornecidos pela API;
- geracao manual protegida por permissao e confirmacao, reutilizando cobranca pendente existente;
- alerta e orientacao para assinatura `PAST_DUE`, mantendo o bloqueio como responsabilidade do backend;
- processamento global da inadimplencia na area administrativa, exclusivo para `SUPER_ADMIN` e `APP_OWNER`;
- nenhuma credencial ou segredo de gateway armazenado no aplicativo.

Critério de conclusão: assinatura e cobrancas exibem o mesmo estado da web, e o bloqueio ocorre pelas mesmas regras do backend.

## Fase 7 — Conciliacao E Auditoria

- listar conciliacoes e divergencias;
- registrar conciliacao manual;
- vincular opcionalmente uma conta financeira;
- mostrar valor esperado, recebido e diferenca;
- exibir trilha de auditoria apenas com `FINANCEIRO_AUDITAR`;
- identificar autor, data, entidade e acao;
- separar visualmente eventos informativos de divergencias que exigem acao.

Implementado:

- formulario de conciliacao com provedor, identificador externo e valores esperado e recebido;
- vinculo opcional com conta financeira do estabelecimento e busca por conta;
- calculo da diferenca e classificacao autoritativa pelo backend;
- historico com estados pendente, conciliado e divergente, destacando itens que exigem acao;
- protecao de conflitos e idempotencia por provedor e identificador externo;
- trilha financeira somente para usuarios com `FINANCEIRO_AUDITAR`;
- identificacao de autor, data, entidade, acao e resumo dos detalhes auditados;
- separacao visual de eventos criticos, sem expor informacoes de outros estabelecimentos.

Critério de conclusão: conciliacoes e eventos de auditoria coincidem entre web e mobile, sem vazamento entre estabelecimentos.

## Fase 8 — Corte Do Legado E Aceite De Paridade

- remover `FinanceiroOperacao` e o consumo de `/gestao/financeiro` do mobile;
- manter a operacao diaria apontando para a nova central financeira;
- revisar textos, moeda, datas, teclado numerico, safe areas e acessibilidade;
- conferir tema claro e escuro em todas as telas financeiras;
- verificar estados carregando, vazio, erro, sucesso, sem permissao e offline;
- comparar web e mobile com o mesmo usuario, tenant e periodo;
- atualizar a documentacao somente depois do aceite manual.

Critério de conclusão: nenhum recurso financeiro da web fica ausente no mobile para o mesmo perfil, e o mobile nao utiliza mais os endpoints financeiros legados.

## Arquitetura Prevista

- `src/data/financeiro/tipos.ts`: contratos de apresentacao;
- `src/data/hooks/useFinanceiro.ts`: leitura, mutacoes e estado compartilhado;
- `src/screens/financeiro/`: telas de resumo e fluxos;
- `src/components/financeiro/`: componentes pequenos por responsabilidade;
- componentes de formulario separados dos componentes de listagem;
- regras monetarias e de permissao permanecem no backend;
- nenhuma credencial de gateway entra no bundle mobile.

## Ordem Recomendada

1. Aplicar e validar manualmente a migration da Etapa 9 no backend.
2. Executar a Fase 1.
3. Entregar as Fases 2 e 3 como primeiro bloco utilizavel.
4. Entregar as Fases 4 e 5 como operacao financeira do estabelecimento.
5. Entregar as Fases 6 e 7 como administracao e controle.
6. Executar a Fase 8 somente apos o aceite das anteriores.

## Matriz Final De Paridade

| Capacidade | Web | Mobile esperado |
| --- | --- | --- |
| Resumo e periodo | Sim | Sim |
| Contas e baixas | Sim | Sim |
| Cancelamento de conta | Sim | Sim |
| Caixa | Sim | Sim |
| Formas de pagamento | Sim | Sim |
| Comissoes | Sim | Sim |
| Repasses | Sim | Sim |
| Assinatura e cobrancas | Sim | Sim |
| Inadimplencia administrativa | Sim | Sim, somente admin |
| Conciliacao | Sim | Sim |
| Auditoria | Sim | Sim, conforme permissao |

## Validacao Manual Final

1. Entrar na web e no mobile com o mesmo responsavel de estabelecimento.
2. Selecionar o mesmo periodo e comparar os indicadores.
3. Criar uma conta no mobile e confirmar sua exibicao na web.
4. Registrar uma baixa parcial na web e concluir a baixa no mobile.
5. Abrir o caixa no mobile e confirmar que a web nao permite outra abertura.
6. Alterar uma comissao e recalcular os repasses nas duas interfaces.
7. Ativar ou desativar uma forma de pagamento e conferir a sincronizacao.
8. Registrar uma conciliacao divergente e comparar a auditoria.
9. Entrar com perfis de visualizacao, gestao e auditoria para verificar os limites de cada permissao.
10. Repetir os fluxos nos temas claro e escuro e em uma tela pequena.

Nenhum teste, build, lint, typecheck, migration, seed, instalacao ou reinicio deve ser executado automaticamente durante essas fases, salvo solicitacao explicita.
