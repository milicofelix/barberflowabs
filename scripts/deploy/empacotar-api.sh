#!/usr/bin/env bash
set -euo pipefail

RAIZ="$(cd "$(dirname "$0")/../.." && pwd)"
SAIDA="$RAIZ/.deploy"
VERSAO="$(git -C "$RAIZ" rev-parse --short HEAD)"
ARQUIVO="$SAIDA/uniflowabs-api-$VERSAO.tar.gz"

mkdir -p "$SAIDA"

docker compose -f "$RAIZ/compose.production.yaml" \
  --project-directory "$RAIZ" \
  run --rm --no-deps \
  -v "$SAIDA:/output" \
  build bash -lc '
    set -euo pipefail

    TEMP="$(mktemp -d)"
    trap '\''rm -rf "$TEMP"'\'' EXIT

    mkdir -p "$TEMP/apps/backend" "$TEMP/packages/core"

    cp /app/yarn.lock "$TEMP/"
    cp /app/apps/backend/package.json "$TEMP/apps/backend/"
    cp /app/packages/core/package.json "$TEMP/packages/core/"
    cp -a /app/apps/backend/dist "$TEMP/apps/backend/"
    cp -a /app/packages/core/dist "$TEMP/packages/core/"

    printf '\''{"private":true,"workspaces":["apps/*","packages/*"]}\n'\'' > "$TEMP/package.json"

    cd "$TEMP"
    yarn install --production --offline --frozen-lockfile --ignore-scripts --non-interactive --silent

    mkdir -p node_modules/.prisma
    cp -a /app/apps/backend/node_modules/.prisma/client node_modules/.prisma/

    mkdir -p node_modules/bcrypt/lib/binding/napi-v3
    cp -a /app/node_modules/bcrypt/lib/binding/napi-v3/bcrypt_lib.node node_modules/bcrypt/lib/binding/napi-v3/

    echo "Validando dependências..."
    cd apps/backend
    node -e '\''for (const p of ["@nestjs/core","@prisma/client","@prisma/adapter-mariadb","sharp","bcrypt","@uniflowabs/core"]) require(p); console.log("Dependências OK")'\''

    echo "Compactando API otimizada..."
    cd "$TEMP"
    tar -czf "/output/'"$(basename "$ARQUIVO")"'" --exclude=".env" --exclude=".env.*" --exclude="*/.env" --exclude="*/.env.*" node_modules apps/backend/dist apps/backend/package.json packages/core/dist packages/core/package.json

    echo "Compactação concluída."

  '

echo "Pacote gerado: $ARQUIVO"
du -h "$ARQUIVO"
