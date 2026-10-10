# ADR 0002 - Canonicalizacao Definitiva De Estabelecimentos

- Status: aceito
- Data: 2026-10-10
- Substitui: ADR 0001 apenas quanto a preservacao indefinida da nomenclatura legada

## Contexto

A generalizacao multissegmento foi estabilizada antes da entrada em producao. Manter `Barbearia`, `barbeariaId`, `barbearias`, `BARBER` e `BARBERSHOP_OWNER` no dominio ativo passou a gerar ambiguidade e aumentaria o custo das proximas entregas.

## Decisao

O vocabulario interno e externo passa a ser `Estabelecimento`:

- modelo e tabela principal: `Estabelecimento` e `estabelecimentos`;
- chave de tenant: `estabelecimentoId`;
- headers: `x-estabelecimento-id` e `x-estabelecimento-slug`;
- papeis: `ESTABLISHMENT_OWNER` e `ESTABLISHMENT_MEMBER`;
- indicador transitorio de usuario operacional: `membroEstabelecimento`;
- pacote compartilhado: `@uniflowabs/core`;
- rotas publicas e autenticadas usam `estabelecimentos`.

`BARBEARIA` permanece apenas como um valor valido de `tipoEstabelecimento`, pois representa um segmento real do marketplace e nao uma dependencia arquitetural.

Migrations historicas permanecem imutaveis. A migration `20261010020000_canonicalize_establishment_domain` renomeia tabelas, colunas e valores de papeis preservando os dados existentes e possui rollback manual.

## Consequencias

- a migration e a geracao do Prisma Client devem ocorrer no mesmo ciclo de implantacao;
- backend, web, mobile e pacote compartilhado devem ser publicados juntos;
- consumidores das rotas e headers antigos precisam migrar antes dessa versao;
- dados de categoria `BARBEARIA` e estabelecimentos reais com identidade de barbearia nao sao renomeados.

