package http

import (
    "backend/internal/interface/http/middleware"
    httpprioritize "backend/internal/interface/http/prioritize"
    httptask "backend/internal/interface/http/task"

    "github.com/gofiber/fiber/v2"
    "github.com/gofiber/fiber/v2/middleware/cors"
    "github.com/gofiber/fiber/v2/middleware/logger"
    "github.com/gofiber/fiber/v2/middleware/recover"
    "github.com/gofiber/fiber/v2/middleware/requestid"
)

// Build configures application routes and attaches middleware.
func Build(app *fiber.App, deps Dependencies) {
    // Global middleware
    app.Use(requestid.New())
    app.Use(logger.New())
    app.Use(recover.New())
    app.Use(cors.New())

    // Health
    app.Get("/healthz", func(c *fiber.Ctx) error { return c.SendString("ok") })

    // Protected API routes
    api := app.Group("/api/v1")
    api.Use(middleware.AuthMiddleware(deps.Auth()))

    // Modules
    httptask.RegisterRoutes(api.Group("/tasks"), deps.TaskService)
    httpprioritize.RegisterRoutes(api.Group("/prioritize"), deps.PrioritizeService)
}
