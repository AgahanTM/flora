package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

// AppConfig holds all the configuration variables
type AppConfig struct {
	DBHost                string
	DBUser                string
	DBPassword            string
	DBName                string
	DBPort                string
	DBSSLMode             string
	JWTSecret             string
	JWTExpiresIn          string
	RefreshTokenSecret    string
	RefreshTokenExpiresIn string
	AccessTokenExpiresIn  string
	Port                  string
	RedisURL              string
	S3Endpoint            string
	S3Bucket              string
	S3Key                 string
	S3Secret              string
	FrontendURL           string
}

// LoadConfig loads configuration from .env file
func LoadConfig() (*AppConfig, error) {
	// Load .env file if it exists, otherwise use environment variables
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found, using system environment variables instead.")
	}

	config := &AppConfig{
		DBHost:       getEnv("DB_HOST", "localhost"),
		DBUser:       getEnv("DB_USER", "postgres"),
		DBPassword:   getEnv("DB_PASSWORD", "postgres"),
		DBName:       getEnv("DB_NAME", "gifts_api"),
		DBPort:       getEnv("DB_PORT", "5432"),
		DBSSLMode:             getEnv("DB_SSLMODE", "disable"),
		JWTSecret:             getEnv("JWT_SECRET", "supersecret123"),
		JWTExpiresIn:          getEnv("JWT_EXPIRES_IN", "24h"),
		RefreshTokenSecret:    getEnv("REFRESH_TOKEN_SECRET", "refreshsupersecret123"),
		RefreshTokenExpiresIn: getEnv("REFRESH_TOKEN_EXPIRES_IN", "168h"), // 7 days
		AccessTokenExpiresIn:  getEnv("ACCESS_TOKEN_EXPIRES_IN", "15m"),
		Port:                  getEnv("PORT", "8080"),
		RedisURL:              getEnv("REDIS_URL", "redis://localhost:6379/0"),
		S3Endpoint:            getEnv("S3_ENDPOINT", ""),
		S3Bucket:              getEnv("S3_BUCKET", ""),
		S3Key:                 getEnv("S3_KEY", ""),
		S3Secret:              getEnv("S3_SECRET", ""),
		FrontendURL:           getEnv("FRONTEND_URL", "http://localhost:3000"),
	}

	return config, nil
}

// getEnv gets an environment variable or a fallback
func getEnv(key, fallback string) string {
	value, exists := os.LookupEnv(key)
	if !exists {
		return fallback
	}
	return value
}
