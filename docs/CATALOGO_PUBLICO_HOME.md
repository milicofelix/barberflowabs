# Serviços Públicos Da Home

Correção implementada em 15/10/2026; aceite manual pendente.

## Causa

A seção de serviços da Home reutilizava `useServicos`, que consulta `/servicos` com o contexto da unidade selecionada. Isso fazia a Home mostrar apenas os serviços dessa unidade, embora sua proposta fosse apresentar a plataforma inteira.

## Comportamento

- `GET /public/estabelecimentos/servicos` lista serviços de todas as unidades que atendem aos mesmos critérios de publicação do marketplace e dos especialistas públicos. Não utiliza o tenant dos cabeçalhos ou a última seleção do navegador.
- Cada serviço deve possuir pelo menos um vínculo ativo com um profissional. Unidades não aprovadas, bloqueadas ou sem a estrutura mínima de publicação continuam fora dessa listagem.
- Resposta com os campos públicos do serviço, preço numérico e identificação pública do estabelecimento: ID, slug e nome público. Nenhuma informação de clientes, contas ou financeiro privado é incluída.
- Home usa o hook específico `useServicosPublicos`, identifica a unidade em cada cartão e oferece link para seu perfil. Serviços com o mesmo nome em unidades diferentes continuam separados, com seus respectivos preços.
- Texto da seção contempla os diferentes segmentos; preços usam formatação `pt-BR`/BRL. Há mensagens de carregamento, lista vazia e erro com nova tentativa.
- `useServicos` e a rota `/servicos` continuam sendo usados no agendamento da unidade, preservando o escopo dessa operação.

Sem mudança de schema, migration ou dependência. O backend usa `nest start` sem watch; carregar a alteração com o comando de reinício de `app` já registrado em [COMANDOS.md](COMANDOS.md).

## Aceite Manual Pelo Usuário

1. Conferir na Home serviços de duas unidades publicadas, inclusive de segmentos diferentes.
2. Abrir uma unidade, voltar à Home e conferir que o catálogo continua reunindo as demais unidades. Repetir com outra unidade selecionada.
3. Conferir o nome da unidade, o link do perfil e os preços em reais em cada cartão.
4. Abrir o agendamento de uma unidade e conferir que os serviços continuam restritos àquela unidade.
5. Conferir que unidades pendentes/bloqueadas e serviços sem profissional habilitado não aparecem na Home.

Somente revisão estática. Não foram executados testes, builds, typecheck, lint, chamadas à API, migrations ou reinícios nesta entrega.
