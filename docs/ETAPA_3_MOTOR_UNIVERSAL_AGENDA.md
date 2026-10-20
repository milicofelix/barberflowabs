# Etapa 3 - Motor Universal De Agenda

## Resultado

O agendamento deixa de comparar apenas horarios iniciais e passa a trabalhar com intervalos completos de ocupacao. O fluxo legado permanece compativel, inclusive a relacao implicita entre agendamentos e servicos.

O novo motor considera:

- duracao real de cada servico em minutos;
- preparacao anterior, posterior e entre servicos consecutivos;
- profissional explicitamente habilitado para todos os servicos;
- unidade fisica ou atendimento domiciliar;
- deslocamento anterior e posterior;
- multiplos servicos ordenados;
- recursos e respectivas capacidades;
- conflitos de profissional, bloqueios e recursos;
- reagendamento com historico;
- fuso horario configuravel por `APP_TIME_ZONE`, com padrao `America/Sao_Paulo`.

## Persistencia Aditiva

- `profissionais_servicos`: habilitacao direta entre profissional e servico.
- `recursos`: salas, cadeiras, macas ou equipamentos, globais ou vinculados a uma unidade.
- `servicos_recursos`: tipo e quantidade exigidos por servico.
- `agendamentos_servicos`: ordem e snapshot de duracao, preparacao e preco.
- `agendamentos_recursos`: capacidade reservada durante o intervalo ocupado.
- `historico_reagendamentos`: estado anterior, novo periodo, unidade, autor e motivo.

Os campos `dataFim`, `inicioOcupacao` e `fimOcupacao` foram adicionados ao agendamento. A migration converte os registros existentes usando `qtdeSlots * 15` e habilita os profissionais atuais para os servicos do proprio tenant.

## Calculo Do Periodo

- `data`: inicio apresentado ao cliente.
- `dataFim`: inicio mais duracao dos servicos e preparacoes entre servicos.
- `inicioOcupacao`: inicio menos preparacao inicial e deslocamento.
- `fimOcupacao`: fim mais preparacao final e deslocamento.

Conflitos usam o criterio de sobreposicao:

```text
existente.inicioOcupacao < novo.fimOcupacao
e existente.fimOcupacao > novo.inicioOcupacao
```

As linhas do profissional e dos recursos do tenant sao bloqueadas com `FOR UPDATE` antes da gravacao, reduzindo reservas concorrentes para o mesmo periodo.

## APIs

### Consultar um periodo

`POST /agenda/disponibilidade`

```json
{
  "data": "2026-10-15T14:00:00-03:00",
  "profissionalId": 1,
  "servicoIds": [1, 2],
  "unidadeId": 1,
  "modeloAtendimento": "PRESENCIAL"
}
```

### Criar agendamento

`POST /agendamentos`

```json
{
  "data": "2026-10-15T14:00:00-03:00",
  "usuario": { "id": 2 },
  "profissional": { "id": 1 },
  "servicos": [{ "id": 1 }, { "id": 2 }],
  "unidadeId": 1,
  "modeloAtendimento": "PRESENCIAL"
}
```

Para atendimento domiciliar, use `modeloAtendimento: "DOMICILIAR"`, informe `enderecoAtendimento` e, opcionalmente, `deslocamentoMinutos`.

### Reagendar

`PUT /agendamentos/:id/reagendar`

```json
{
  "data": "2026-10-16T16:00:00-03:00",
  "unidadeId": 1,
  "motivo": "Solicitacao do cliente"
}
```

### Recursos

- `GET /recursos`
- `POST /recursos`
- `PUT /recursos/:id`
- `DELETE /recursos/:id`

```json
{
  "nome": "Maca 1",
  "tipo": "MACA",
  "capacidade": 1,
  "unidadeId": 1,
  "ativo": true
}
```

Recursos com reservas historicas sao desativados em vez de excluidos.

## Configuracao Pelo Catalogo

`PUT /catalogo/profissionais/:id/especialidades` aceita `servicoIds` para declarar habilitacao direta.

`PUT /catalogo/servicos/:id` passa a aceitar:

```json
{
  "modeloAtendimento": "HIBRIDO",
  "duracaoMinutos": 60,
  "preparoAntesMinutos": 10,
  "preparoDepoisMinutos": 15,
  "deslocamentoMinutos": 30,
  "observacoes": "Confirmar endereco antes da saida.",
  "especialidadeIds": [1],
  "requisitos": [],
  "recursosNecessarios": [
    { "tipoRecurso": "MACA", "quantidade": 1 }
  ]
}
```

## Aplicacao Manual

Nenhum comando foi executado automaticamente. Depois de revisar e fazer backup:

```bash
docker compose exec -T app sh -lc 'cd apps/backend && npx prisma migrate deploy'
docker compose exec -T app sh -lc 'cd apps/backend && npx prisma generate'
docker compose restart app
```

Nao use `prisma migrate dev` no banco compartilhado.

## Validacao Manual Sugerida

Somente execute quando desejar validar a etapa:

1. Configure duracao e preparacao de dois servicos.
2. Habilite ambos para um profissional.
3. Cadastre um recurso e associe seu tipo a um servico.
4. Consulte a disponibilidade e crie um agendamento com os dois servicos.
5. Tente criar outro atendimento parcialmente sobreposto para o mesmo profissional.
6. Tente reservar o mesmo recurso no mesmo intervalo com capacidade esgotada.
7. Reagende e confirme o registro em `historico_reagendamentos`.
8. Crie um atendimento domiciliar e confirme a inclusao do deslocamento na ocupacao.
