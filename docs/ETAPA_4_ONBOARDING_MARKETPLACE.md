# Etapa 4 - Onboarding E Marketplace

## Resultado

O onboarding passa a classificar o estabelecimento desde a adesao, e o aplicativo mobile consome um marketplace multissegmento em vez de uma listagem exclusiva de barbearias.

## Onboarding

`POST /saas/onboarding` recebe, alem dos dados existentes:

```json
{
  "barbearia": {
    "nome": "Studio Exemplo",
    "slug": "studio-exemplo",
    "tipoEstabelecimento": "ESTUDIO_BELEZA",
    "modeloAtendimento": "HIBRIDO",
    "segmentoIds": [2],
    "especialidadeIds": [4, 5]
  },
  "dono": {
    "nome": "Responsavel",
    "email": "responsavel@exemplo.com",
    "senha": "senha-segura"
  },
  "planoSlug": "mensal"
}
```

Segmentos e especialidades sao validados em conjunto. O responsavel recebe o papel `BARBERSHOP_OWNER` e o perfil continua pendente de revisao antes da publicacao.

## Marketplace Publico

- `GET /public/marketplace/categorias`
- `GET /public/marketplace`
- `GET /public/estabelecimentos/:slug`
- `POST /public/estabelecimentos/:slug/denuncias`

Filtros aceitos: `q`, `cidade`, `estado`, `segmento`, `especialidade`, `precoMin`, `precoMax`, `notaMin`, `abertaAgora`, `disponivelEm`, `lat`, `lng`, `raioKm`, `ordenarPor`, `pagina` e `limite`.

`disponivelEm` deve ser uma data futura ISO 8601. O marketplace remove estabelecimentos sem profissional habilitado e livre para pelo menos um dos servicos retornados no horario solicitado. A confirmacao final continua sendo responsabilidade do motor universal de agenda, que tambem verifica unidade e recursos.

## Mapa Mobile

O mapa usa `react-native-maps` 1.27.2, versao recomendada pelo Expo SDK 57. A dependencia foi declarada, mas nao instalada automaticamente.

Instalacao manual, quando desejado:

```bash
docker compose exec -T app sh -lc 'cd apps/mobile && npx expo install react-native-maps'
```

No Expo Go nao e necessaria configuracao adicional. Para binarios publicados com Google Maps, configure as chaves Android/iOS seguindo a documentacao oficial do Expo antes de gerar o build.

## Validacao Manual Sugerida

1. Cadastre um estabelecimento selecionando segmento, especialidades e modalidade.
2. Aprove o perfil no fluxo administrativo.
3. Abra a aba Descobrir e alterne entre lista e mapa.
4. Filtre por categoria, especialidade, preco e avaliacao.
5. Informe um horario futuro e confira se profissionais ocupados deixam de aparecer.
6. Abra o perfil, selecione o estabelecimento e inicie o agendamento.
7. Envie uma denuncia pelo perfil generalizado.

Nenhum teste, build, migration, seed ou instalacao foi executado durante esta etapa.
