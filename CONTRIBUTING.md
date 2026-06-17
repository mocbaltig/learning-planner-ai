# Contributing

## Setup Development

1. Fork dan clone repository
2. Copy `.env.example` ke `.env` dan isi
3. `docker compose up db -d`
4. `cd server && npm install && npm run migrate:up && npm run dev`
5. `cd client && npm install && npm run dev`

## Code Style

- ESLint untuk linting (`npm run lint`)
- Conventional commits: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`

## Pull Request

1. Buat branch dari `main`
2. Pastikan semua tests pass
3. Pastikan lint clean
4. Deskripsikan perubahan di PR description
