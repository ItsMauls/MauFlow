package middleware

import "github.com/gofiber/fiber/v2"

func AuthMiddleware(authSvc AuthService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		user, tenant, err := authSvc.VerifyToken(c. Get("Authorization"))
		if err != nil {
			return fiber.ErrUnauthorized
		}
		c.Locals("user", user)
		c.Locals("tenant", tenant)
		return c.Next()
	}
}