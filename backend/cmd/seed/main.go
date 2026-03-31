package main

import (
	"fmt"
	"log"
	"math/rand"
	"time"

	"gifts-api/config"
	"gifts-api/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	dsn := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=%s",
		cfg.DBUser, cfg.DBPassword, cfg.DBHost, cfg.DBPort, cfg.DBName, cfg.DBSSLMode)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database loop: %v", err)
	}
	gormDB := db

	fmt.Println("Starting to seed database...")

	// 1. Create common Categories
	categories := []models.Category{
		{Name: "Roses", Slug: "roses"},
		{Name: "Tulips", Slug: "tulips"},
		{Name: "Lilies", Slug: "lilies"},
		{Name: "Mixed Bouquets", Slug: "mixed-bouquets"},
		{Name: "Chocolates", Slug: "chocolates"},
		{Name: "Cakes", Slug: "cakes"},
		{Name: "Plush Toys", Slug: "plush-toys"},
	}
	for i := range categories {
		if err := gormDB.FirstOrCreate(&categories[i], models.Category{Slug: categories[i].Slug}).Error; err != nil {
			log.Fatalf("Failed to seed category: %v", err)
		}
	}

	// 2. Create Users (1 Admin, 3 Sellers, 3 Customers)
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	
	adminEmail := "admin@flora.com"
	adminPhone := "+10000000000"
	admin := models.User{
		Email:        &adminEmail,
		Phone:        &adminPhone,
		PasswordHash: string(hashedPassword),
		Role:         "admin",
		IsVerified:   true,
		IsActive:     true,
	}
	gormDB.FirstOrCreate(&admin, models.User{Email: &adminEmail})
	gormDB.FirstOrCreate(&models.UserProfile{UserID: admin.ID, FullName: "System Admin"}, models.UserProfile{UserID: admin.ID})

	var sellers []models.Seller
	for i := 1; i <= 3; i++ {
		email := fmt.Sprintf("seller%d@flora.com", i)
		phone := fmt.Sprintf("+1000000000%d", i)
		user := models.User{
			Email:        &email,
			Phone:        &phone,
			PasswordHash: string(hashedPassword),
			Role:         "seller",
			IsVerified:   true,
			IsActive:     true,
		}
		gormDB.FirstOrCreate(&user, models.User{Email: &email})
		gormDB.FirstOrCreate(&models.UserProfile{UserID: user.ID, FullName: fmt.Sprintf("Seller User %d", i)}, models.UserProfile{UserID: user.ID})
		
		seller := models.Seller{
			UserID:      user.ID,
			ShopName:    fmt.Sprintf("Flora Shop %d", i),
			Slug:        fmt.Sprintf("flora-shop-%d", i),
			Description: "Beautiful fresh flowers and gifts.",
			Status:      "approved",
		}
		gormDB.FirstOrCreate(&seller, models.Seller{Slug: seller.Slug})
		sellers = append(sellers, seller)
	}

	// 3. Create Occasions
	occasions := []models.Occasion{
		{Name: "Birthday", Slug: "birthday"},
		{Name: "Anniversary", Slug: "anniversary"},
		{Name: "Mother's Day", Slug: "mothers-day"},
		{Name: "Valentine's Day", Slug: "valentines-day"},
	}
	for i := range occasions {
		gormDB.FirstOrCreate(&occasions[i], models.Occasion{Slug: occasions[i].Slug})
	}

	// 4. Create 30-50 Products
	adjectives := []string{"Beautiful", "Stunning", "Luxury", "Premium", "Classic", "Romantic", "Elegant", "Fresh"}
	colors := []string{"Red", "White", "Pink", "Yellow", "Mixed", "Purple"}
	types := []string{"Bouquet", "Arrangement", "Basket", "Box", "Set"}
	
	rand.Seed(time.Now().UnixNano())
	
	fmt.Println("Seeding approx 40 products...")
	for i := 1; i <= 40; i++ {
		seller := sellers[rand.Intn(len(sellers))]
		cat := categories[rand.Intn(len(categories))]
		
		adj := adjectives[rand.Intn(len(adjectives))]
		color := colors[rand.Intn(len(colors))]
		typ := types[rand.Intn(len(types))]
		
		name := fmt.Sprintf("%s %s %s %d", adj, color, typ, i)
		basePrice := float64(rand.Intn(150)+20) + 0.99
		
		product := models.Product{
			SellerID:          seller.ID,
			CategoryID:        &cat.ID,
			Title:             name,
			Description:       fmt.Sprintf("This perfectly arranged %s %s is the ideal gift.", color, typ),
			BasePrice:         basePrice,
			Status:            "active",
		}
		gormDB.FirstOrCreate(&product, models.Product{Title: product.Title})
		
		// Add Image
		imageURL := fmt.Sprintf("https://picsum.photos/seed/%d/600/600", i*10)
		gormDB.FirstOrCreate(&models.ProductImage{
			ProductID: product.ID,
			URL:       imageURL,
			IsPrimary: true,
			SortOrder: 0,
		}, models.ProductImage{ProductID: product.ID, URL: imageURL})
		
		// Add Inventory
		gormDB.FirstOrCreate(&models.Inventory{
			ProductID:         product.ID,
			QuantityTotal:     100,
			QuantityReserved:  0,
		}, models.Inventory{ProductID: product.ID})
		
		// Add Product Occasion link
		occ := occasions[rand.Intn(len(occasions))]
		gormDB.FirstOrCreate(&models.ProductOccasion{
			ProductID:  product.ID,
			OccasionID: occ.ID,
		}, models.ProductOccasion{ProductID: product.ID, OccasionID: occ.ID})
	}

	fmt.Println("Seeding complete! You now have users, sellers, categories, occasions, and 40 products.")
}
