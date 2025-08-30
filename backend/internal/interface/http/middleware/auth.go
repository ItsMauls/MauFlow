package middleware

import "github.com/gofiber/fiber/v2"

// AuthService defines behaviour required for authentication operations.
// VerifyToken should validate the supplied token and return user and tenant
// information or an error when the token is invalid.
type AuthService interface {
	VerifyToken(token string) (any, any, error)
}

// AuthMiddleware authenticates requests using the provided service.
func AuthMiddleware(authSvc AuthService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		user, tenant, err := authSvc.VerifyToken(c.Get("Authorization"))
		if err != nil {
			return fiber.ErrUnauthorized
		}
		c.Locals("user", user)
		c.Locals("tenant", tenant)
		return c.Next()
	}
}
