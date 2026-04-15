# 1Win Crash Observer SaaS

Production-ready SaaS platform for **live 1win crash game observation and alerts**.

## Safety & Positioning

- This platform is **observational only**.
- It does **not** predict, guarantee, or automate wins.
- Users are fully responsible for strategy setup and risk decisions.
- The system provides tools to observe live game data and trigger alerts.

## Stack

- Backend: Node.js + TypeScript + Express + WebSocket + Playwright + MongoDB
- Frontend: React + Vite + TypeScript
- Infra: Docker, docker-compose, Nginx reverse proxy, GitHub Actions deploy

## Folder Structure

- `apps/backend` – observer, API, strategy engine, alert service
- `apps/frontend` – dashboard, auth, strategy UI, live analytics
- `nginx` – reverse proxy config
- `.github/workflows/deploy.yml` – auto deploy to VPS on `main`
- `setup-vps.sh` – VPS bootstrap script

## Backend Features

- Auto-discovers live 1win crash WebSocket URL via Playwright
- Reconnect handling and graceful retries for dropped sessions
- Parses events: `round_start`, `multiplier_update`, `round_end`
- Stores recent crash rounds per game URL in MongoDB
- User auth (`/api/auth/signup`, `/api/auth/login`)
- Strategy CRUD (`/api/strategies`)
- Data APIs:
  - `/api/data/rounds`
  - `/api/data/analytics`
  - `/api/data/alerts`
- Real-time WebSocket server: `/ws` (JWT-protected)

## Strategy Engine

Supports user-configured conditions:

- `streak_below`
- `streak_above`
- `multiplier_below`
- `multiplier_above`
- `occurrences`
- per-strategy cooldown to avoid spam

## Alert Channels

- Telegram
- Discord webhook
- Custom webhook
- Email (SMTP)

All alert attempts are logged in `AlertLog`.

## Quick Start (Local)

1. Copy env file:
   - `cp apps/backend/.env.example apps/backend/.env`
2. Set required env values (`MONGODB_URI`, `JWT_SECRET`, `GAME_URLS`).
3. Run:
   - `docker compose up -d --build`
4. Open frontend through Nginx at `http://localhost`.

## Development

- Backend dev: `npm run dev -w backend`
- Frontend dev: `npm run dev -w frontend`
- Backend tests: `npm run test -w backend`

## 24×7 Deployment

Use the bootstrap script:

```bash
./setup-vps.sh https://github.com/<owner>/<repo>.git
```

Then configure DNS + run certbot for SSL.

## Required GitHub Secrets for Deploy Workflow

- `VPS_HOST`
- `VPS_USER`
- `VPS_SSH_KEY`
