package http

import (
    appprioritize "backend/internal/application/prioritize"
    apptask "backend/internal/application/task"
    "backend/internal/interface/http/middleware"
)

// Dependencies groups services required by HTTP routes.
//
// It bundles all external services used by the HTTP layer so that
// router construction only needs a single parameter.
type Dependencies struct {
    auth              middleware.AuthService
    TaskService       *apptask.Service
    PrioritizeService *appprioritize.Service
}

// NewDependencies creates a new Dependencies instance.
func NewDependencies(a middleware.AuthService, t *apptask.Service, p *appprioritize.Service) Dependencies {
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
