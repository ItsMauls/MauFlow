package middleware

import (
	"errors"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"
)

type mockAuthService struct {
	user   string
	tenant string
	err    error
}

func (m mockAuthService) VerifyToken(token string) (string, string, error) {
	return m.user, m.tenant, m.err
}

// Test that the middleware allows requests with a valid token and stores
// the returned identifiers in the context.
func TestAuthMiddleware_Success(t *testing.T) {
	svc := mockAuthService{user: "u1", tenant: "t1"}
	app := fiber.New()
	app.Use(AuthMiddleware(svc))
	app.Get("/", func(c *fiber.Ctx) error {
		if c.Locals("user") != "u1" || c.Locals("tenant") != "t1" {
			t.Fatalf("locals not set")
		}
		return c.SendStatus(fiber.StatusOK)
	})

	req := httptest.NewRequest("GET", "/", nil)
	req.Header.Set("Authorization", "token")
	resp, err := app.Test(req, -1)
	if err != nil {
		t.Fatalf("app.Test: %v", err)
	}
	if resp.StatusCode != fiber.StatusOK {
		t.Fatalf("expected status %d, got %d", fiber.StatusOK, resp.StatusCode)
	}
}

// Test that the middleware blocks requests when token verification fails.
func TestAuthMiddleware_Unauthorized(t *testing.T) {
	svc := mockAuthService{err: errors.New("invalid token")}
	app := fiber.New()
	app.Use(AuthMiddleware(svc))
	app.Get("/", func(c *fiber.Ctx) error {
		return c.SendStatus(fiber.StatusOK)
	})

	req := httptest.NewRequest("GET", "/", nil)
	req.Header.Set("Authorization", "bad")
	resp, err := app.Test(req, -1)
	if err != nil {
		t.Fatalf("app.Test: %v", err)
	}
	if resp.StatusCode != fiber.StatusUnauthorized {
		t.Fatalf("expected status %d, got %d", fiber.StatusUnauthorized, resp.StatusCode)
	}
}
