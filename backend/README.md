Backend (Go + Fiber)

Run
- PORT defaults to 3001
- Start: `go run ./cmd`

HTTP
- Health: `GET /healthz`
- Auth: send `Authorization: any-non-empty-value`
- Tasks:
  - `GET /api/v1/tasks/`
  - `POST /api/v1/tasks/` {"title","description","priority"}
  - `GET /api/v1/tasks/:id`
  - `PATCH /api/v1/tasks/:id` partial fields {"title","description","status","priority"}
  - `DELETE /api/v1/tasks/:id`

