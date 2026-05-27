#!/usr/bin/env sh
set -eu

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ACTIVE_FILE="${ACTIVE_FILE:-nginx/active-upstream.conf}"
REMOTE="${REMOTE:-origin}"
BRANCH="${BRANCH:-main}"
SKIP_PULL="${SKIP_PULL:-0}"
KEEP_OLD="${KEEP_OLD:-0}"
HEALTH_RETRIES="${HEALTH_RETRIES:-30}"

compose() {
  docker compose -f "$COMPOSE_FILE" "$@"
}

current_active_color() {
  if [ ! -f "$ACTIVE_FILE" ]; then
    echo "none"
    return
  fi

  if grep -q "app_green" "$ACTIVE_FILE"; then
    echo "green"
    return
  fi

  if grep -q "app_blue" "$ACTIVE_FILE"; then
    echo "blue"
    return
  fi

  echo "none"
}

write_active_upstream() {
  color="$1"
  mkdir -p "$(dirname "$ACTIVE_FILE")"
  printf 'set $portfolio_upstream app_%s:3000;\n' "$color" > "$ACTIVE_FILE"
}

wait_for_app() {
  service="$1"
  attempt=1

  while ! compose exec -T "$service" node -e "fetch('http://127.0.0.1:3000/api/health?format=json').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"; do
    if [ "$attempt" -ge "$HEALTH_RETRIES" ]; then
      echo "Healthcheck failed for $service after $HEALTH_RETRIES attempts." >&2
      exit 1
    fi

    attempt=$((attempt + 1))
    sleep 2
  done
}

if [ "$SKIP_PULL" != "1" ]; then
  git pull --ff-only "$REMOTE" "$BRANCH"
fi

active_color="$(current_active_color)"

case "$active_color" in
  blue)
    target_color="green"
    old_service="app_blue"
    ;;
  green)
    target_color="blue"
    old_service="app_green"
    ;;
  *)
    target_color="${INITIAL_COLOR:-blue}"
    old_service=""
    ;;
esac

target_service="app_${target_color}"

echo "Active color: $active_color"
echo "Target color: $target_color"

compose build "$target_service"
compose up -d postgres "$target_service"
compose exec -T "$target_service" pnpm prisma migrate deploy
wait_for_app "$target_service"

write_active_upstream "$target_color"

if docker ps -a --format "{{.Names}}" | grep -qx "portfolio-prod-app"; then
  echo "Stopping legacy single-container app before starting nginx."
  docker stop portfolio-prod-app >/dev/null 2>&1 || true
  docker rm portfolio-prod-app >/dev/null 2>&1 || true
fi

if compose ps --services --filter status=running | grep -qx "nginx"; then
  compose exec -T nginx nginx -s reload
else
  compose up -d nginx
fi

compose exec -T nginx wget -q --spider http://127.0.0.1/nginx-health

if [ -n "$old_service" ] && [ "$KEEP_OLD" != "1" ]; then
  compose stop "$old_service"
fi

echo "Production now routes to $target_service."
