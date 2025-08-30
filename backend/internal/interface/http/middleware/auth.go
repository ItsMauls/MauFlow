package middleware

import "github.com/gofiber/fiber/v2"

// AuthService defines the behaviour required by the authentication middleware.
// VerifyToken should validate the provided token and return identifiers for the
// authenticated user and tenant. An error should be returned if the token is
// invalid or cannot be verified.
type AuthService interface {
	VerifyToken(token string) (userID string, tenantID string, err error)
}

// AuthMiddleware creates a Fiber middleware that validates the incoming
// request's Authorization header. When the token is valid the user and tenant
// identifiers are stored in the request context so that subsequent handlers can
// access them. If verification fails an Unauthorized error is returned.
func AuthMiddleware(authSvc AuthService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		token := c.Get("Authorization")
		user, tenant, err := authSvc.VerifyToken(token)
		if err != nil {
			return fiber.ErrUnauthorized
		}
		c.Locals("user", user)
		c.Locals("tenant", tenant)
		return c.Next()
	}
}
