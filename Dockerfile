# syntax=docker/dockerfile:1.7
FROM node:22-bookworm-slim

# Ferramentas úteis para desenvolvimento dentro do container.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        bash \
        curl \
        git \
        procps \
        ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# O projeto usa Yarn Classic 1.22.22 (definido no package.json).
RUN corepack enable \
    && corepack prepare yarn@1.22.22 --activate

WORKDIR /workspace/barberFlowABS

# Copiamos primeiro os manifests para aproveitar o cache das dependências.
COPY package.json yarn.lock turbo.json ./
COPY apps/backend/package.json ./apps/backend/package.json
COPY apps/frontend/package.json ./apps/frontend/package.json
COPY apps/mobile/package.json ./apps/mobile/package.json
COPY packages/core/package.json ./packages/core/package.json
COPY packages/eslint-config/package.json ./packages/eslint-config/package.json
COPY packages/typescript-config/package.json ./packages/typescript-config/package.json
COPY packages/ui/package.json ./packages/ui/package.json

# Yarn Classic usa um timeout relativamente curto para redes instáveis.
# O cache BuildKit evita baixar novamente tudo a cada tentativa de build.
RUN --mount=type=cache,target=/usr/local/share/.cache/yarn \
    yarn config set network-timeout 600000 -g \
    && yarn install \
         --frozen-lockfile \
         --network-timeout 600000 \
         --network-concurrency 4

# O bind mount do docker-compose sobrescreve este conteúdo em desenvolvimento,
# mas o COPY mantém a imagem utilizável também fora do Compose.
COPY . .

RUN yarn --cwd apps/backend prisma:generate

EXPOSE 3000 4000 8081 19000 19001 19002 19006

CMD ["yarn", "turbo", "dev", "--ui=stream"]
