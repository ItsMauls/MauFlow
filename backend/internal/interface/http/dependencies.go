package http

import (
	"backend/internal/interface/http/middleware"
	"backend/internal/interface/http/prioritize"
	"backend/internal/interface/http/task"
)

// Dependencies groups services required by HTTP routes.
//
// It bundles all external services used by the HTTP layer so that
// router construction only needs a single parameter.
type Dependencies struct {
	auth              middleware.AuthService
	TaskService       *task.Service
	PrioritizeService *prioritize.Service
}

// NewDependencies creates a new Dependencies instance.
func NewDependencies(a middleware.AuthService, t *task.Service, p *prioritize.Service) Dependencies {
	return Dependencies{
		auth:              a,
		TaskService:       t,
		PrioritizeService: p,
	}
}

// Auth returns the authentication service.
func (d Dependencies) Auth() middleware.AuthService {
	return d.auth
}
