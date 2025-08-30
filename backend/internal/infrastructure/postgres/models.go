package postgres

import (
    "time"
)

// TaskRecord is the GORM persistence model for tasks.
// It intentionally lives in the infrastructure layer to keep domain pure.
type TaskRecord struct {
    ID       string `gorm:"type:uuid;primaryKey"`
    TenantID string `gorm:"type:varchar(64);index;not null"`
    UserID   string `gorm:"type:varchar(64);index;not null"`

    Title       string `gorm:"type:varchar(255);not null"`
    Description string `gorm:"type:text"`
    Status      string `gorm:"type:varchar(20);not null;default:'todo'"`
    Priority    int    `gorm:"not null;default:0"`

    CreatedAt time.Time `gorm:"not null"`
    UpdatedAt time.Time `gorm:"not null"`
}

