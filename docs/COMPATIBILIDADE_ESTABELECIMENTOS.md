# Compatibilidade Entre Barbearia E Estabelecimento

> Documento historico. A camada transitoria descrita aqui foi encerrada pelo ADR 0002 e pela Etapa 7 de canonicalizacao.

> As regras, aliases e nomes legados abaixo registram apenas o periodo de transicao e nao descrevem mais o contrato ativo. Consulte o ADR 0002 para o estado canonico atual.

## Decisao

`Estabelecimento` e o vocabulario canonico para novos contratos externos. A persistencia e os modulos existentes continuam usando `Barbearia`, `barbeariaId` e `barbearias` durante a transicao.

Esta etapa e aditiva. Nenhuma tabela, coluna, rota ou propriedade legada foi removida ou renomeada.

## Mapa De Compatibilidade

| Conceito externo novo | Representacao interna temporaria |
| --- | --- |
| estabelecimento | `Barbearia` |
| identificador do estabelecimento | `barbeariaId` |
| colecao de estabelecimentos | `barbearias` |
| `GET /public/estabelecimentos` | `PublicoPrisma.listarBarbearias` |
| `GET /public/estabelecimentos/:slug` | `PublicoPrisma.buscarBarbeariaPorSlug` |
| `POST /public/estabelecimentos/:slug/denuncias` | `PublicoPrisma.denunciarPerfil` |

As rotas `/public/barbearias` permanecem ativas para os consumidores atuais. Novos consumidores devem usar `/public/estabelecimentos`.

## Classificacao Canonica

Tipos iniciais de estabelecimento:

- `BARBEARIA`
- `SALAO_BELEZA`
- `ESMALTERIA`
- `CLINICA_ESTETICA`
- `SPA_BEM_ESTAR`
- `ESTUDIO_BELEZA`
- `PROFISSIONAL_AUTONOMO`
- `OUTRO`

Modelos de atendimento:

- `PRESENCIAL`
- `DOMICILIAR`
- `HIBRIDO`

Registros existentes recebem `BARBEARIA` e `PRESENCIAL`. O segmento `barbearia` e associado como principal durante a migration.

## Novos Conceitos Persistidos

- `segmentos`: categorias amplas do marketplace.
- `especialidades`: classificacoes pertencentes a um segmento.
- `estabelecimentos_segmentos`: associacao entre a tabela legada `barbearias` e segmentos.
- `estabelecimentos_especialidades`: associacao entre a tabela legada e especialidades.
- `requisitos`: instrucoes ou condicoes reutilizaveis.
- `servicos_requisitos`: requisitos associados a um servico.
- `profissionais_especialidades`: especialidades exercidas por cada profissional.
- `servicos_especialidades`: especialidades atendidas por cada servico.

As tabelas de associacao preservam `barbeariaId` de proposito. A troca desse nome ocorrera somente depois que todos os consumidores e consultas estiverem no contrato canonico.

## Evolucao E Versionamento

1. Rotas antigas e novas convivem nesta etapa.
2. Campos novos sao opcionais para clientes antigos e aditivos nas respostas.
3. Nenhum prazo de desativacao das rotas antigas foi definido.
4. Uma futura remocao exigira telemetria de uso, aviso de depreciacao e uma versao maior da API.
5. Tipos e modelos permanecem strings validadas na aplicacao, permitindo expansao controlada sem migration de enum.

## Aplicacao Manual

Nao execute `prisma migrate dev` contra o banco compartilhado. Depois de revisar e fazer backup:

```bash
docker compose exec -T app sh -lc 'cd apps/backend && npx prisma migrate deploy'
docker compose exec -T app sh -lc 'cd apps/backend && npx prisma generate'
```

O arquivo `rollback.sql` ao lado da migration existe para recuperacao manual. Ele remove os novos dados e, portanto, so deve ser usado depois de backup e validacao explicita.
