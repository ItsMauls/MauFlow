package http

import (
	"backend/internal/interface/http/middleware"
	"backend/internal/interface/http/prioritize"
	"backend/internal/interface/http/task"

	"github.com/gofiber/fiber/v2"
)


// Dependencies exposes services required by the HTTP router.
type Dependencies interface {
	Auth() middleware.AuthService
}

// Build configures application routes and attaches middleware.
func Build(app *fiber.App, deps Dependencies) {
	app.Use(middleware.AuthMiddleware(deps.Auth()))

}
