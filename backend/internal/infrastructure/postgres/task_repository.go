package postgres

import (
    "context"
    "errors"
    "time"

    apptask "backend/internal/application/task"
    domaintask "backend/internal/domain/task"

    "gorm.io/gorm"
)

type TaskRepository struct {
    db *gorm.DB
}

func NewTaskRepository(db *gorm.DB) *TaskRepository {
    return &TaskRepository{db: db}
}

var _ apptask.Repository = (*TaskRepository)(nil)

func toRecord(t *domaintask.Task) TaskRecord {
    return TaskRecord{
        ID:          t.ID,
        TenantID:    t.TenantID,
        UserID:      t.UserID,
        Title:       t.Title,
        Description: t.Description,
        Status:      t.Status,
        Priority:    t.Priority,
        CreatedAt:   t.CreatedAt,
        UpdatedAt:   t.UpdatedAt,
    }
}

func toDomain(r TaskRecord) domaintask.Task {
    return domaintask.Task{
        ID:          r.ID,
        TenantID:    r.TenantID,
        UserID:      r.UserID,
        Title:       r.Title,
        Description: r.Description,
        Status:      r.Status,
        Priority:    r.Priority,
        CreatedAt:   r.CreatedAt,
        UpdatedAt:   r.UpdatedAt,
    }
}

func (r *TaskRepository) ListByTenant(ctx context.Context, tenantID string) ([]domaintask.Task, error) {
    var recs []TaskRecord
    if err := r.db.WithContext(ctx).Where("tenant_id = ?", tenantID).Find(&recs).Error; err != nil {
        return nil, err
    }
    out := make([]domaintask.Task, 0, len(recs))
    for _, rec := range recs {
        out = append(out, toDomain(rec))
    }
    return out, nil
}

func (r *TaskRepository) Get(ctx context.Context, tenantID, id string) (*domaintask.Task, error) {
    var rec TaskRecord
    err := r.db.WithContext(ctx).Where("tenant_id = ? AND id = ?", tenantID, id).First(&rec).Error
    if errors.Is(err, gorm.ErrRecordNotFound) {
        return nil, errors.New("task not found")
    }
    if err != nil {
        return nil, err
    }
    t := toDomain(rec)
    return &t, nil
}

func (r *TaskRepository) Create(ctx context.Context, t *domaintask.Task) error {
    rec := toRecord(t)
    return r.db.WithContext(ctx).Create(&rec).Error
}

func (r *TaskRepository) Update(ctx context.Context, t *domaintask.Task) error {
    t.UpdatedAt = time.Now().UTC()
    rec := toRecord(t)
    // Ensure we only update the matching row
    return r.db.WithContext(ctx).Model(&TaskRecord{}).
        Where("tenant_id = ? AND id = ?", t.TenantID, t.ID).
        Updates(rec).Error
}

func (r *TaskRepository) Delete(ctx context.Context, tenantID, id string) error {
    return r.db.WithContext(ctx).Where("tenant_id = ? AND id = ?", tenantID, id).Delete(&TaskRecord{}).Error
}

