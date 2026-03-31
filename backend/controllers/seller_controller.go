package controllers

import (
	"net/http"
	"strconv"

	"gifts-api/models"
	"gifts-api/services"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type SellerController struct {
	sellerService services.SellerService
}

func NewSellerController(sellerService services.SellerService) *SellerController {
	return &SellerController{sellerService: sellerService}
}

type ApplySellerRequest struct {
	ShopName    string `json:"shop_name" binding:"required"`
	Description string `json:"description"`
}

func (c *SellerController) Apply(ctx *gin.Context) {
	userIDStr, exists := ctx.Get("user_id")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID, _ := uuid.Parse(userIDStr.(string))

	var req ApplySellerRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	seller := &models.Seller{
		ShopName:    req.ShopName,
		Description: req.Description,
	}

	createdSeller, err := c.sellerService.RegisterSeller(ctx.Request.Context(), userID, seller)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, createdSeller)
}

func (c *SellerController) GetProfile(ctx *gin.Context) {
	userIDStr, _ := ctx.Get("user_id")
	userID, _ := uuid.Parse(userIDStr.(string))

	seller, err := c.sellerService.GetSellerByUserID(ctx.Request.Context(), userID)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "seller not found"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": seller})
}

func (c *SellerController) UpdateProfile(ctx *gin.Context) {
	userIDStr, _ := ctx.Get("user_id")
	userID, _ := uuid.Parse(userIDStr.(string))

	seller, err := c.sellerService.GetSellerByUserID(ctx.Request.Context(), userID)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "seller not found"})
		return
	}

	var updates models.Seller
	if err := ctx.ShouldBindJSON(&updates); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := c.sellerService.UpdateSellerProfile(ctx.Request.Context(), seller.ID, &updates); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "profile updated"})
}

func (c *SellerController) UploadDocument(ctx *gin.Context) {
	userIDStr, _ := ctx.Get("user_id")
	userID, _ := uuid.Parse(userIDStr.(string))

	seller, err := c.sellerService.GetSellerByUserID(ctx.Request.Context(), userID)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "seller not found"})
		return
	}

	var doc models.SellerDocument
	if err := ctx.ShouldBindJSON(&doc); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	doc.SellerID = seller.ID

	if err := c.sellerService.UploadDocument(ctx.Request.Context(), &doc); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{"message": "document uploaded"})
}

func (c *SellerController) UpdateBankDetails(ctx *gin.Context) {
	userIDStr, _ := ctx.Get("user_id")
	userID, _ := uuid.Parse(userIDStr.(string))

	seller, err := c.sellerService.GetSellerByUserID(ctx.Request.Context(), userID)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "seller not found"})
		return
	}

	var bd models.SellerBankDetail
	if err := ctx.ShouldBindJSON(&bd); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	bd.SellerID = seller.ID

	if err := c.sellerService.UpdateBankDetails(ctx.Request.Context(), &bd); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "bank details updated"})
}

func (c *SellerController) UpdateWorkingHours(ctx *gin.Context) {
	userIDStr, _ := ctx.Get("user_id")
	userID, _ := uuid.Parse(userIDStr.(string))

	seller, err := c.sellerService.GetSellerByUserID(ctx.Request.Context(), userID)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "seller not found"})
		return
	}

	var hours []models.SellerWorkingHour
	if err := ctx.ShouldBindJSON(&hours); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := c.sellerService.UpdateWorkingHours(ctx.Request.Context(), seller.ID, hours); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "working hours updated"})
}

func (c *SellerController) UpdateDeliveryZones(ctx *gin.Context) {
	userIDStr, _ := ctx.Get("user_id")
	userID, _ := uuid.Parse(userIDStr.(string))

	seller, err := c.sellerService.GetSellerByUserID(ctx.Request.Context(), userID)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "seller not found"})
		return
	}

	var req struct {
		ZoneIDs []uuid.UUID `json:"zone_ids" binding:"required"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := c.sellerService.UpdateDeliveryZones(ctx.Request.Context(), seller.ID, req.ZoneIDs); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "delivery zones updated"})
}

// --- Admin Seller Management ---

func (c *SellerController) ListSellers(ctx *gin.Context) {
	status := ctx.DefaultQuery("status", "")
	limit, _ := strconv.Atoi(ctx.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(ctx.DefaultQuery("offset", "0"))

	sellers, total, err := c.sellerService.ListSellers(ctx.Request.Context(), status, offset, limit)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": sellers, "total": total})
}

func (c *SellerController) ApproveSeller(ctx *gin.Context) {
	sellerID, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid seller ID"})
		return
	}

	adminIDStr, _ := ctx.Get("user_id")
	adminID, _ := uuid.Parse(adminIDStr.(string))

	if err := c.sellerService.ApproveSeller(ctx.Request.Context(), sellerID, adminID); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "seller approved"})
}

func (c *SellerController) RejectSeller(ctx *gin.Context) {
	sellerID, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid seller ID"})
		return
	}

	adminIDStr, _ := ctx.Get("user_id")
	adminID, _ := uuid.Parse(adminIDStr.(string))

	var req struct {
		Reason string `json:"reason" binding:"required"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := c.sellerService.RejectSeller(ctx.Request.Context(), sellerID, adminID, req.Reason); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "seller rejected"})
}

func (c *SellerController) SuspendSeller(ctx *gin.Context) {
	sellerID, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid seller ID"})
		return
	}

	adminIDStr, _ := ctx.Get("user_id")
	adminID, _ := uuid.Parse(adminIDStr.(string))

	var req struct {
		Reason string `json:"reason" binding:"required"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := c.sellerService.SuspendSeller(ctx.Request.Context(), sellerID, adminID, req.Reason); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "seller suspended"})
}

func (c *SellerController) GetPublicProfile(ctx *gin.Context) {
	idStr := ctx.Param("id")
	
	var seller *models.Seller
	var err error

	if id, parseErr := uuid.Parse(idStr); parseErr == nil {
		seller, err = c.sellerService.GetSeller(ctx.Request.Context(), id)
	} else {
		seller, err = c.sellerService.GetSellerBySlug(ctx.Request.Context(), idStr)
	}

	if err != nil || seller == nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "seller not found"})
		return
	}

	if seller.Status != "approved" {
		ctx.JSON(http.StatusForbidden, gin.H{"error": "seller not active"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": seller})
}
