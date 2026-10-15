# Etapa 10 — Fase 6: Métricas E Governança

Implementação em 15/10/2026: domínio, persistência e APIs. Interfaces de gestão e autoatendimento web/mobile permanecem na Fase 7. Nenhum teste, build, typecheck, lint, migration, seed, restart, chamada de API, exportação ou exclusão real foi executado pelo agente.

## Ativação Técnica

Migration `20261015210000_add_relationship_governance`: cria políticas e solicitações de privacidade, adiciona marcadores de restrição/expurgo e índices de consulta. Não elimina dados nem ativa políticas. Depende das migrations anteriores da Etapa 10, incluindo a fidelização.

Após backup, usar os comandos já catalogados em `COMANDOS.md`, nesta ordem: `prisma migrate deploy`, `prisma generate`, `docker compose restart app`. Sem reset e sem seed. As novas consultas dependem do schema atualizado, mesmo sem política ativa.

## Contratos E Permissões

Base `/relacionamento/governanca`, com autenticação e tenant da sessão. Não aceita estabelecimento escolhido no corpo.

| Método/rota | Finalidade | Permissão |
| --- | --- | --- |
| `GET /metricas?inicio=ISO&fim=ISO&campanhaId=ID` | Funil, atribuição e relacionamento | `RELACIONAMENTO_VISUALIZAR` + `FINANCEIRO_VISUALIZAR` |
| `GET /auditoria?cursor=0` | Ações, operador, entidade e horário; cem por página | `RELACIONAMENTO_GERENCIAR` |
| `GET /retencao` | Consultar política | `RELACIONAMENTO_GERENCIAR` |
| `PUT /retencao` | Aprovar configuração | Gestão de relacionamento + `CONFIGURACOES_GERENCIAR` |
| `POST /retencao/executar` | Expurgar até cem mensagens vencidas | Mesmas duas permissões |
| `GET /solicitacoes?cursor=0` | Protocolos, cinquenta por página | Mesmas duas permissões |
| `POST /solicitacoes` | Registrar pedido do titular | Mesmas duas permissões |
| `POST /solicitacoes/:id/validar-identidade` | Registrar verificação humana | Mesmas duas permissões |
| `GET /solicitacoes/:id/exportacao?secao=perfil&cursor=0` | Exportação JSON, cem itens por página | Mesmas duas permissões; seção financeira exige também leitura financeira |
| `POST /solicitacoes/:id/concluir-exportacao` | Registrar entrega externa ao titular | Gestão de relacionamento + configurações |
| `POST /solicitacoes/:id/excluir` | Executar limpeza local de relacionamento | Gestão de relacionamento + configurações |

As respostas de métricas, auditoria, solicitações e exportação usam `Cache-Control: no-store`. Não há links públicos para baixar dados pessoais, exportação enviada automaticamente ou arquivos deixados no servidor.

## Fórmulas E Limitações Das Métricas

Datas obrigatórias ISO com fuso; início inclusivo, fim exclusivo e intervalo máximo de 93 dias. Não confundir os três conjuntos de indicadores:

1. **Funil de comunicação:** coorte de mensagens criadas no período, opcionalmente por campanha. `aceitos` exige `enviadoEm` anterior ao fim, não comprova entrega. Entrega, abertura e clique contam mensagens distintas com callbacks associados, autenticados e recebidos antes do fim. Repetições não multiplicam a contagem. Falhas e cancelamentos de mensagens refletem o estado atual da coorte. Um callback ainda sem associação ao envio não entra no funil.
2. **Conversão atribuída:** reservas criadas no período e relacionadas ao último clique recebido até sua criação, dentro dos sete dias anteriores. Escolhe um único envio entre todas as campanhas, só depois aplica o filtro de campanha; não credita a mesma reserva a campanhas diferentes. Usa `recebidoEm` do servidor, não uma data arbitrária enviada no payload. Mostra reservas, canceladas, concluídas, taxa de conclusão e valores. Status são atuais, não fotografia histórica. Cliques não são prova de causalidade nem garantia de interação humana.
3. **Clientes:** atendimentos concluídos no período, pela finalização efetiva ou, em históricos legados, pela data agendada. Retorno significa pelo menos dois atendimentos no intervalo; novos não têm conclusão anterior. Retenção é a parcela da base do intervalo imediatamente anterior, com igual duração, que voltou no período atual. Reativação exige histórico anterior e intervalo de pelo menos sessenta dias até a primeira conclusão atual. Esses indicadores são sempre da unidade inteira, independentemente do filtro de campanha.

Abertura/clique são observações do provedor. Sem eventos de abertura, a taxa é `null`, não zero nem declaração de que o canal não suporta abertura. Funil inconsistente (mais aberturas/cliques que entregas, ou mais entregas que aceites) é sinalizado e a taxa correspondente fica `null`, sem percentuais acima de cem. Não foram adicionados pixels, coleta de IP, user-agent ou rastreamento oculto. Provedores simulados não geram conversões reais por conta própria; callbacks aceitos são os da Fase 2.

Receita atribuída é o valor líquido dos atendimentos atualmente concluídos da coorte de reservas. Prioriza a liquidação de fidelidade, depois a conta financeira e por último o valor da reserva legada. Valor recebido é apresentado separadamente e considera o pagamento atual da conta não cancelada, sem inventar data de recebimento. São indicadores de relacionamento, não demonstração contábil ou fechamento histórico. Taxas sem denominador são `null`.

As consultas agregam no MySQL, evitando carregar todos os clientes/mensagens em memória. Homologar plano de execução e índices com volume real; não foi executado benchmark.

## Auditoria Funcional

Clientes, consentimentos, templates, criação/reprocessamento de envios, campanhas, fidelidade, política e solicitações de privacidade deixam ações com entidade, operador e horário. Novas mutações de relacionamento gravam ação e alteração na mesma transação. Payloads promocionais, documentos de identidade e senhas não são copiados para a nova trilha.

A consulta expõe campos mínimos, sem abrir livremente os detalhes antigos dos logs. Auditoria preexistente é preservada; a entrega não promete reconstruir ações de versões anteriores que não eram auditadas.

O repository legado continua responsável por suas consultas existentes; somente as transações necessárias a auditoria/bloqueio foram alteradas. Métricas, retenção, protocolos, exportação e exclusão foram separados em repositories próprios, sem refatoração incidental do módulo inteiro.

## Política De Retenção

Exemplo de `PUT /retencao`:

```json
{ "ativa": true, "conteudoDias": 90, "fundamento": "Política interna revisada pelo responsável, protocolo PRIV-001" }
```

Noventa dias é sugestão técnica inicialmente **inativa**, não prazo legal ou autorização automática. O responsável define e documenta finalidade/fundamento, entre 1 e 3.650 dias. Não há worker de expurgo automático nesta fase.

Execução exige `POST /retencao/executar` com:

```json
{ "confirmacao": "EXPURGAR_CONTEUDO_VENCIDO" }
```

Cada chamada trata até cem envios antigos já enviados, cancelados ou definitivamente falhos; não expurga mensagens em processamento ou ainda agendadas. Retira destinatário, assunto, conteúdo, metadados, payload de callbacks e respostas/erros das tentativas. Conserva IDs, vínculos, estados e datas necessários à evidência mínima/contagem. `podeHaverMais: true` orienta repetir lotes. Conteúdo expurgado não pode ser reprocessado; callbacks tardios não restauram payload ou metadados. Essa conservação ainda é **pseudonimização**, não anonimização irreversível.

A política não determina prazo de guarda de documentos financeiros, auditoria, fidelidade, conta global ou backups. Esses conjuntos precisam de definição específica do controlador/encarregado; não são apagados por um parâmetro genérico.

## Atendimento Dos Pedidos Do Titular

O fluxo inicial é assistido por operador autorizado, com pedido recebido e identidade verificada fora do sistema. A permissão administrativa não prova que houve pedido do titular. Não usar a API para pedidos fictícios ou sem legitimidade. Referências de verificação/entrega devem ser protocolos, não fotos de documentos, CPF ou cópias de identidade.

Criar `POST /solicitacoes`:

```json
{ "clienteId": 10, "tipo": "EXPORTACAO", "chaveIdempotencia": "privacidade-cliente10-001" }
```

`clienteId` identifica `ClienteEstabelecimento`, não a conta `Usuario`. Para exclusão, usar `tipo: "EXCLUSAO"` e outra chave. Repetir a mesma chave/payload devolve o protocolo; reutilizar com outro cliente/tipo é recusado.

Validar a identidade em `POST /solicitacoes/:id/validar-identidade`:

```json
{ "referenciaVerificacao": "Protocolo de verificação PRIV-001" }
```

### Exportação

Só depois da identidade validada, consultar individualmente `perfil`, `preferencias`, `supressoes`, `agendamentos`, `financeiro`, `fidelidade`, `beneficios`, `indicacoes`, `comunicacoes`, `campanhas`, `importacoes`, `lembretes` e `solicitacoes`. Cada seção usa cursor e retorna `proximoCursor` até terminar. Não gera ZIP nem arquivo global: o operador precisa reunir as páginas e entregar por canal seguro validado com o titular. A seleção é dos dados estruturados de relacionamento; dados globais, anexos externos e campos livres operacionais que exigem revisão de terceiros precisam de avaliação complementar do encarregado.

Whitelists excluem senhas, segredos, tokens de autenticação, payloads livres de provedores, documentos de terceiros e dados de outras unidades. Mensagens próprias podem conter links de ação originalmente enviados ao próprio titular: tratar todo o export como confidencial. Exportação reflete dados no momento de cada página, não um snapshot transacional entre páginas/seções.

Após entrega externa efetiva, registrar `POST /solicitacoes/:id/concluir-exportacao`:

```json
{ "confirmacao": "CONFIRMAR_ENTREGA_AO_TITULAR", "referenciaEntrega": "Protocolo de entrega PRIV-001" }
```

O estado `ATENDIDA` é confirmação do operador, não comprovação automática de que um arquivo foi aberto pelo titular. Acesso e conclusão são auditados.

### Exclusão Parcial Do Relacionamento

Depois da identidade validada, usar `POST /solicitacoes/:id/excluir`:

```json
{ "confirmacao": "EXCLUIR_DADOS_RELACIONAMENTO", "motivoConservacao": "Justificativa concreta revisada pelo encarregado para os dados ainda conservados neste caso" }
```

Uma transação revoga os três canais, mantém supressão, cancela mensagens pendentes, expurga conteúdo e payloads, limpa tags/observações/evidências de audiência, remove lembretes locais e substitui referências/fingerprints da importação por valores sem o contato original. O vínculo fica bloqueado, com marcador de restrição; edição comum e novo consentimento/envio não reativam o relacionamento. Novo agendamento não restaura consentimento.

Não altera a conta compartilhada, nome, telefone, e-mail de autenticação, fotos globais, registros de outras unidades, agendamentos, contas financeiras, pontos/repasses ou auditoria operacional. O resultado é explicitamente `ATENDIDA_PARCIAL`, `exclusaoIntegral: false`, com motivo de conservação e indicação de revisão pelo encarregado. Não apresentar isso ao titular como exclusão integral ou anonimização completa. Eliminação integral da conta global e análise individual dos dados conservados não são automatizadas por esta fase.

Há proteção contra envios em andamento: solicitações com mensagem `PROCESSANDO` são recusadas temporariamente, sem concluir parcialmente, até terminar o contato com o provedor. Não é possível recolher mensagem já entregue ou eliminar dados do próprio provedor por essa API. Exige acompanhamento externo do controlador quando necessário. Cada pedido suporta até mil envios e mil itens de importação; volumes maiores exigem tratamento específico em lotes pelo encarregado, sem apagar só uma parte silenciosamente. Repetir protocolo já concluído não duplica a limpeza/auditoria.

Arquivos VCF originais, seeds locais, logs de infraestrutura, backups e sistemas externos não são alcançados pela limpeza. Devem constar do inventário e procedimento de retenção/exclusão do controlador.

## Base De Governança E Limites Jurídicos

As funcionalidades apoiam acesso e eliminação, mas **não certificam adequação integral à LGPD**. O responsável deve avaliar finalidade, base legal, legitimidade do pedido e hipóteses concretas de conservação. A ANPD descreve o direito à eliminação e as exceções do art. 16, sem autorizar guardar todos os dados indefinidamente: [Direitos dos titulares — ANPD](https://www.gov.br/anpd/pt-br/assuntos/titular-de-dados/direito-dos-titulares). A [LGPD, arts. 15, 16 e 18](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm) é a referência para revisão jurídica, não um prazo universal definido pelo software.

## Aceite Manual — Não Executado

1. Aplicar schema/client e reiniciar; conferir política inativa e ausência de exclusão automática.
2. Com contas e contatos de teste, enviar callbacks repetidos ENTREGUE, ABERTO e CLICADO: contar cada envio uma vez, mantendo abertura desconhecida quando sem evento.
3. Criar reserva depois de clique dentro/fora dos sete dias, dois cliques de campanhas diferentes e clique posterior à reserva: uma única atribuição válida. Conferir descontos de fidelidade e pagamento parcial separados.
4. Conferir clientes novos, duas visitas, retorno da base anterior e reativação após sessenta dias; testar intervalo vazio sem dividir por zero.
5. Tentar IDs de outros tenants, datas sem fuso e perfis sem as permissões financeiras/de gestão: recusar sem vazamento.
6. Abrir pedido de exportação e tentar baixar antes de validar identidade. Validar, reunir todas as seções/páginas, conferir ausência de senhas e registros de outra unidade e registrar entrega.
7. Tentar exclusão sem confirmação/identidade. Com mensagem PROCESSANDO, conferir recusa sem mudanças; depois repetir e conferir estado parcial, conservação explicitada, revogação, supressão e conteúdo expurgado.
8. Repetir exclusão, tentar reativar cliente por edição comum, reenviar conteúdo expurgado e registrar callback tardio com payload pessoal: não restaurar dados nem repetir auditoria da exclusão.
9. Aprovar política de teste e expurgar lotes vencidos. Conferir métricas de eventos preservadas e mensagens futuras/em processamento intactas.
10. Verificar no MySQL com dois dispositivos os bloqueios de exclusão × worker × callback, rollback integral e integridade das FKs. Rever plano de execução com volume e fazer conferência jurídica/operacional do que permanece conservado.

Foram preparados testes isolados de contratos, agregados, permissões, tenant, protocolos, exportação, confirmação, retenção, expurgo e callback tardio; não executados. Mocks não validam SQL, concorrência, entrega real ou adequação jurídica.
