package task

import "time"

// TaskComment is a domain value object; storage annotations are not included here.
type TaskComment struct {
    ID        string
    TaskID    string
    Content   string
    Author    string
    CreatedAt time.Time
}
