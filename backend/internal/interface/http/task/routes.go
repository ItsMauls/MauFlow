package task

import "github.com/gofiber/fiber/v2"

func RegisterRoutes(r *fiber.Route, svc *task.Service) {
	h := fiber.Handler{Svc: svc}
	r.Get("/", h.List)
	r.Post("/", h.Create)
	r.Put("/:id", h.Update)
	r.Delete("/:id", h.Delete)
}