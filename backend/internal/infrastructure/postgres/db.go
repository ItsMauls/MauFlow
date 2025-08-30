package postgres

import (
    "backend/internal/pkg/config"
    "fmt"

    "gorm.io/driver/postgres"
    "gorm.io/gorm"
)

func Connect(cfg config.Config) (*gorm.DB, error) {
    dsn := cfg.DatabaseDSN()

    db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
    if err != nil {
        return nil, fmt.Errorf("open db: %w", err)
    }

	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("unwrap sql.DB: %w", err)
	}
	sqlDB.SetMaxIdleConns(5)
	sqlDB.SetMaxOpenConns(20)

    if err := db.AutoMigrate(&TaskRecord{}); err != nil {
        return nil, fmt.Errorf("automigrate: %w", err)
    }

    return db, nil
}
