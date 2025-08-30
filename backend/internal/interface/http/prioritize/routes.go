package prioritize

import "github.com/gofiber/fiber/v2"

// RegisterRoutes registers HTTP routes for task prioritization.
func RegisterRoutes(r fiber.Router, svc interface{}) {
	// Example handler; replace with real implementation once available.
	r.Post("/", func(c *fiber.Ctx) error {
		return c.SendString("prioritize tasks")
	})
}
