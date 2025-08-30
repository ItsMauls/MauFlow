package task

import (
    "time"

    "github.com/google/uuid"
)

// Task is the core domain entity, independent of persistence concerns.
type Task struct {
    ID          string         `json:"id"`
    TenantID    string         `json:"tenantId"`
    UserID      string         `json:"userId"`
    Title       string         `json:"title"`
    Description string         `json:"description,omitempty"`
    Status      string         `json:"status"`
    Priority    int            `json:"priority"`
    DueDate     *time.Time     `json:"dueDate,omitempty"`
    AiScore     *float64       `json:"aiScore,omitempty"`
    ProjectID   *string        `json:"projectId,omitempty"`
    Comments    []TaskComment  `json:"comments,omitempty"`
    Attachments []TaskAttachment `json:"attachments,omitempty"`
    CreatedAt   time.Time      `json:"createdAt"`
    UpdatedAt   time.Time      `json:"updatedAt"`
}

func New(tenantID, userID, title, description string, priority int) *Task {
    now := time.Now().UTC()
    return &Task{
        ID:          uuid.NewString(),
        TenantID:    tenantID,
        UserID:      userID,
        Title:       title,
        Description: description,
        Status:      "todo",
        Priority:    priority,
        CreatedAt:   now,
        UpdatedAt:   now,
    }
}
