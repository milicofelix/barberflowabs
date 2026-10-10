# Etapa 2 - Catalogo Multissegmento

## Resultado

O backend passa a representar um catalogo reutilizavel antes da criacao de novas telas operacionais. A nomenclatura interna legada (`Estabelecimento` e `estabelecimentoId`) continua preservada para compatibilidade e isolamento de tenant.

Foram adicionados:

- especialidades de profissionais;
- especialidades de servicos;
- requisitos e observacoes de servicos;
- modalidade presencial, domiciliar ou hibrida;
- configuracao de segmentos e especialidades do estabelecimento;
- consultas publicas enriquecidas com o catalogo.

## Contratos

Consultas:

- `GET /catalogo/segmentos`
- `GET /catalogo/requisitos`
- `GET /catalogo/estabelecimento`

Alteracoes autenticadas:

- `PUT /catalogo/estabelecimento`
- `PUT /catalogo/profissionais/:id/especialidades`
- `PUT /catalogo/servicos/:id`

Os `PUTs` substituem integralmente as associacoes correspondentes. Enviar uma lista vazia remove as associacoes atuais daquele profissional ou servico.

### Estabelecimento

```json
{
  "tipoEstabelecimento": "SALAO_BELEZA",
  "modeloAtendimento": "HIBRIDO",
  "segmentoIds": [1],
  "especialidadeIds": [1, 2]
}
```

O primeiro item de `segmentoIds` e considerado o segmento principal.

### Profissional

```json
{
  "especialidadeIds": [1, 2],
  "especialidadePrincipalId": 1
}
```

Somente especialidades previamente habilitadas no estabelecimento podem ser usadas.

### Servico

```json
{
  "modeloAtendimento": "DOMICILIAR",
  "duracaoMinutos": 60,
  "preparoAntesMinutos": 10,
  "preparoDepoisMinutos": 15,
  "deslocamentoMinutos": 30,
  "observacoes": "Levar toalha e informar alergias antes do atendimento.",
  "especialidadeIds": [1],
  "requisitos": [
    {
      "requisitoId": 1,
      "obrigatorio": true,
      "observacao": "Informar no momento da reserva."
    }
  ]
}
```

Um estabelecimento `PRESENCIAL` nao pode cadastrar servico `DOMICILIAR`, e vice-versa. Estabelecimentos `HIBRIDO` podem oferecer as tres modalidades por servico.

## Aplicacao Manual

Depois de revisar e fazer backup do banco:

```bash
docker compose exec -T app sh -lc 'cd apps/backend && npx prisma migrate deploy'
docker compose exec -T app sh -lc 'cd apps/backend && npx prisma generate'
docker compose restart app
```

Nao use `prisma migrate dev` no banco compartilhado.

## Roteiro Manual De Teste

1. Obtenha um token de gestor pelo login.
2. Consulte `GET /catalogo/segmentos` e anote os IDs retornados.
3. Consulte `GET /catalogo/requisitos` e anote os IDs retornados.
4. Atualize o estabelecimento para `HIBRIDO`.
5. Vincule uma especialidade a um profissional do mesmo estabelecimento.
6. Vincule a especialidade e um requisito a um servico.
7. Consulte `GET /public/estabelecimentos/:slug` e confirme especialidades, modalidade, requisitos e observacoes.
8. Tente alterar um profissional de outro tenant e confirme a resposta `404`.

Exemplo, substituindo token e IDs:

```bash
curl -X PUT 'http://localhost:4000/catalogo/servicos/1' \
  -H 'Authorization: Bearer SEU_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"modeloAtendimento":"PRESENCIAL","duracaoMinutos":30,"observacoes":"Informar alergias.","especialidadeIds":[1],"requisitos":[{"requisitoId":1,"obrigatorio":true}]}'
```
