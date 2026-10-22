#!/usr/bin/env bash
set -euo pipefail

RAIZ="$(cd "$(dirname "$0")/../.." && pwd)"
FRONTEND="$RAIZ/apps/frontend"
SAIDA="$RAIZ/.deploy"
STANDALONE="$FRONTEND/.next/standalone"

test -f "$STANDALONE/apps/frontend/server.js" || {
  echo "ERRO: servidor standalone não encontrado. Execute o build:web primeiro."
  exit 1
}

test -d "$FRONTEND/.next/static" || {
  echo "ERRO: arquivos estáticos do Next.js não encontrados."
  exit 1
}

VERSAO="$(git -C "$RAIZ" rev-parse --short HEAD)"
ARQUIVO="$SAIDA/uniflowabs-web-$VERSAO.tar.gz"

mkdir -p "$SAIDA"
TEMP="$(mktemp -d)"
trap 'rm -rf "$TEMP"' EXIT

cp -R "$STANDALONE/." "$TEMP/"
mkdir -p "$TEMP/apps/frontend/.next"
cp -R "$FRONTEND/.next/static" "$TEMP/apps/frontend/.next/static"

if [ -d "$FRONTEND/public" ]; then
  cp -R "$FRONTEND/public" "$TEMP/apps/frontend/public"
fi

tar -czf "$ARQUIVO" -C "$TEMP" .

echo "Pacote gerado: $ARQUIVO"
du -h "$ARQUIVO"
