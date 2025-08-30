package config

import (
	"fmt"
	"net/url"
	"os"
	"strings"

	"github.com/joho/godotenv"
)

// Config holds process-wide configuration values.
type Config struct {
    Port        string
    Env         string
    DatabaseURL string
    DBHost      string
    DBPort      string
    DBUser      string
    DBPassword  string
    DBName      string
    DBSSLMode   string
    DBTimezone  string
}

func Load() (Config, error) {
    // Automatically load .env
    _ = godotenv.Load()

    cfg := Config{
        Port:        getEnv("PORT", "8080"),
        Env:         getEnv("ENV", "development"),
        DatabaseURL: getEnv("DATABASE_URL", ""),

        DBHost:     getEnv("DB_HOST", "localhost"),
        DBPort:     getEnv("DB_PORT", "5432"),
        DBUser:     getEnv("DB_USER", "postgres"),
		DBPassword: getEnv("DB_PASSWORD", "postgres"),
		DBName:     getEnv("DB_NAME", "postgres"),
		DBSSLMode:  getEnv("DB_SSLMODE", "disable"),
		DBTimezone: getEnv("DB_TIMEZONE", "UTC"),
	}

	return cfg, nil
}

func (c Config) DatabaseDSN() string {
    if strings.TrimSpace(c.DatabaseURL) != "" {
        return c.DatabaseURL
    }

    u := url.URL {
        Scheme: "postgres",
        User: url.UserPassword(c.DBUser, c.DBPassword),
        Host: fmt.Sprintf("%s:%s", c.DBHost, c.DBPort),
        Path: c.DBName,
    }

    q := url.Values{}
    q.Set("sslmode", c.DBSSLMode)
    q.Set("TimeZone", c.DBTimezone)
    u.RawQuery = q.Encode()

    return u.String()
}

func getEnv(key, def string) string {
    if v, ok := os.LookupEnv(key); ok {
        return v
    }
    
    return def
}
