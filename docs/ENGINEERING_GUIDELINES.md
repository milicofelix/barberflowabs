# Diretrizes De Engenharia

Este documento orienta novas implementacoes e alteracoes feitas a partir de agora. Codigo legado fora destas diretrizes nao deve ser refatorado incidentalmente; os hotspots existentes serao tratados em uma fase especifica de refatoracao, com escopo e validacao proprios.

## Principio Central

Cada arquivo, classe, componente, hook e funcao deve possuir uma responsabilidade principal clara. Codigo extenso so e aceitavel quando o tamanho corresponde a uma responsabilidade coesa que perderia clareza se fosse artificialmente fragmentada.

Antes de ampliar um arquivo, avaliar:

- A nova regra pertence realmente a responsabilidade atual?
- A implementacao mistura interface, regra de negocio, persistencia e integracao?
- A parte nova pode ser nomeada e testada isoladamente?
- A extracao reduz acoplamento ou apenas espalha codigo?

Se um arquivo grande for mantido, a justificativa deve ser objetiva e registrada na entrega, revisao ou documento tecnico relacionado.

## SOLID

### Responsabilidade unica

- Controllers recebem e validam a requisicao, delegam o caso de uso e formatam a resposta.
- Casos de uso e services concentram regras de negocio.
- Repositories concentram persistencia e consultas.
- Componentes React cuidam da apresentacao e interacao local.
- Hooks e contextos concentram estado reutilizavel, efeitos e integracoes da interface.

### Aberto para extensao

- Preferir composicao, estrategias e configuracao a grandes blocos condicionais por segmento.
- Novos segmentos de negocio nao devem exigir copias completas de controllers, telas ou motores de agenda.

### Substituicao segura

- Implementacoes de uma mesma interface devem preservar contratos, erros e resultados esperados.
- Nao criar tipos derivados que exijam verificacoes especiais em todos os consumidores.

### Interfaces especificas

- Interfaces devem expor apenas as operacoes necessarias para cada consumidor.
- Evitar contratos genericos que obriguem modulos a depender de metodos que nao utilizam.

### Inversao de dependencia

- Regras de negocio nao devem depender diretamente de framework, banco, HTTP ou componentes visuais.
- Dependencias externas devem entrar por contratos ou adaptadores quando houver mais de uma implementacao, necessidade de teste ou fronteira arquitetural relevante.

## Tamanho E Complexidade

Nao existe limite automatico absoluto de linhas. Os numeros abaixo sao sinais para revisao, nao metas mecanicas:

- Funcoes com mais de aproximadamente 30 linhas devem ser avaliadas para extracao de etapas nomeadas.
- Componentes, hooks ou classes com mais de aproximadamente 200 linhas devem ter sua coesao justificada.
- Arquivos que misturam mais de uma camada devem ser separados independentemente da quantidade de linhas.
- Condicionais profundamente aninhadas devem ser substituidas por retornos antecipados, funcoes nomeadas ou estrategias quando isso melhorar a leitura.

Nao dividir codigo apenas para atender contagem de linhas. Fragmentacao excessiva, indirecao sem beneficio e abstracoes prematuras tambem prejudicam a manutencao.

## Backend

- Manter controllers finos.
- Nao colocar consultas Prisma diretamente em controllers.
- Separar validacao de entrada, autorizacao, resolucao de tenant e regra de negocio.
- Toda leitura ou escrita operacional deve declarar claramente o tenant utilizado.
- Mudancas de contrato devem atualizar consumidores e documentacao no mesmo ciclo.
- Regras criticas devem possuir testes direcionados, especialmente isolamento multi-tenant, permissoes e concorrencia de agenda.

## Frontend E Mobile

- Separar tela, componentes de apresentacao, hooks de dados e regras de dominio.
- Evitar componentes que concentrem busca, transformacao, formulario, navegacao e renderizacao extensa.
- Estados de carregamento, vazio, erro e sucesso devem usar componentes compartilhados quando o comportamento for equivalente.
- Navegacao e respostas da API devem permanecer tipadas.
- Regras de tenant e autenticacao nao devem ser duplicadas em telas.

## Alteracao De Codigo Legado

Ao tocar em codigo antigo:

- Alterar somente o necessario para a entrega atual.
- Nao ampliar uma responsabilidade incorreta existente quando for possivel adicionar a nova regra em uma unidade coesa.
- Registrar refatoracoes maiores como backlog separado.
- Fazer refatoracao local apenas quando ela for necessaria para implementar ou testar a mudanca com seguranca.
- Evitar misturar uma grande refatoracao estrutural com uma funcionalidade sem justificativa tecnica.

## Execucao De Testes E Builds

Testes e comandos de validacao podem ser criados ou atualizados como parte da implementacao, mas nao devem ser executados automaticamente.

- Nao executar testes automatizados, testes manuais, testes de browser ou chamadas de verificacao de API sem solicitacao explicita do usuario.
- Nao executar build, typecheck, lint, formatadores, validadores de schema, migrations, seed, instalacao de dependencias ou inicializacao/reinicio de servicos sem solicitacao explicita do usuario.
- Revisoes estaticas e inspecoes somente leitura continuam permitidas, desde que nao disparem scripts do projeto.
- Ao concluir uma alteracao, informar quais validacoes nao foram executadas e fornecer os comandos sugeridos para o usuario executar manualmente, quando forem relevantes.
- Uma autorizacao vale somente para as verificacoes explicitamente solicitadas naquele momento; nao deve ser presumida para etapas futuras.

## Criterio De Entrega

Antes de concluir uma implementacao nova:

- A responsabilidade de cada unidade alterada esta clara.
- Nao foi criada duplicacao relevante.
- Dependencias apontam para a camada correta.
- Tenant, permissoes e erros foram considerados.
- A validacao proporcional ao risco foi documentada e somente foi executada quando solicitada explicitamente pelo usuario.
- Excecoes a estas diretrizes foram justificadas.
