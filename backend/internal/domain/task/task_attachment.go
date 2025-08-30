package task

import "time"

// TaskAttachment is a domain value object; storage annotations are not included here.
type TaskAttachment struct {
    ID        string
    TaskID    string
    URL       string
    FileType  string
    CreatedAt time.Time
}
