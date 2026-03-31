package routes

import (
	"gifts-api/config"
	"gifts-api/controllers"
	"gifts-api/middleware"

	"github.com/gin-gonic/gin"
)

type Controllers struct {
	Auth            *controllers.AuthController
	Seller          *controllers.SellerController
	Product         *controllers.ProductController
	Personalization *controllers.PersonalizationController
	Order           *controllers.OrderController
	Delivery        *controllers.DeliveryController
	Payment         *controllers.PaymentController
	Notification    *controllers.NotificationController
	Review          *controllers.ReviewController
	Promo           *controllers.PromotionController
	Occasion        *controllers.OccasionController
	Subscription    *controllers.SubscriptionController
	Admin           *controllers.AdminController
	Analytics       *controllers.AnalyticsController
	Cart            *controllers.CartController
	Wishlist        *controllers.WishlistController
}

func SetupRouter(r *gin.Engine, cfg *config.AppConfig, ctrls *Controllers) {
	v1 := r.Group("/api/v1")
	{
		// Health
		v1.GET("/health", func(c *gin.Context) {
			c.JSON(200, gin.H{"status": "UP", "message": "Gifts API"})
		})

		// Public Routes
		v1.POST("/auth/register", ctrls.Auth.Register)
		v1.POST("/auth/login", ctrls.Auth.Login)
		v1.POST("/auth/refresh", ctrls.Auth.Refresh)
		v1.POST("/auth/send-otp", ctrls.Auth.SendOTP)
		v1.POST("/auth/verify-otp", ctrls.Auth.VerifyOTP)
		v1.POST("/auth/request-password-reset", ctrls.Auth.RequestPasswordReset)
		v1.POST("/auth/confirm-password-reset", ctrls.Auth.ConfirmPasswordReset)

		// Public Products & Categories
		v1.GET("/products/featured", ctrls.Product.GetFeaturedProducts)
		v1.GET("/products/autocomplete", ctrls.Product.Autocomplete)
		v1.GET("/products", ctrls.Product.GetProducts)
		v1.GET("/products/:id", ctrls.Product.GetProduct)
		v1.GET("/products/:id/reviews", ctrls.Review.GetProductReviews)
		v1.GET("/products/search", ctrls.Product.Search)
		v1.GET("/categories", ctrls.Product.GetCategories)
		
		// Public Occasions
		v1.GET("/occasions", ctrls.Occasion.GetAllOccasions)
		v1.GET("/occasions/suggestions", ctrls.Occasion.GetSuggestions)
		
		// Public Sellers
		v1.GET("/sellers/:id", ctrls.Seller.GetPublicProfile)
		
		// Public Gift Builder Sessions
		v1.POST("/gift-builder/sessions", ctrls.Occasion.StartSession)
		v1.GET("/gift-builder/sessions/:id", ctrls.Occasion.GetSession)
		v1.PUT("/gift-builder/sessions/:id/step", ctrls.Occasion.UpdateSessionStep)
		v1.PUT("/gift-builder/sessions/:id/complete", ctrls.Occasion.CompleteSession)
		
		// Public Promos
		v1.GET("/promotions/validate", ctrls.Promo.ValidatePromo)

		// Public Banners
		v1.GET("/banners", ctrls.Admin.GetBanners)
		
		// Public System Settings
		v1.GET("/settings", ctrls.Admin.GetSettings)

		// Protected Routes
		protected := v1.Group("/")
		protected.Use(middleware.JWTMiddleware(cfg))
		{
			protected.POST("/auth/logout", ctrls.Auth.Logout)

			// User Profile & Addresses
			protected.GET("/profile", ctrls.Auth.GetProfile)
			protected.PUT("/profile", ctrls.Auth.UpdateProfile)
			protected.GET("/addresses", ctrls.Auth.GetAddresses)
			protected.POST("/addresses", ctrls.Auth.AddAddress)
			protected.PUT("/addresses/:id", ctrls.Auth.UpdateAddress)
			protected.PUT("/addresses/:id/default", ctrls.Auth.SetDefaultAddress)
			protected.DELETE("/addresses/:id", ctrls.Auth.DeleteAddress)

			// Seller Application
			protected.POST("/seller/apply", ctrls.Seller.Apply)

			// Analytics Track Event
			protected.POST("/analytics/track", ctrls.Analytics.TrackEvent)

			// Cart
			protected.GET("/cart", ctrls.Cart.GetCart)
			protected.POST("/cart/items", ctrls.Cart.AddToCart)
			protected.PUT("/cart/items", ctrls.Cart.UpdateCartItemQuantity)
			protected.DELETE("/cart/items", ctrls.Cart.RemoveFromCart)
			protected.POST("/cart/promo", ctrls.Cart.ApplyPromo)
			protected.DELETE("/cart/promo", ctrls.Cart.RemovePromo)

			// Wishlist
			protected.GET("/wishlist", ctrls.Wishlist.GetWishlist)
			protected.POST("/wishlist", ctrls.Wishlist.AddToWishlist)
			protected.DELETE("/wishlist", ctrls.Wishlist.RemoveFromWishlist)
			protected.GET("/wishlist/check/:product_id", ctrls.Wishlist.CheckWishlist)

			// Orders
			protected.GET("/orders", ctrls.Order.GetCustomerOrders)
			protected.POST("/orders", ctrls.Order.PlaceOrder)
			protected.GET("/orders/:id", ctrls.Order.GetOrder)
			protected.PUT("/orders/:id/status", ctrls.Order.UpdateStatus)

			// Saved Occasions
			protected.POST("/saved-occasions", ctrls.Occasion.SaveOccasion)
			protected.GET("/saved-occasions", ctrls.Occasion.GetSavedOccasions)

			// Delivery Slots
			protected.GET("/delivery/slots", ctrls.Delivery.GetAvailableSlots)

			// Reviews & Issues
			protected.POST("/reviews", ctrls.Review.CreateReview)
			protected.PUT("/reviews/:id", ctrls.Review.UpdateReview)
			protected.DELETE("/reviews/:id", ctrls.Review.DeleteReview)
			protected.PUT("/reviews/:id/respond", ctrls.Review.RespondToReview)
			protected.POST("/issue-reports", ctrls.Review.ReportIssue)

			// Notifications
			protected.GET("/notifications/preferences", ctrls.Notification.GetPreferences)
			protected.PUT("/notifications/preferences", ctrls.Notification.UpdatePreferences)
			protected.GET("/notifications", ctrls.Notification.GetUserNotifications)
			protected.PUT("/notifications/:id/read", ctrls.Notification.MarkAsRead)

			// Personalization
			protected.GET("/personalization/types", ctrls.Personalization.GetTypes)
			protected.POST("/personalization/types", ctrls.Personalization.CreateType)
			protected.GET("/personalization/types/:typeId/templates", ctrls.Personalization.GetTemplates)
			protected.GET("/personalization/jobs/:id", ctrls.Personalization.GetJob)
			protected.PUT("/personalization/jobs/:id/status", ctrls.Personalization.UpdateJobStatus)
			
			// Subscriptions
			protected.GET("/subscriptions/plans", ctrls.Subscription.GetPlans)
			protected.POST("/subscriptions", ctrls.Subscription.Subscribe)
			protected.GET("/subscriptions", ctrls.Subscription.GetSubscriptions)
			protected.PUT("/subscriptions/:id/pause", ctrls.Subscription.PauseSubscription)
			protected.PUT("/subscriptions/:id/cancel", ctrls.Subscription.CancelSubscription)
			protected.PUT("/subscriptions/:id/resume", ctrls.Subscription.ResumeSubscription)
			
			// Payments
			protected.GET("/payments/:paymentId", ctrls.Payment.GetPayment)
			protected.POST("/payments/:paymentId/proof", ctrls.Payment.UploadBankProof)
			protected.POST("/payments/:paymentId/refund", ctrls.Payment.RequestRefund)

			// Admin Routes
			admin := protected.Group("/admin")
			admin.Use(middleware.RequireAdmin())
			{
				admin.GET("/settings", ctrls.Admin.GetSettings)
				admin.PUT("/settings", ctrls.Admin.UpdateSetting)
				admin.GET("/logs", ctrls.Admin.GetAuditLogs)
				
				admin.GET("/sellers", ctrls.Seller.ListSellers)
				admin.PUT("/sellers/:id/approve", ctrls.Seller.ApproveSeller)
				admin.PUT("/sellers/:id/reject", ctrls.Seller.RejectSeller)
				admin.PUT("/sellers/:id/suspend", ctrls.Seller.SuspendSeller)

				admin.GET("/orders", ctrls.Order.GetAllOrders)

				admin.GET("/promotions", ctrls.Promo.ListPromotions)
				admin.POST("/promotions", ctrls.Promo.CreatePromotion)

				admin.GET("/categories", ctrls.Product.GetCategories)
				admin.POST("/categories", ctrls.Product.CreateCategory)
				
				admin.PUT("/products/:id/featured", ctrls.Product.ToggleProductFeatured)

				admin.POST("/occasions", ctrls.Occasion.CreateOccasion)

				admin.GET("/couriers", ctrls.Delivery.ListCouriers)
				admin.POST("/couriers", ctrls.Delivery.CreateCourier)
				admin.PUT("/deliveries/:id/assign", ctrls.Delivery.AssignDelivery)

				admin.GET("/refunds", ctrls.Payment.ListRefunds)
				admin.PUT("/payments/refunds/:refundId/process", ctrls.Payment.ProcessRefund)
				
				admin.PUT("/payments/:paymentId/approve-proof", ctrls.Payment.ApproveBankProof)
				admin.PUT("/payments/:paymentId/reject-proof", ctrls.Payment.RejectBankProof)
				
				admin.GET("/analytics/daily", ctrls.Analytics.GetDailyStats)
				admin.GET("/analytics/seller", ctrls.Analytics.GetSellerDailyStats)
				
				admin.GET("/delivery/zones", ctrls.Delivery.GetZones)
				admin.POST("/delivery/zones", ctrls.Delivery.CreateZone)

				admin.POST("/subscriptions/:id/deliveries", ctrls.Subscription.ScheduleDeliveries)

				admin.POST("/personalization/templates", ctrls.Personalization.CreateTemplate)

				admin.GET("/issue-reports", ctrls.Review.GetIssueReports)
				admin.PUT("/issue-reports/:id/status", ctrls.Review.UpdateIssueStatus)

				admin.POST("/banners", ctrls.Admin.CreateBanner)
				admin.PUT("/banners/:id", ctrls.Admin.UpdateBanner)
			}
			
			// Courier Routes
			courier := protected.Group("/courier")
			courier.Use(middleware.RequireCourier())
			{
				courier.GET("/deliveries", ctrls.Delivery.GetCourierDeliveries)
				courier.PUT("/location", ctrls.Delivery.UpdateCourierLocation)
				courier.PUT("/deliveries/:deliveryId/process", ctrls.Subscription.ProcessDelivery)
			}
			
			// Seller Routes
			seller := protected.Group("/seller")
			seller.Use(middleware.RequireSeller())
			{
				seller.GET("/profile", ctrls.Seller.GetProfile)
				seller.PUT("/profile", ctrls.Seller.UpdateProfile)

				seller.GET("/products", ctrls.Product.GetSellerProducts)
				seller.POST("/products", ctrls.Product.CreateProduct)
				seller.PUT("/products/:id", ctrls.Product.UpdateProduct)
				seller.DELETE("/products/:id", ctrls.Product.DeleteProduct)

				seller.POST("/products/:id/variants", ctrls.Product.AddVariant)
				seller.POST("/products/:id/addons", ctrls.Product.AddAddon)
				seller.PUT("/products/:id/inventory", ctrls.Product.UpdateInventory)
				seller.GET("/products/low-stock", ctrls.Product.GetLowStockAlerts)

				seller.POST("/documents", ctrls.Seller.UploadDocument)
				seller.PUT("/bank-details", ctrls.Seller.UpdateBankDetails)
				seller.PUT("/working-hours", ctrls.Seller.UpdateWorkingHours)
				seller.PUT("/delivery-zones", ctrls.Seller.UpdateDeliveryZones)
				seller.POST("/delivery/time-slots", ctrls.Delivery.CreateTimeSlot)

				seller.GET("/orders", ctrls.Order.GetSellerOrders)
				seller.GET("/reviews", ctrls.Review.GetSellerReviews)
			}
		}
	}
}
