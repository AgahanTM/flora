package middleware

import (
	"github.com/gin-gonic/gin"
	"github.com/ulule/limiter/v3"
	mgin "github.com/ulule/limiter/v3/drivers/middleware/gin"
	srepository "github.com/ulule/limiter/v3/drivers/store/memory"
)

// RateLimiter creates a new rate limiter middleware.
// For example, rate = "5-M" means 5 requests per minute.
func RateLimiter(formattedRate string) gin.HandlerFunc {
	// Define a limit rate
	rate, err := limiter.NewRateFromFormatted(formattedRate)
	if err != nil {
		panic(err)
	}

	// Create a store with the memory backend
	store := srepository.NewStore()

	// Create a new middleware with the limiter instance
	instance := limiter.New(store, rate)
	return mgin.NewMiddleware(instance)
}
