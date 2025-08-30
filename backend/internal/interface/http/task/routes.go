package task

import "github.com/gofiber/fiber/v2"

// RegisterRoutes registers HTTP routes for task operations.
func RegisterRoutes(r fiber.Router, svc interface{}) {
	// Example handlers; replace with real implementations once available.
	r.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("list tasks")
	})

	r.Post("/", func(c *fiber.Ctx) error {
		return c.SendString("create task")
	})

	r.Put("/:id", func(c *fiber.Ctx) error {
		return c.SendString("update task")
	})

	r.Delete("/:id", func(c *fiber.Ctx) error {
		return c.SendString("delete task")
	})
}
