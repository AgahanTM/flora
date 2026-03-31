package controllers

import (
	"net/http"

	"gifts-api/models"
	"gifts-api/services"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type PromotionController struct {
	service services.PromotionService
}

func NewPromotionController(service services.PromotionService) *PromotionController {
	return &PromotionController{service: service}
}

func (c *PromotionController) CreatePromotion(ctx *gin.Context) {
	var promo models.Promotion
	if err := ctx.ShouldBindJSON(&promo); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	createdPromo, err := c.service.CreatePromotion(ctx.Request.Context(), &promo, nil)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, createdPromo)
}

func (c *PromotionController) ValidatePromo(ctx *gin.Context) {
	code := ctx.Query("code")
	if code == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "code query param required"})
		return
	}

	var req struct {
		CartSubtotal float64 `json:"cart_subtotal"`
	}
	ctx.ShouldBindJSON(&req)

	// Anonymous check for now, nil passed as nil uuid.UUID 
	promo, err := c.service.ValidatePromotion(ctx.Request.Context(), code, uuid.Nil, req.CartSubtotal)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, promo)
}

func (c *PromotionController) ListPromotions(ctx *gin.Context) {
	// For admin to list promotions
	// Use default limit/offset parsing if needed, but not strictly asked here, I'll add basic ones
	offset := 0
	limit := 50
	
	promos, total, err := c.service.ListPromotions(ctx.Request.Context(), offset, limit)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": promos, "total": total})
}
