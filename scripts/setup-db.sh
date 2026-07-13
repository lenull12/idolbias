#!/bin/bash
set -e

echo "=== Suppression de l'ancienne DB ==="
echo "y" | npx wrangler d1 delete idolbias-db 2>/dev/null || true

echo "=== Création de la nouvelle DB ==="
OUTPUT=$(npx wrangler d1 create idolbias-db 2>&1)
echo "$OUTPUT"

# Extraire le database_id
DB_ID=$(echo "$OUTPUT" | grep -oP 'database_id:\s*\K[a-f0-9-]+')

if [ -z "$DB_ID" ]; then
  echo "ERREUR: impossible d'extraire le database_id"
  exit 1
fi

echo "Nouveau database_id: $DB_ID"

# Mettre à jour wrangler.jsonc
sed -i "s|\"database_id\": \"[a-f0-9-]*\"|\"database_id\": \"$DB_ID\"|" wrangler.jsonc

echo "=== wrangler.jsonc mis à jour ==="

echo "=== Application des migrations ==="
npx wrangler d1 migrations apply idolbias-db --remote

echo "=== DB prête ! ==="
