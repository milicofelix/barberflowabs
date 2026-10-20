# Privacidade E Seguranca — Importacao De Contatos

## Escopo E Finalidade

A importacao assistida permite que um operador autorizado cadastre, no estabelecimento ativo, clientes que solicitaram atendimento por telefone, WhatsApp ou presencialmente. O aplicativo consulta a agenda do aparelho somente depois de uma acao explicita e envia ao servidor apenas os contatos selecionados e confirmados.

Fotos, enderecos, notas e contatos nao selecionados nao sao enviados. A importacao nao concede consentimento para campanhas, push, e-mail ou WhatsApp.

## Papeis E Base Legal

- O estabelecimento atua como controlador dos dados usados na propria carteira de clientes.
- O UniFlow ABS atua como operador da plataforma, conforme contrato e politica de privacidade aplicaveis.
- O estabelecimento deve registrar uma base legal adequada para o cadastro e o atendimento. A execucao de contrato ou procedimentos preliminares pode ser aplicavel quando o cliente solicita o servico.
- Marketing e campanhas exigem fundamento proprio e, quando necessario, consentimento especifico, livre, informado e revogavel. A importacao nunca presume esse consentimento.
- Interesse legitimo somente deve ser usado apos avaliacao documentada de finalidade, necessidade, balanceamento e salvaguardas.

A base legal definitiva e os textos apresentados ao titular devem ser aprovados pelo responsavel juridico ou encarregado de dados antes da producao.

## Minimizacao E Isolamento

- O dispositivo le apenas nome, telefones e e-mails autorizados pelo sistema operacional.
- Cada envio possui no maximo 200 contatos.
- O historico do lote guarda referencia local, hash irreversivel, classificacao, operador e totais; nao replica nome, telefone ou e-mail.
- Clientes e lotes sao isolados pelo estabelecimento ativo. Uma correspondencia de outra unidade nao revela dados privados.
- Preferencias de comunicacao nascem desativadas.
- Logs tecnicos registram tipo, status, rota e codigo do erro, sem payload ou representacao integral do ORM.

## Retencao E Direitos Do Titular

- Contatos nao selecionados permanecem somente no aparelho e nao possuem retencao no UniFlow ABS.
- O vinculo operacional permanece enquanto existir a relacao com o estabelecimento ou obrigacao contratual aplicavel.
- Ao remover um cliente pela central, o sistema exclui o vinculo e as preferencias daquele estabelecimento e desvincula seu identificador dos itens de importacao.
- Agendamentos, documentos financeiros e trilhas que precisem ser preservados por obrigacao legal ou defesa de direitos nao devem ser apagados automaticamente; o acesso deve permanecer restrito e a eliminacao seguir a politica corporativa.
- Lotes de importacao e logs devem possuir prazo formal definido pela organizacao antes da producao. Recomendacao inicial: 180 dias para auditoria de importacao e 30 dias para logs tecnicos, salvo obrigacao legal documentada.
- Solicitacoes de acesso, correcao, oposicao, portabilidade ou eliminacao devem seguir o canal de privacidade publicado pelo controlador.

## Controles De Seguranca

- Permissao operacional e pertencimento ao estabelecimento sao revalidados no servidor.
- Chaves idempotentes e reservas transacionais evitam duplicacao em repeticoes e concorrencia.
- Simulacao e confirmacao possuem limite por operador e estabelecimento, alem do limite de tamanho do lote.
- O aplicativo pagina a leitura e limita a 2.000 contatos simultaneos em memoria.
- Em producao com mais de uma instancia do backend, o limitador em memoria deve ser substituido por armazenamento compartilhado, como Redis.

## Matriz De Aceite Em Dispositivo

Registrar data, versao do aplicativo, sistema, aparelho, responsavel e resultado de cada cenario.

| Plataforma | Cenario | Resultado esperado |
| --- | --- | --- |
| iOS | permissao total | lista somente campos necessarios; revisao antes do envio |
| iOS 18+ | permissao limitada | lista somente contatos autorizados pelo usuario |
| iOS | negada/bloqueada | cadastro manual continua disponivel; configuracoes podem ser abertas |
| iOS | revogada apos uso | nova leitura e bloqueada; clientes ja importados permanecem |
| Android | permitida | leitura paginada sem permissao de escrita |
| Android | negada/bloqueada | fluxo principal continua utilizavel |
| Android | revogada apos uso | nova leitura e bloqueada e estado e atualizado |
| Ambos | tema claro/escuro | textos, foco, selecao e estados possuem contraste legivel |
| Ambos | leitor de tela | botoes, busca, selecao e campos anunciam papel e estado |
| Ambos | lista grande | rolagem permanece responsiva e o limite local e informado |

## Aceite De Backend

1. Enviar lote vazio, acima de 200 itens e com referencias repetidas; esperar `400`.
2. Repetir a mesma chave com o mesmo conteudo; esperar o mesmo lote, sem duplicacao.
3. Repetir a chave com conteudo diferente; esperar `409`.
4. Confirmar simultaneamente o mesmo lote; esperar um unico vinculo por cliente.
5. Usar operador ou estabelecimento divergente; esperar bloqueio sem exposicao de dados.
6. Exceder 20 simulacoes ou confirmacoes em um minuto para o mesmo operador/unidade; esperar `429`.
7. Interromper e repetir a confirmacao; esperar retomada dos itens ainda nao importados.
8. Remover cliente pela central; esperar exclusao do vinculo e preferencias, preservando historico obrigatorio sem referencia direta no item de importacao.

