package memory

import (
    "context"
    "errors"
    "sync"
    "time"

    apptask "backend/internal/application/task"
    domaintask "backend/internal/domain/task"
)

// TaskRepository is an in-memory implementation of the task repository.
type TaskRepository struct {
    mu   sync.RWMutex
    data map[string]map[string]domaintask.Task // tenantID -> taskID -> Task
}

func NewTaskRepository() *TaskRepository {
    return &TaskRepository{data: make(map[string]map[string]domaintask.Task)}
}

var _ apptask.Repository = (*TaskRepository)(nil)

func (r *TaskRepository) ListByTenant(ctx context.Context, tenantID string) ([]domaintask.Task, error) {
    r.mu.RLock()
    defer r.mu.RUnlock()
    m := r.data[tenantID]
    out := make([]domaintask.Task, 0, len(m))
    for _, t := range m {
        out = append(out, t)
    }
    return out, nil
}

func (r *TaskRepository) Get(ctx context.Context, tenantID, id string) (*domaintask.Task, error) {
    r.mu.RLock()
    defer r.mu.RUnlock()
    if m, ok := r.data[tenantID]; ok {
        if t, ok := m[id]; ok {
            tt := t
            return &tt, nil
        }
    }
    return nil, errors.New("task not found")
}

func (r *TaskRepository) Create(ctx context.Context, t *domaintask.Task) error {
    r.mu.Lock()
    defer r.mu.Unlock()
    if _, ok := r.data[t.TenantID]; !ok {
        r.data[t.TenantID] = make(map[string]domaintask.Task)
    }
    r.data[t.TenantID][t.ID] = *t
    return nil
}

func (r *TaskRepository) Update(ctx context.Context, t *domaintask.Task) error {
    r.mu.Lock()
    defer r.mu.Unlock()
    if _, ok := r.data[t.TenantID]; !ok {
        return errors.New("task not found")
    }
    t.UpdatedAt = time.Now().UTC()
    r.data[t.TenantID][t.ID] = *t
    return nil
}

func (r *TaskRepository) Delete(ctx context.Context, tenantID, id string) error {
    r.mu.Lock()
    defer r.mu.Unlock()
    if m, ok := r.data[tenantID]; ok {
        if _, ok := m[id]; ok {
            delete(m, id)
            return nil
        }
    }
    return errors.New("task not found")
}

