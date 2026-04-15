#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <git-repository-url>"
  exit 1
fi

REPO_URL="$1"
APP_DIR="/opt/1win-crash-observer"

sudo apt-get update -y
sudo apt-get install -y ca-certificates curl git nginx certbot python3-certbot-nginx

if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sudo sh
  sudo usermod -aG docker "$USER"
fi

if ! command -v docker compose >/dev/null 2>&1; then
  sudo apt-get install -y docker-compose-plugin
fi

if [[ ! -d "$APP_DIR/.git" ]]; then
  sudo git clone "$REPO_URL" "$APP_DIR"
else
  sudo git -C "$APP_DIR" pull --rebase
fi

if [[ ! -f "$APP_DIR/apps/backend/.env" ]]; then
  sudo cp "$APP_DIR/apps/backend/.env.example" "$APP_DIR/apps/backend/.env"
  echo "Edit $APP_DIR/apps/backend/.env before production use."
fi

sudo docker compose -f "$APP_DIR/docker-compose.yml" up -d --build

echo "Run certbot manually after DNS is set: sudo certbot --nginx -d your-domain"
