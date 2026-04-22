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

	fmt.Println("=== Seeding Seller2 (Flora Shop 2) with rich data ===")
	rand.Seed(time.Now().UnixNano())

	// ──────────────────────────────────────────
	// 1. Find seller2 user & seller record
	// ──────────────────────────────────────────
	seller2Email := "seller2@flora.com"
	var seller2User models.User
	if err := db.Where("email = ?", seller2Email).First(&seller2User).Error; err != nil {
		log.Fatalf("Could not find seller2 user (%s): %v", seller2Email, err)
	}
	fmt.Printf("Found seller2 user: %s (ID: %s)\n", seller2Email, seller2User.ID)

	var seller2 models.Seller
	if err := db.Where("user_id = ?", seller2User.ID).First(&seller2).Error; err != nil {
		log.Fatalf("Could not find seller record for seller2: %v", err)
	}
	fmt.Printf("Found seller shop: %s (ID: %s, Status: %s)\n", seller2.ShopName, seller2.ID, seller2.Status)

	// Ensure seller2 is approved
	if seller2.Status != "approved" {
		db.Model(&seller2).Update("status", "approved")
		fmt.Println("→ Updated seller2 status to 'approved'")
	}

	// Update seller profile details
	db.Model(&seller2).Updates(map[string]interface{}{
		"shop_name":   "Gül Boutique",
		"slug":        "gul-boutique",
		"description": "Premium hand-crafted floral arrangements and luxury gift sets. Specializing in wedding bouquets, anniversaries, and bespoke corporate floristry across Ashgabat.",
		"logo_url":    "https://picsum.photos/seed/gulboutique/200/200",
		"cover_url":   "https://picsum.photos/seed/gulcover/1200/400",
	})
	fmt.Println("→ Updated seller2 shop profile")

	// Update user profile name
	db.Model(&models.UserProfile{}).Where("user_id = ?", seller2User.ID).Updates(map[string]interface{}{
		"full_name": "Aynur Berdiyeva",
	})

	// ──────────────────────────────────────────
	// 2. Bank Details
	// ──────────────────────────────────────────
	bankDetail := models.SellerBankDetail{
		SellerID:          seller2.ID,
		BankName:          "Türkmenistan Döwlet Banky",
		AccountNumber:     "TM93 0000 0000 1234 5678",
		AccountHolderName: "Aynur Berdiyeva",
		IsVerified:        true,
	}
	db.FirstOrCreate(&bankDetail, models.SellerBankDetail{SellerID: seller2.ID})
	fmt.Println("→ Bank details seeded")

	// ──────────────────────────────────────────
	// 3. Working Hours (Mon-Sat open, Sun closed)
	// ──────────────────────────────────────────
	days := []struct {
		day      int
		open     string
		close    string
		isClosed bool
	}{
		{0, "00:00", "00:00", true},  // Sunday – closed
		{1, "09:00", "19:00", false}, // Monday
		{2, "09:00", "19:00", false}, // Tuesday
		{3, "09:00", "19:00", false}, // Wednesday
		{4, "09:00", "19:00", false}, // Thursday
		{5, "09:00", "18:00", false}, // Friday
		{6, "10:00", "16:00", false}, // Saturday
	}
	for _, d := range days {
		wh := models.SellerWorkingHour{
			SellerID:  seller2.ID,
			DayOfWeek: d.day,
			OpenTime:  d.open,
			CloseTime: d.close,
			IsClosed:  d.isClosed,
		}
		db.FirstOrCreate(&wh, models.SellerWorkingHour{SellerID: seller2.ID, DayOfWeek: d.day})
	}
	fmt.Println("→ Working hours seeded (Mon-Sat)")

	// ──────────────────────────────────────────
	// 4. Seller Documents (KYC)
	// ──────────────────────────────────────────
	docs := []models.SellerDocument{
		{SellerID: seller2.ID, Type: "business_license", FileURL: "https://picsum.photos/seed/doc1/800/600", IsVerified: true},
		{SellerID: seller2.ID, Type: "id_card", FileURL: "https://picsum.photos/seed/doc2/800/600", IsVerified: true},
		{SellerID: seller2.ID, Type: "tax_certificate", FileURL: "https://picsum.photos/seed/doc3/800/600", IsVerified: false},
	}
	for _, doc := range docs {
		db.FirstOrCreate(&doc, models.SellerDocument{SellerID: seller2.ID, Type: doc.Type})
	}
	fmt.Println("→ KYC documents seeded")

	// ──────────────────────────────────────────
	// 5. Products (15 premium products)
	// ──────────────────────────────────────────

	// Get categories
	var categories []models.Category
	db.Find(&categories)
	catMap := map[string]uuid.UUID{}
	for _, c := range categories {
		catMap[c.Slug] = c.ID
	}

	// Get occasions
	var occasions []models.Occasion
	db.Find(&occasions)

	type productSeed struct {
		title       string
		desc        string
		price       float64
		catSlug     string
		isFeatured  bool
		imageSeeds  []int
	}

	productSeeds := []productSeed{
		{"Royal Crimson Rose Tower", "50 premium long-stem red roses arranged in a stunning cascading tower. Perfect for grand romantic gestures.", 249.99, "roses", true, []int{101, 102}},
		{"Pearl White Wedding Cascade", "Elegant white rose and lily bridal bouquet with satin ribbon and pearl accent pins.", 189.99, "roses", true, []int{103, 104}},
		{"Sunset Tulip Garden Box", "24 Dutch-imported tulips in gradient sunset colors presented in a luxury keepsake box.", 129.99, "tulips", false, []int{105, 106}},
		{"Spring Meadow Arrangement", "Wild-style mixed arrangement featuring tulips, daisies, and baby's breath in a rustic basket.", 89.99, "mixed-bouquets", false, []int{107, 108}},
		{"Stargazer Lily Elegance", "12 stunning stargazer lilies with eucalyptus greens in a clear crystal vase.", 159.99, "lilies", true, []int{109, 110}},
		{"Artisan Chocolate Bouquet", "Premium Belgian chocolate truffles arranged as a flower bouquet with edible gold leaf.", 119.99, "chocolates", false, []int{111, 112}},
		{"Velvet Rose Heart Box", "36 preserved roses in a heart-shaped velvet box. Lasts up to 3 years.", 299.99, "roses", true, []int{113, 114}},
		{"Birthday Balloon & Bloom Set", "Helium balloon bundle with a cheerful mixed flower basket and greeting card.", 79.99, "mixed-bouquets", false, []int{115, 116}},
		{"Luxury Orchid Centerpiece", "Triple-stem phalaenopsis orchid in a marble planter with moss base.", 199.99, "lilies", true, []int{117, 118}},
		{"Mother's Love Arrangement", "Pink carnations, white roses, and lavender arranged in a 'World's Best Mom' ceramic vase.", 109.99, "mixed-bouquets", false, []int{119, 120}},
		{"Classic Red Rose Dozen", "12 classic long-stem red roses with baby's breath and greenery.", 69.99, "roses", false, []int{121, 122}},
		{"Teddy Bear & Flowers Combo", "Large plush teddy bear paired with a pastel-toned floral arrangement.", 99.99, "plush-toys", false, []int{123, 124}},
		{"Anniversary Gold Collection", "Premium gold-tinted roses with champagne ribbon in a signature gift box.", 179.99, "roses", true, []int{125, 126}},
		{"Tropical Paradise Basket", "Exotic bird of paradise, anthuriums, and protea in a woven tropical basket.", 149.99, "mixed-bouquets", false, []int{127, 128}},
		{"Gourmet Cake & Flowers Bundle", "Red velvet cake with cream cheese frosting paired with a mini rose bouquet.", 139.99, "cakes", false, []int{129, 130}},
	}

	var createdProducts []models.Product
	for _, ps := range productSeeds {
		catID, ok := catMap[ps.catSlug]
		if !ok {
			// Fallback to first category
			catID = categories[0].ID
		}

		product := models.Product{
			SellerID:    seller2.ID,
			CategoryID:  &catID,
			Title:       ps.title,
			Description: ps.desc,
			BasePrice:   ps.price,
			Status:      "active",
			IsFeatured:  ps.isFeatured,
		}
		db.FirstOrCreate(&product, models.Product{Title: product.Title, SellerID: seller2.ID})
		createdProducts = append(createdProducts, product)

		// Add images
		for idx, seed := range ps.imageSeeds {
			img := models.ProductImage{
				ProductID: product.ID,
				URL:       fmt.Sprintf("https://picsum.photos/seed/%d/600/600", seed),
				IsPrimary: idx == 0,
				SortOrder: idx,
			}
			db.FirstOrCreate(&img, models.ProductImage{ProductID: product.ID, SortOrder: idx})
		}

		// Add inventory
		inv := models.Inventory{
			ProductID:         product.ID,
			QuantityTotal:     rand.Intn(80) + 20,
			QuantityReserved:  0,
			LowStockThreshold: 5,
		}
		db.FirstOrCreate(&inv, models.Inventory{ProductID: product.ID})

		// Add occasion link
		if len(occasions) > 0 {
			occ := occasions[rand.Intn(len(occasions))]
			db.Exec(`INSERT INTO product_occasions (product_id, occasion_id) VALUES (?, ?) ON CONFLICT DO NOTHING`, product.ID, occ.ID)
		}

		// Add some variants to certain products
		if ps.price > 100 {
			variants := []struct {
				name  string
				mod   float64
			}{
				{"Standard", 0},
				{"Premium (+20%)", ps.price * 0.2},
				{"Deluxe (+50%)", ps.price * 0.5},
			}
			for _, v := range variants {
				pv := models.ProductVariant{
					ProductID:     product.ID,
					Name:          v.name,
					PriceModifier: v.mod,
					IsActive:      true,
				}
				db.FirstOrCreate(&pv, models.ProductVariant{ProductID: product.ID, Name: pv.Name})
			}
		}

		// Add some addons
		if ps.price > 80 {
			addons := []models.ProductAddon{
				{ProductID: &product.ID, Name: "Gift Card", Description: "Handwritten greeting card", Price: 5.99, AddonType: "gift_item", IsActive: true},
				{ProductID: &product.ID, Name: "Gift Wrapping", Description: "Premium satin ribbon wrapping", Price: 9.99, AddonType: "gift_item", IsActive: true},
			}
			for _, a := range addons {
				db.FirstOrCreate(&a, models.ProductAddon{ProductID: &product.ID, Name: a.Name})
			}
		}
	}
	fmt.Printf("→ %d products seeded with images, inventory, variants & addons\n", len(createdProducts))

	// ──────────────────────────────────────────
	// 6. Historical Orders (last 30 days)
	// ──────────────────────────────────────────

	// Find customer users
	var customers []models.User
	db.Where("role = ?", "customer").Find(&customers)
	if len(customers) == 0 {
		// Create some customers if none exist
		log.Println("Warning: No customers found, skipping order seeding")
	} else {
		now := time.Now()
		totalOrders := 0

		for day := 30; day >= 0; day-- {
			currentDate := now.AddDate(0, 0, -day)
			ordersToday := rand.Intn(4) + 2 // 2-5 orders per day

			for j := 0; j < ordersToday; j++ {
				customer := customers[rand.Intn(len(customers))]
				orderID := uuid.New()
				orderTime := currentDate.Add(time.Duration(rand.Intn(14)+8) * time.Hour)

				// Pick random status (mostly delivered for historical data)
				statusRoll := rand.Intn(100)
				status := "delivered"
				paymentStatus := "confirmed"
				if day < 2 && statusRoll > 70 {
					status = "pending"
					paymentStatus = "pending"
				} else if statusRoll > 88 {
					status = "cancelled"
				} else if day < 3 && statusRoll > 60 {
					status = "processing"
				}

				// Pick 1-3 products
				numItems := rand.Intn(3) + 1
				var subtotal float64

				type orderItemInfo struct {
					productID uuid.UUID
					qty       int
					unitPrice float64
					lineTotal float64
				}
				var items []orderItemInfo

				for k := 0; k < numItems; k++ {
					p := createdProducts[rand.Intn(len(createdProducts))]
					qty := rand.Intn(2) + 1
					lineTotal := p.BasePrice * float64(qty)
					subtotal += lineTotal
					items = append(items, orderItemInfo{
						productID: p.ID,
						qty:       qty,
						unitPrice: p.BasePrice,
						lineTotal: lineTotal,
					})
				}

				deliveryFee := 15.00
				totalPrice := subtotal + deliveryFee

				// Insert order
				db.Exec(`INSERT INTO orders (id, customer_id, seller_id, status, subtotal, delivery_fee, total_price, payment_method, payment_status, created_at, updated_at) 
					VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
					ON CONFLICT DO NOTHING`,
					orderID, customer.ID, seller2.ID, status, subtotal, deliveryFee, totalPrice, "bank_transfer", paymentStatus, orderTime, orderTime)

				// Insert order items
				for _, item := range items {
					db.Exec(`INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, line_total) 
						VALUES (?, ?, ?, ?, ?, ?)
						ON CONFLICT DO NOTHING`,
						uuid.New(), orderID, item.productID, item.qty, item.unitPrice, item.lineTotal)
				}

				// Insert payment
				db.Exec(`INSERT INTO payments (id, order_id, method, status, amount, created_at) 
					VALUES (?, ?, ?, ?, ?, ?)
					ON CONFLICT DO NOTHING`,
					uuid.New(), orderID, "bank_transfer", paymentStatus, totalPrice, orderTime)

				// Insert status history
				db.Exec(`INSERT INTO order_status_histories (id, order_id, to_status, note, created_at)
					VALUES (?, ?, ?, ?, ?)
					ON CONFLICT DO NOTHING`,
					uuid.New(), orderID, status, "System seeded order", orderTime)

				totalOrders++
			}
		}
		fmt.Printf("→ %d historical orders seeded across 30 days\n", totalOrders)
	}

	// ──────────────────────────────────────────
	// 7. Update seller stats from actual orders
	// ──────────────────────────────────────────
	db.Exec(`
		INSERT INTO seller_stats (seller_id, total_orders, completed_orders, cancelled_orders, total_revenue, avg_rating, updated_at)
		SELECT 
			seller_id,
			COUNT(id),
			SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END),
			SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END),
			COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total_price ELSE 0 END), 0),
			4.7,
			CURRENT_TIMESTAMP
		FROM orders
		WHERE seller_id = ?
		GROUP BY seller_id
		ON CONFLICT (seller_id) DO UPDATE SET 
			total_orders = EXCLUDED.total_orders,
			completed_orders = EXCLUDED.completed_orders,
			cancelled_orders = EXCLUDED.cancelled_orders,
			total_revenue = EXCLUDED.total_revenue,
			avg_rating = EXCLUDED.avg_rating,
			updated_at = CURRENT_TIMESTAMP;
	`, seller2.ID)
	fmt.Println("→ Seller stats synced")

	// ──────────────────────────────────────────
	// 8. Add some reviews for seller2 products
	// ──────────────────────────────────────────
	if len(customers) > 0 {
		reviewTexts := []string{
			"Absolutely stunning arrangement! The roses were incredibly fresh.",
			"My wife loved the bouquet. Will definitely order again.",
			"Beautiful flowers, arrived on time. Great packaging too.",
			"The quality exceeded my expectations. Highly recommend!",
			"Perfect for our anniversary. The presentation was impeccable.",
			"Good value for money. Flowers lasted over a week.",
			"Gorgeous colors and excellent customer service.",
			"The arrangement looked exactly like the photo. Very happy!",
		}

		reviewCount := 0
		for _, product := range createdProducts {
			numReviews := rand.Intn(3) + 1 // 1-3 reviews per product
			for r := 0; r < numReviews; r++ {
				customer := customers[rand.Intn(len(customers))]
				rating := rand.Intn(2) + 4 // 4-5 stars
				text := reviewTexts[rand.Intn(len(reviewTexts))]
				reviewDate := time.Now().AddDate(0, 0, -(rand.Intn(25) + 1))

				db.Exec(`INSERT INTO reviews (id, product_id, customer_id, seller_id, rating, comment, is_verified_purchase, is_visible, created_at, updated_at) 
					VALUES (?, ?, ?, ?, ?, ?, true, true, ?, ?)
					ON CONFLICT DO NOTHING`,
					uuid.New(), product.ID, customer.ID, seller2.ID, rating, text, reviewDate, reviewDate)
				reviewCount++
			}
		}
		fmt.Printf("→ %d product reviews seeded\n", reviewCount)
	}

	fmt.Println("\n✅ Seller2 data seeding complete!")
	fmt.Println("   Shop: Gül Boutique")
	fmt.Println("   Login: seller2@flora.com / password123")
}
