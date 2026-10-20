# Backend UniFlow ABS

API NestJS com Prisma e MySQL. No desenvolvimento padrao, ela e iniciada pelo servico `app` do Docker Compose na porta `4000`.

## Variaveis De Ambiente

O backend precisa destas variaveis:

| Variavel | Uso |
| --- | --- |
| `DATABASE_URL` | Conexao do Prisma com o MySQL. |
| `JWT_SECRET` | Assinatura e validacao dos tokens de acesso e refresh. |
| `SUPER_ADMIN_EMAILS` | Lista, separada por virgula, de administradores da plataforma. |
| `APP_TIME_ZONE` | Fuso dos calculos de agenda; o fallback atual e `America/Sao_Paulo`. |

O arquivo `.env.sample` e somente um modelo versionado. Ele nao e carregado automaticamente pelo NestJS.

### Execucao Com Docker Compose

O `docker-compose.yml` injeta `DATABASE_URL`, `JWT_SECRET` e `SUPER_ADMIN_EMAILS` diretamente no container. Por isso o backend funciona mesmo sem `apps/backend/.env`.

O Compose aceita sobrescrever os valores por variaveis do terminal:

```bash
DATABASE_URL='mysql://usuario:senha@host:3306/banco' \
JWT_SECRET='segredo-local-forte' \
SUPER_ADMIN_EMAILS='admin@exemplo.com' \
docker compose up app
```

Tambem e possivel criar um `.env` na raiz do monorepo. O Docker Compose le esse arquivo para interpolar `${DATABASE_URL}`, `${JWT_SECRET}` e `${SUPER_ADMIN_EMAILS}`. Esse `.env` da raiz pertence ao Compose; ele nao deve ser confundido com `apps/backend/.env`.

Prioridade no fluxo Docker:

1. Variavel informada no comando ou exportada no shell.
2. `.env` localizado na raiz, ao lado do `docker-compose.yml`.
3. Valor de desenvolvimento definido como fallback no `docker-compose.yml`.

### Execucao Direta, Sem Docker

O projeto nao usa `ConfigModule` nem carrega dotenv no bootstrap. Portanto, criar apenas `apps/backend/.env` nao basta para executar o Nest diretamente.

Exporte as variaveis antes do comando:

```bash
export DATABASE_URL='mysql://usuario:senha@host:3306/banco'
export JWT_SECRET='segredo-local-forte'
export SUPER_ADMIN_EMAILS='admin@exemplo.com'
yarn dev
```

Outra opcao futura e adicionar uma camada central de configuracao com `@nestjs/config`; isso deve ser feito como uma mudanca propria, com validacao das variaveis obrigatorias.

## Seguranca

- Nunca versionar `.env`, `.env.local` ou segredos reais.
- O fallback de `JWT_SECRET` do Compose serve apenas ao desenvolvimento local.
- Producao deve fornecer um segredo forte e exclusivo.
- Depois de trocar `JWT_SECRET`, tokens emitidos anteriormente se tornam invalidos e os usuarios precisam autenticar novamente.

## Enderecos Locais

- API: `http://localhost:4000`
- Verificacao simples: `GET http://localhost:4000/ping`
- Frontend web: `http://localhost:3000`

Abrir a raiz da porta `4000` retorna `404 Cannot GET /` por design; isso nao significa que o backend esteja fora do ar.
