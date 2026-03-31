package controllers

import (
	"net/http"

	"gifts-api/services"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type CartController struct {
	cartService services.CartService
}

func NewCartController(cartService services.CartService) *CartController {
	return &CartController{cartService: cartService}
}

type AddToCartRequest struct {
	ProductID string  `json:"product_id" binding:"required,uuid"`
	VariantID *string `json:"variant_id" binding:"omitempty,uuid"`
	Quantity  int     `json:"quantity" binding:"required,min=1"`
}

type RemoveFromCartRequest struct {
	ProductID string  `json:"product_id" binding:"required,uuid"`
	VariantID *string `json:"variant_id" binding:"omitempty,uuid"`
}

type ApplyPromoRequest struct {
	Code string `json:"code" binding:"required"`
}

func (c *CartController) GetCart(ctx *gin.Context) {
	userIDStr, _ := ctx.Get("user_id")
	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user ID"})
		return
	}

	cart, err := c.cartService.GetCart(ctx.Request.Context(), userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": cart})
}

func (c *CartController) AddToCart(ctx *gin.Context) {
	userIDStr, _ := ctx.Get("user_id")
	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user ID"})
		return
	}

	var req AddToCartRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	productID, _ := uuid.Parse(req.ProductID)

	var variantID *uuid.UUID
	if req.VariantID != nil {
		vid, err := uuid.Parse(*req.VariantID)
		if err == nil {
			variantID = &vid
		}
	}

	err = c.cartService.AddToCart(ctx.Request.Context(), userID, productID, variantID, req.Quantity)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Item added to cart"})
}

func (c *CartController) RemoveFromCart(ctx *gin.Context) {
	userIDStr, _ := ctx.Get("user_id")
	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user ID"})
		return
	}

	var req RemoveFromCartRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	productID, _ := uuid.Parse(req.ProductID)

	var variantID *uuid.UUID
	if req.VariantID != nil {
		vid, err := uuid.Parse(*req.VariantID)
		if err == nil {
			variantID = &vid
		}
	}

	err = c.cartService.RemoveFromCart(ctx.Request.Context(), userID, productID, variantID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Item removed from cart"})
}

func (c *CartController) ApplyPromo(ctx *gin.Context) {
	userIDStr, _ := ctx.Get("user_id")
	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user ID"})
		return
	}

	var req ApplyPromoRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := c.cartService.ApplyPromoCode(ctx.Request.Context(), userID, req.Code); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Promo code applied"})
}

func (c *CartController) RemovePromo(ctx *gin.Context) {
	userIDStr, _ := ctx.Get("user_id")
	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user ID"})
		return
	}

	if err := c.cartService.RemovePromoCode(ctx.Request.Context(), userID); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Promo code removed"})
}

type UpdateCartItemRequest struct {
	ProductID string  `json:"product_id" binding:"required,uuid"`
	VariantID *string `json:"variant_id" binding:"omitempty,uuid"`
	Quantity  int     `json:"quantity" binding:"required"` // Can be 0 to remove
}

func (c *CartController) UpdateCartItemQuantity(ctx *gin.Context) {
	userIDStr, _ := ctx.Get("user_id")
	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user ID"})
		return
	}

	var req UpdateCartItemRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	productID, _ := uuid.Parse(req.ProductID)
	var variantID *uuid.UUID
	if req.VariantID != nil {
		vid, err := uuid.Parse(*req.VariantID)
		if err == nil {
			variantID = &vid
		}
	}

	err = c.cartService.UpdateCartItemQuantity(ctx.Request.Context(), userID, productID, variantID, req.Quantity)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Cart item quantity updated"})
}
