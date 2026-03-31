package controllers

import (
	"net/http"

	"gifts-api/services"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type WishlistController struct {
	wishlistService services.WishlistService
}

func NewWishlistController(wishlistService services.WishlistService) *WishlistController {
	return &WishlistController{wishlistService: wishlistService}
}

type WishlistRequest struct {
	ProductID string `json:"product_id" binding:"required,uuid"`
}

// GetWishlist handles GET /wishlist
func (c *WishlistController) GetWishlist(ctx *gin.Context) {
	userIDStr, _ := ctx.Get("user_id")
	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user ID"})
		return
	}

	items, err := c.wishlistService.GetWishlist(ctx.Request.Context(), userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch wishlist"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": items})
}

// AddToWishlist handles POST /wishlist
func (c *WishlistController) AddToWishlist(ctx *gin.Context) {
	userIDStr, _ := ctx.Get("user_id")
	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user ID"})
		return
	}

	var req WishlistRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	productID, _ := uuid.Parse(req.ProductID)

	if err := c.wishlistService.AddToWishlist(ctx.Request.Context(), userID, productID); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add to wishlist"})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{"message": "Added to wishlist"})
}

// RemoveFromWishlist handles DELETE /wishlist
func (c *WishlistController) RemoveFromWishlist(ctx *gin.Context) {
	userIDStr, _ := ctx.Get("user_id")
	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user ID"})
		return
	}

	var req WishlistRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	productID, _ := uuid.Parse(req.ProductID)

	if err := c.wishlistService.RemoveFromWishlist(ctx.Request.Context(), userID, productID); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove from wishlist"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Removed from wishlist"})
}

// CheckWishlist handles GET /wishlist/check/:product_id
func (c *WishlistController) CheckWishlist(ctx *gin.Context) {
	userIDStr, _ := ctx.Get("user_id")
	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user ID"})
		return
	}

	productID, err := uuid.Parse(ctx.Param("product_id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	inWishlist, err := c.wishlistService.IsInWishlist(ctx.Request.Context(), userID, productID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check wishlist"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"in_wishlist": inWishlist})
}
