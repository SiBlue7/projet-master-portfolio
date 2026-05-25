#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="${PREPROD_PROJECT_DIR:-/opt/projet-master-portfolio/preprod}"
BRANCH="${PREPROD_BRANCH:-dev}"
COMPOSE_FILE="${PREPROD_COMPOSE_FILE:-docker-compose.preprod.yml}"

cd "$PROJECT_DIR"

git fetch origin "$BRANCH"
git switch "$BRANCH"
git pull --ff-only origin "$BRANCH"

docker compose -f "$COMPOSE_FILE" up -d --build
docker compose -f "$COMPOSE_FILE" exec -T app pnpm prisma migrate deploy
docker compose -f "$COMPOSE_FILE" exec -T app pnpm db:seed:admin
docker image prune -f
