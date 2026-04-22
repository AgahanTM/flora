package main

import (
	"fmt"
	"log"
	"math/rand"
	"time"

	"gifts-api/config"
	"gifts-api/models"

	"github.com/google/uuid"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
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
		log.Fatalf("Failed to connect to database: %v", err)
	}

	fmt.Println("Starting to seed historical transaction data...")
	rand.Seed(time.Now().UnixNano())

	// Fetch existing dependencies
	var sellers []models.Seller
	db.Find(&sellers)
	if len(sellers) == 0 {
		log.Fatal("No sellers found. Please run the primary seeder first.")
	}

	var users []models.User
	db.Where("role = ?", "customer").Find(&users)
	if len(users) == 0 {
		log.Fatal("No customers found.")
	}

	var products []models.Product
	db.Find(&products)
	if len(products) == 0 {
		log.Fatal("No products found.")
	}

	const totalDays = 30
	const ordersPerDayMin = 3
	const ordersPerDayMax = 8

	fmt.Printf("Injecting orders spanning the last %d days...\n", totalDays)

	now := time.Now()
	totalOrdersCreated := 0

	for i := totalDays; i >= 0; i-- {
		currentDate := now.AddDate(0, 0, -i)
		ordersToday := rand.Intn(ordersPerDayMax-ordersPerDayMin+1) + ordersPerDayMin

		for j := 0; j < ordersToday; j++ {
			seller := sellers[rand.Intn(len(sellers))]
			customer := users[rand.Intn(len(users))]

			// Pick 1-3 random products from THIS seller
			var sellerProducts []models.Product
			for _, p := range products {
				if p.SellerID == seller.ID {
					sellerProducts = append(sellerProducts, p)
				}
			}
			
			// If seller has no products (e.g. newly upgraded fishshi user), manually insert a fake one so they get analytics
			if len(sellerProducts) == 0 {
				defaultCat := uuid.New()
				fakeProduct := models.Product{
					ID: uuid.New(),
					SellerID: seller.ID,
					Title: fmt.Sprintf("Assorted Fresh Flowers %d", rand.Intn(1000)),
					BasePrice: float64(rand.Intn(50) + 20),
					Description: "Freshly arranged blooms for your loved ones.",
					Status: "active",
				}
				db.Exec(`INSERT INTO categories (id, name, slug) VALUES (?, ?, ?) ON CONFLICT DO NOTHING`, defaultCat, "Assorted", "assorted-cat")
				db.Exec(`INSERT INTO products (id, seller_id, title, base_price, description, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
					fakeProduct.ID, fakeProduct.SellerID, fakeProduct.Title, fakeProduct.BasePrice, fakeProduct.Description, fakeProduct.Status)
				sellerProducts = append(sellerProducts, fakeProduct)
			}

			// Build order items
			numItems := rand.Intn(3) + 1
			var subtotal float64 = 0

			orderID := uuid.New()
			orderTime := currentDate.Add(time.Duration(rand.Intn(12)) * time.Hour)

			statusIdx := rand.Intn(100)
			status := "delivered"
			if statusIdx > 90 && i < 2 {
				status = "pending"
			} else if statusIdx > 85 {
				status = "cancelled"
			}

			type tempItem struct {
				ProductID uuid.UUID
				Qty       int
				UnitPrice float64
				LineTotal float64
			}
			var tempItems []tempItem

			for k := 0; k < numItems; k++ {
				product := sellerProducts[rand.Intn(len(sellerProducts))]
				qty := rand.Intn(3) + 1
				lineTotal := product.BasePrice * float64(qty)
				subtotal += lineTotal
				tempItems = append(tempItems, tempItem{ProductID: product.ID, Qty: qty, UnitPrice: product.BasePrice, LineTotal: lineTotal})
			}

			deliveryFee := 15.00
			totalPrice := subtotal + deliveryFee

			// Insert Order first to satisfy foreign key
			db.Exec(`INSERT INTO orders (id, customer_id, seller_id, status, subtotal, delivery_fee, total_price, payment_method, payment_status, created_at, updated_at) 
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
				orderID, customer.ID, seller.ID, status, subtotal, deliveryFee, totalPrice, "bank_transfer", "confirmed", orderTime, orderTime)

			// Now insert Order Items safely
			for _, item := range tempItems {
				db.Exec(`INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, line_total) 
					VALUES (?, ?, ?, ?, ?, ?)`, uuid.New(), orderID, item.ProductID, item.Qty, item.UnitPrice, item.LineTotal)
			}

			// Insert Payment
			db.Exec(`INSERT INTO payments (id, order_id, method, status, amount, created_at) 
				VALUES (?, ?, ?, ?, ?, ?)`, uuid.New(), orderID, "bank_transfer", "confirmed", totalPrice, orderTime)

			totalOrdersCreated++
		}
	}

	// Update seller stats natively from orders
	db.Exec(`
		INSERT INTO seller_stats (seller_id, total_orders, completed_orders, cancelled_orders, total_revenue)
		SELECT 
			seller_id,
			COUNT(id) as total_orders,
			SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as completed_orders,
			SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders,
			COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total_price ELSE 0 END), 0) as total_revenue
		FROM orders 
		GROUP BY seller_id
		ON CONFLICT (seller_id) DO UPDATE SET 
			total_orders = EXCLUDED.total_orders,
			completed_orders = EXCLUDED.completed_orders,
			cancelled_orders = EXCLUDED.cancelled_orders,
			total_revenue = EXCLUDED.total_revenue,
			updated_at = CURRENT_TIMESTAMP;
	`)

	fmt.Printf("Successfully injected %d historical orders and synced seller analytics!\n", totalOrdersCreated)
}
