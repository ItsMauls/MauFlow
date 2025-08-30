package main

import (
    "fmt"
    "log"

    appprioritize "backend/internal/application/prioritize"
    apptask "backend/internal/application/task"
    "backend/internal/infrastructure/auth"
    pginfra "backend/internal/infrastructure/postgres"
    httpiface "backend/internal/interface/http"
    "backend/internal/pkg/config"

    "github.com/gofiber/fiber/v2"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("config load: %v", err)
	}

	// Connect DB (GORM) — also runs AutoMigrate(Task)
    gdb, err := pginfra.Connect(cfg)
    if err != nil {
        log.Fatalf("db connect: %v", err)
    }
	// Optional: close underlying *sql.DB on shutdown
	sqlDB, _ := gdb.DB()
	defer sqlDB.Close()

	// Initialize infrastructure (GORM-backed repo instead of in-memory)
    repo := pginfra.NewTaskRepository(gdb)

	// Initialize application services
	taskSvc := apptask.NewService(repo)
	prioritizeSvc := appprioritize.NewService()

	// Auth service (simple dev implementation)
	authSvc := auth.NewSimpleAuthService()

	// Build HTTP app
	app := fiber.New()
	deps := httpiface.NewDependencies(authSvc, taskSvc, prioritizeSvc)
	httpiface.Build(app, deps)

	addr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("listening on %s", addr)
	log.Fatal(app.Listen(addr))
}
