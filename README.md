# AI Learning Plan

> Aplikasi web yang membantu peserta bootcamp merencanakan dan menjalani belajar secara konsisten, dengan bantuan AI sebagai learning coach.

## Quick Start

### Prasyarat

- Node.js 20+
- Docker Desktop — pastikan sudah dibuka dan running
- Gemini API Key (<https://aistudio.google.com/apikey>)

### Setup

```bash
git clone <repository-url>
cd ai-learning-plan
cp server/.env.example server/.env
# Edit server/.env — isi GEMINI_API_KEY dan ubah JWT_SECRET

docker compose up db -d
cd server && npm install && npm run migrate:up
npm run dev

# Di terminal lain
cd client && npm install && npm run dev
```

### Akses

- Frontend: <http://localhost:5173>
- Backend: <http://localhost:3000>
- Health: <http://localhost:3000/health>

### Troubleshooting

- "Cannot connect to Docker daemon" — Buka Docker Desktop, tunggu running.
- "role user does not exist" — PostgreSQL lokal konflik. Ubah port di docker-compose.yml dan .env ke 5433.
- "address already in use" — `kill $(lsof -ti :3000)` atau `docker compose down`.

## Dokumentasi

- [Problem Framing](docs/problem-framing.md)
- [Architecture Decision Records](docs/adr/)

## API endpoint

| Method   | Endpoint                         | Description                                     |
| -------- | -------------------------------- | ----------------------------------------------- |
| `GET`    | `/health`                        | Health check                                    |
| `GET`    | `/metrics`                       | Metrics                                         |
| `POST`   | `/api/auth/register`             | User registration                               |
| `POST`   | `/api/auth/login`                | User login                                      |
| `GET`    | `/api/auth/me`                   | Get current user profile \*                     |
| `PATCH`  | `/api/auth/me`                   | Update profile \*                               |
| `POST`   | `/api/goals`                     | Create goal \*                                  |
| `GET`    | `/api/goals`                     | List all goals \*                               |
| `GET`    | `/api/goals/:id`                 | Get goal by ID \*                               |
| `PATCH`  | `/api/goals/:id`                 | Update goal \*                                  |
| `DELETE` | `/api/goals/:id`                 | Delete goal \*                                  |
| `POST`   | `/api/tasks`                     | Create task \*                                  |
| `GET`    | `/api/tasks`                     | List tasks by week start \*                     |
| `PATCH`  | `/api/tasks/:id/status`          | Update task status \*                           |
| `PATCH`  | `/api/tasks/:id`                 | Update task \*                                  |
| `POST`   | `/api/ai/plan/suggest`           | AI plan suggestion \*                           |
| `POST`   | `/api/ai/plan/reschedule`        | AI reschedule overdue tasks \*                  |
| `PATCH`  | `/api/ai/recommendations/latest` | Update latest AI recommendation status \*       |
| `PATCH`  | `/api/ai/recommendations/:id`    | Update AI recommendation by ID \*               |
| `GET`    | `/api/ai/token-usage`            | AI token usage per 100 recommendations \*       |
| `GET`    | `/api/progress/weekly`           | Get weekly progress \*                          |
| `GET`    | `/api/progress/trend`            | Get progress trend \*                           |

> \* protected/need authentication

## Screenshots

| |
|---|
| ![](./.screenshot/mpv-shot0001.jpg) |
| ![](./.screenshot/mpv-shot0002.jpg) |
| ![](./.screenshot/mpv-shot0003.jpg) |
| ![](./.screenshot/mpv-shot0004.jpg) |
| ![](./.screenshot/mpv-shot0005.jpg) |
| ![](./.screenshot/mpv-shot0006.jpg) |
| ![](./.screenshot/mpv-shot0007.jpg) |
| ![](./.screenshot/mpv-shot0008.jpg) |
| ![](./.screenshot/mpv-shot0009.jpg) |
