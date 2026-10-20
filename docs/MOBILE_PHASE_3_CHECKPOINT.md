# Checkpoint Mobile - Fase 3

- Status de implementacao: consolidado
- Data do checkpoint: 2026-10-09
- Branch: `develop`
- Commit de referencia: `257ff4f feat: concluir descoberta de estabelecimentos no mobile`

## Entregas Protegidas

- Lista publica de estabelecimentos aprovadas.
- Busca por nome, cidade, bairro e servico.
- Filtros por distancia, avaliacao e funcionamento atual.
- Localizacao do aparelho em primeiro plano.
- Perfil publico com servicos, profissionais, horarios e avaliacoes.
- Selecao persistente da estabelecimento.
- Agendamento pelo tenant publico selecionado.
- Denuncia de perfil.
- Jornada de cliente disponivel para perfis operacionais sem misturar tenants.
- Separacao entre `x-estabelecimento-slug` publico e `x-estabelecimento-id` operacional.

## Validacoes Registradas

- Typecheck mobile com `--noEmit` aprovado.
- Typecheck backend com `--noEmit` aprovado.
- Leitura de servicos e profissionais por `CUSTOMER` em tenant selecionado: HTTP 200.
- Leitura de servicos e profissionais por `ESTABLISHMENT_MEMBER` em tenant diferente do operacional: HTTP 200.
- Roteiro manual mantido em `apps/mobile/README.md`.

## Pendencias Nao Bloqueantes Do Checkpoint

- Aceite visual completo em aparelhos Android e iOS continua sendo responsabilidade da homologacao manual.
- O mapa nativo nao faz parte deste checkpoint e sera reavaliado no marketplace multissegmento.
- As telas operacionais e administrativas provisorias nao representam conclusao dessas areas.

## Politica De Manutencao

Este checkpoint aceita apenas correcoes de defeito, seguranca, compatibilidade e regressao. Novas funcionalidades mobile devem seguir `docs/ROADMAP_MULTISSEGMENTO.md` e o ADR 0001.

