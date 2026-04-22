package main

import (
	"context"
	"fmt"
	"gifts-api/config"
	"gifts-api/models"
	"gifts-api/repository"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	cfg, err := config.LoadConfig()
	if err != nil {
		fmt.Println("Err config:", err)
		return
	}

	dsn := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=%s",
		cfg.DBUser, cfg.DBPassword, cfg.DBHost, cfg.DBPort, cfg.DBName, cfg.DBSSLMode)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		fmt.Println("Err db:", err)
		return
	}

	repo := repository.NewUserRepository(db)
	
	// Create common password hash
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	if err != nil {
		fmt.Println("Err hashing:", err)
		return
	}
	hashStr := string(hashedPassword)
	
	var users []models.User
	if err := db.Find(&users).Error; err != nil {
		fmt.Println("Err finding users:", err)
		return
	}

	for _, user := range users {
		user.PasswordHash = hashStr
		if err := repo.Update(context.Background(), &user); err != nil {
			fmt.Printf("Err update %s: %v\n", *user.Email, err)
		} else {
			if user.Email != nil {
				fmt.Printf("Successfully reset password for %s to 'password123'\n", *user.Email)
			} else if user.Phone != nil {
				fmt.Printf("Successfully reset password for phone %s to 'password123'\n", *user.Phone)
			}
		}
	}
	fmt.Println("All done resetting passwords!")
}
