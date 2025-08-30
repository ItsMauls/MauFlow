package task

import (
    "context"
    "errors"
    "strings"

    domaintask "backend/internal/domain/task"
)

// Service implements task-related application use cases.
type Service struct {
    repo Repository
}

func NewService(repo Repository) *Service {
    return &Service{repo: repo}
}

// UpdateTaskInput describes partial updates for a task.
type UpdateTaskInput struct {
    Title       *string
    Description *string
    Status      *string
    Priority    *int
}

func (s *Service) List(ctx context.Context, tenantID string) ([]domaintask.Task, error) {
    return s.repo.ListByTenant(ctx, tenantID)
}

func (s *Service) Create(ctx context.Context, tenantID, userID, title, description string, priority int) (*domaintask.Task, error) {
    if strings.TrimSpace(title) == "" {
        return nil, errors.New("title is required")
    }
    t := domaintask.New(tenantID, userID, title, description, priority)
    if err := s.repo.Create(ctx, t); err != nil {
        return nil, err
    }
    return t, nil
}

func (s *Service) Get(ctx context.Context, tenantID, id string) (*domaintask.Task, error) {
    return s.repo.Get(ctx, tenantID, id)
}

func (s *Service) Update(ctx context.Context, tenantID, id string, in UpdateTaskInput) (*domaintask.Task, error) {
    t, err := s.repo.Get(ctx, tenantID, id)
    if err != nil {
        return nil, err
    }
    if in.Title != nil {
        t.Title = *in.Title
    }
    if in.Description != nil {
        t.Description = *in.Description
    }
    if in.Status != nil {
        t.Status = *in.Status
    }
    if in.Priority != nil {
        t.Priority = *in.Priority
    }
    if err := s.repo.Update(ctx, t); err != nil {
        return nil, err
    }
    return t, nil
}

func (s *Service) Delete(ctx context.Context, tenantID, id string) error {
    return s.repo.Delete(ctx, tenantID, id)
}

