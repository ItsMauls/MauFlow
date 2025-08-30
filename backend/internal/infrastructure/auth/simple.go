package auth

import "errors"

// SimpleAuthService is a minimal auth service suitable for dev/testing.
// It accepts any non-empty token and returns static identifiers.
type SimpleAuthService struct{}

func NewSimpleAuthService() SimpleAuthService { return SimpleAuthService{} }

func (SimpleAuthService) VerifyToken(token string) (string, string, error) {
    if token == "" {
        return "", "", errors.New("missing token")
    }
    // Allow either raw token or Bearer token
    return "u1", "t1", nil
}

