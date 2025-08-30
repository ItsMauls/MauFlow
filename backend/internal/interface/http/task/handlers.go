package task

import (
    "context"
    "strconv"

    apptask "backend/internal/application/task"

    "github.com/gofiber/fiber/v2"
)

type Handlers struct {
    svc *apptask.Service
}

func NewHandlers(svc *apptask.Service) *Handlers { return &Handlers{svc: svc} }

type createTaskRequest struct {
    Title       string `json:"title"`
    Description string `json:"description"`
    Priority    int    `json:"priority"`
}

type updateTaskRequest struct {
    Title       *string `json:"title"`
    Description *string `json:"description"`
    Status      *string `json:"status"`
    Priority    *int    `json:"priority"`
}

func tenantAndUser(c *fiber.Ctx) (tenantID, userID string) {
    t, _ := c.Locals("tenant").(string)
    u, _ := c.Locals("user").(string)
    return t, u
}

func (h *Handlers) list(c *fiber.Ctx) error {
    tenantID, _ := tenantAndUser(c)
    items, err := h.svc.List(context.Background(), tenantID)
    if err != nil {
        return fiber.ErrInternalServerError
    }
    return c.JSON(items)
}

func (h *Handlers) create(c *fiber.Ctx) error {
    tenantID, userID := tenantAndUser(c)
    var req createTaskRequest
    if err := c.BodyParser(&req); err != nil {
        return fiber.ErrBadRequest
    }
    t, err := h.svc.Create(context.Background(), tenantID, userID, req.Title, req.Description, req.Priority)
    if err != nil {
        return fiber.NewError(fiber.StatusBadRequest, err.Error())
    }
    return c.Status(fiber.StatusCreated).JSON(t)
}

func (h *Handlers) get(c *fiber.Ctx) error {
    tenantID, _ := tenantAndUser(c)
    id := c.Params("id")
    t, err := h.svc.Get(context.Background(), tenantID, id)
    if err != nil {
        return fiber.ErrNotFound
    }
    return c.JSON(t)
}

func (h *Handlers) patch(c *fiber.Ctx) error {
    tenantID, _ := tenantAndUser(c)
    id := c.Params("id")
    var req updateTaskRequest
    if err := c.BodyParser(&req); err != nil {
        return fiber.ErrBadRequest
    }
    in := apptask.UpdateTaskInput{Title: req.Title, Description: req.Description, Status: req.Status, Priority: req.Priority}
    t, err := h.svc.Update(context.Background(), tenantID, id, in)
    if err != nil {
        return fiber.ErrBadRequest
    }
    return c.JSON(t)
}

func (h *Handlers) delete(c *fiber.Ctx) error {
    tenantID, _ := tenantAndUser(c)
    id := c.Params("id")
    if err := h.svc.Delete(context.Background(), tenantID, id); err != nil {
        return fiber.ErrNotFound
    }
    return c.SendStatus(fiber.StatusNoContent)
}

// optional helper to parse ints with default
func atoiDefault(s string, def int) int {
    if s == "" {
        return def
    }
    if v, err := strconv.Atoi(s); err == nil {
        return v
    }
    return def
}

