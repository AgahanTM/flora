package controllers

import (
	"net/http"
	"strconv"

	"gifts-api/models"
	"gifts-api/services"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ProductController struct {
	productService services.ProductService
}

func NewProductController(productService services.ProductService) *ProductController {
	return &ProductController{productService: productService}
}

func (c *ProductController) GetProducts(ctx *gin.Context) {
	query := ctx.Query("q")
	status := ctx.Query("status")
	
	limit, _ := strconv.Atoi(ctx.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(ctx.DefaultQuery("offset", "0"))
	
	var catIDPtr *uuid.UUID
	if catID := ctx.Query("category_id"); catID != "" {
		id, err := uuid.Parse(catID)
		if err == nil {
			catIDPtr = &id
		}
	}
	
	var selIDPtr *uuid.UUID
	if selID := ctx.Query("seller_id"); selID != "" {
		id, err := uuid.Parse(selID)
		if err == nil {
			selIDPtr = &id
		}
	}

	products, total, err := c.productService.GetProducts(ctx.Request.Context(), query, catIDPtr, selIDPtr, status, offset, limit)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"data":  products,
		"total": total,
	})
}

func (c *ProductController) GetProduct(ctx *gin.Context) {
	id, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid product id"})
		return
	}

	product, err := c.productService.GetProduct(ctx.Request.Context(), id)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "product not found"})
		return
	}

	ctx.JSON(http.StatusOK, product)
}

func (c *ProductController) CreateProduct(ctx *gin.Context) {
	// Assume seller ID from token context
	userIDStr, _ := ctx.Get("user_id")
	sellerID, _ := uuid.Parse(userIDStr.(string))

	var product models.Product
	if err := ctx.ShouldBindJSON(&product); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	product.SellerID = sellerID

	// In real setup, tags/occasions from request payload usually bound differently, simplified here
	var tags []string // Assume we ignore for brief implementation limits

	createdProd, err := c.productService.CreateProduct(ctx.Request.Context(), &product, nil, nil, tags)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, createdProd)
}

func (c *ProductController) Search(ctx *gin.Context) {
	query := ctx.Query("q")
	limit, _ := strconv.Atoi(ctx.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(ctx.DefaultQuery("offset", "0"))

	products, total, err := c.productService.GetProducts(ctx.Request.Context(), query, nil, nil, "active", offset, limit)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"data":  products,
		"total": total,
	})
}

func (c *ProductController) GetSellerProducts(ctx *gin.Context) {
	userIDStr, _ := ctx.Get("user_id")
	sellerID, _ := uuid.Parse(userIDStr.(string))

	limit, _ := strconv.Atoi(ctx.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(ctx.DefaultQuery("offset", "0"))

	products, total, err := c.productService.GetSellerProducts(ctx.Request.Context(), sellerID, offset, limit)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": products, "total": total})
}

func (c *ProductController) UpdateProduct(ctx *gin.Context) {
	id, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid product id"})
		return
	}

	var product models.Product
	if err := ctx.ShouldBindJSON(&product); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	product.ID = id

	if err := c.productService.UpdateProduct(ctx.Request.Context(), &product); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "product updated"})
}

func (c *ProductController) DeleteProduct(ctx *gin.Context) {
	id, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid product id"})
		return
	}

	if err := c.productService.DeleteProduct(ctx.Request.Context(), id); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "product deleted"})
}

func (c *ProductController) GetCategories(ctx *gin.Context) {
	categories, err := c.productService.GetCategories(ctx.Request.Context())
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": categories})
}

func (c *ProductController) CreateCategory(ctx *gin.Context) {
	var category models.Category
	if err := ctx.ShouldBindJSON(&category); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := c.productService.CreateCategory(ctx.Request.Context(), &category); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{"data": category})
}

func (c *ProductController) AddVariant(ctx *gin.Context) {
	productID, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid product id"})
		return
	}

	var variant models.ProductVariant
	if err := ctx.ShouldBindJSON(&variant); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	variant.ProductID = productID

	if err := c.productService.AddVariant(ctx.Request.Context(), &variant); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{"data": variant})
}

func (c *ProductController) AddAddon(ctx *gin.Context) {
	productID, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid product id"})
		return
	}

	var addon models.ProductAddon
	if err := ctx.ShouldBindJSON(&addon); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	addon.ProductID = &productID

	if err := c.productService.AddAddon(ctx.Request.Context(), &addon); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{"data": addon})
}

func (c *ProductController) UpdateInventory(ctx *gin.Context) {
	productID, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid product id"})
		return
	}

	var req struct {
		VariantID *uuid.UUID `json:"variant_id"`
		Total     int        `json:"total" binding:"required"`
		Reserved  int        `json:"reserved"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := c.productService.UpdateInventory(ctx.Request.Context(), productID, req.VariantID, req.Total, req.Reserved); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "inventory updated"})
}

func (c *ProductController) GetLowStockAlerts(ctx *gin.Context) {
	userIDStr, _ := ctx.Get("user_id")
	sellerID, _ := uuid.Parse(userIDStr.(string))

	alerts, err := c.productService.GetLowStockAlerts(ctx.Request.Context(), sellerID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": alerts})
}

func (c *ProductController) GetFeaturedProducts(ctx *gin.Context) {
	limit := 10
	if limitStr := ctx.Query("limit"); limitStr != "" {
		if parsed, err := strconv.Atoi(limitStr); err == nil && parsed > 0 {
			limit = parsed
		}
	}
	products, err := c.productService.GetFeaturedProducts(ctx.Request.Context(), limit)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"data": products})
}

func (c *ProductController) ToggleProductFeatured(ctx *gin.Context) {
	idStr := ctx.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid product id"})
		return
	}
	var req struct {
		IsFeatured bool `json:"is_featured"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := c.productService.ToggleProductFeatured(ctx.Request.Context(), id, req.IsFeatured); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "featured status updated"})
}

func (c *ProductController) Autocomplete(ctx *gin.Context) {
	query := ctx.Query("q")
	limit, _ := strconv.Atoi(ctx.DefaultQuery("limit", "10"))
	
	products, err := c.productService.Autocomplete(ctx.Request.Context(), query, limit)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": products})
}
