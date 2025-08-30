package prioritize

import (
    appprioritize "backend/internal/application/prioritize"

    "github.com/gofiber/fiber/v2"
)

// RegisterRoutes wires prioritization routes to the provided router.
func RegisterRoutes(r fiber.Router, svc *appprioritize.Service) {
    r.Get("/ping", func(c *fiber.Ctx) error { return c.SendString("pong") })
}
