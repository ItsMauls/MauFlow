package task

import (
    apptask "backend/internal/application/task"

    "github.com/gofiber/fiber/v2"
)

// RegisterRoutes wires task routes to the provided router.
func RegisterRoutes(r fiber.Router, svc *apptask.Service) {
    h := NewHandlers(svc)
    r.Get("/", h.list)
    r.Post("/", h.create)
    r.Get("/:id", h.get)
    r.Patch("/:id", h.patch)
    r.Delete("/:id", h.delete)
}
