# Barber Flow ABS Mobile

Aplicativo Expo/React Native com navegação por React Navigation.

## Desenvolvimento com Docker

Na raiz do monorepo, substitua `SEU_IP` pelo endereço IPv4 atual do computador:

```bash
EXPO_PACKAGER_HOSTNAME=SEU_IP \
API_URL=http://SEU_IP:4000 \
docker compose up --force-recreate app
```

O celular e o computador precisam estar na mesma rede local. O Metro fica disponível na porta `8081` e a API na porta `4000`.

## Localização

A descoberta de barbearias usa o módulo oficial `expo-location` para solicitar somente a localização em primeiro plano. Depois de atualizar o código, instale a dependência dentro do ambiente do projeto:

```bash
docker compose exec app yarn workspace mobile expo install expo-location
```

Não é utilizada localização em segundo plano. O mapa nativo será adicionado em uma etapa posterior.

## Tenant selecionado

A barbearia escolhida pelo cliente é persistida no AsyncStorage. As requisições autenticadas de agendamento enviam o tenant atual nos headers `x-barbearia-id` ou `x-barbearia-slug`.
