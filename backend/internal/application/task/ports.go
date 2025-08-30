package task

import (
    "context"

    domaintask "backend/internal/domain/task"
)

// Repository defines persistence operations for tasks.
type Repository interface {
    ListByTenant(ctx context.Context, tenantID string) ([]domaintask.Task, error)
    Get(ctx context.Context, tenantID, id string) (*domaintask.Task, error)
    Create(ctx context.Context, t *domaintask.Task) error
    Update(ctx context.Context, t *domaintask.Task) error
    Delete(ctx context.Context, tenantID, id string) error
}

