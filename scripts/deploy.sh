#!/bin/bash
set -e

echo "=== Build ==="
npx opennextjs-cloudflare build

echo "=== Déploiement ==="
npx opennextjs-cloudflare deploy

echo "=== Fait ! ==="
