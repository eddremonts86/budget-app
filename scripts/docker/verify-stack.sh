#!/usr/bin/env sh

set -eu

echo "[check] docker compose service status"
docker compose ps

require_container() {
  service="$1"
  state="$(docker compose ps --status running --services | grep -x "$service" || true)"
  if [ -z "$state" ]; then
    echo "[check] service is not running: $service"
    return 1
  fi
}

check_url() {
  name="$1"
  url="$2"
  code="$(curl -s -o /dev/null -w "%{http_code}" "$url" || true)"
  if [ "$code" = "200" ]; then
    echo "[check] $name OK ($code): $url"
  else
    echo "[check] $name FAILED ($code): $url"
    return 1
  fi
}

require_container app
require_container chromadb
require_container lmstudio

check_url app "http://localhost:3000"
check_url chromadb "http://localhost:8000/api/v2/heartbeat"
check_url lmstudio "http://localhost:1234/v1/models"

echo "[check] all services are reachable"
