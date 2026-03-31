package main

import (
	"log"

	"gifts-api/config"
	"gifts-api/controllers"
	"gifts-api/repository"
	"gifts-api/routes"
	"gifts-api/services"

	"github.com/gin-gonic/gin"
)

func main() {
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	db, err := repository.InitDB(cfg)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	// 1. Repositories
	userRepo := repository.NewUserRepository(db)
	sellerRepo := repository.NewSellerRepository(db)
	productRepo := repository.NewProductRepository(db)
	personalizationRepo := repository.NewPersonalizationRepository(db)
	orderRepo := repository.NewOrderRepository(db)
	deliveryRepo := repository.NewDeliveryRepository(db)
	paymentRepo := repository.NewPaymentRepository(db)
	notificationRepo := repository.NewNotificationRepository(db)
	reviewRepo := repository.NewReviewRepository(db)
	promoRepo := repository.NewPromotionRepository(db)
	occasionRepo := repository.NewOccasionRepository(db)
	subRepo := repository.NewSubscriptionRepository(db)
	adminRepo := repository.NewAdminRepository(db)
	analyticsRepo := repository.NewAnalyticsRepository(db)
	cartRepo := repository.NewCartRepository(db)
	wishlistRepo := repository.NewWishlistRepository(db)

	// 2. Services
	analyticsService := services.NewAnalyticsService(analyticsRepo)
	authService := services.NewAuthService(userRepo, cfg)
	sellerService := services.NewSellerService(sellerRepo, userRepo, productRepo)
	productService := services.NewProductService(productRepo)
	personalizationService := services.NewPersonalizationService(personalizationRepo)
	promoService := services.NewPromotionService(promoRepo)
	orderService := services.NewOrderService(orderRepo, productRepo)
	deliveryService := services.NewDeliveryService(deliveryRepo)
	paymentService := services.NewPaymentService(paymentRepo, orderRepo)
	notificationService := services.NewNotificationService(notificationRepo)
	reviewService := services.NewReviewService(reviewRepo)
	occasionService := services.NewOccasionService(occasionRepo)
	subscriptionService := services.NewSubscriptionService(subRepo)
	adminService := services.NewAdminService(adminRepo)
	cartService := services.NewCartService(cartRepo, productRepo, promoService)
	wishlistService := services.NewWishlistService(wishlistRepo)

	// 3. Controllers
	ctrls := &routes.Controllers{
		Auth:            controllers.NewAuthController(authService),
		Seller:          controllers.NewSellerController(sellerService),
		Product:         controllers.NewProductController(productService),
		Personalization: controllers.NewPersonalizationController(personalizationService),
		Order:           controllers.NewOrderController(orderService),
		Delivery:        controllers.NewDeliveryController(deliveryService),
		Payment:         controllers.NewPaymentController(paymentService),
		Notification:    controllers.NewNotificationController(notificationService),
		Review:          controllers.NewReviewController(reviewService),
		Promo:           controllers.NewPromotionController(promoService),
		Occasion:        controllers.NewOccasionController(occasionService),
		Subscription:    controllers.NewSubscriptionController(subscriptionService),
		Admin:           controllers.NewAdminController(adminService),
		Analytics:       controllers.NewAnalyticsController(analyticsService),
		Cart:            controllers.NewCartController(cartService),
		Wishlist:        controllers.NewWishlistController(wishlistService),
	}

	// 4. Router Setup
	r := gin.Default()

	r.Use(func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		if origin == "http://localhost:3000" || origin == cfg.FrontendURL {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
		}
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Max-Age", "86400")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	routes.SetupRouter(r, cfg, ctrls)

	log.Printf("Starting Server on :%s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
