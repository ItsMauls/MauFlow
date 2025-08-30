package http

import (
	"backend/internal/interface/http/middleware"

	"github.com/gofiber/fiber/v2"
)

func Build(app *fiber.App, deps Dependencies) {
	api := app.Group("/api", middleware.AuthMiddleware(deps.Auth()))

	task.RegisterRoutes(api.Group("/tasks"), deps.TaskService)
	prioritize.RegisterRoutes(api.Group("/prioritize"), deps.PrioritizeService)
}