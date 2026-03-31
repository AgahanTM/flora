package controllers

import (
	"net/http"

	"gifts-api/models"
	"gifts-api/services"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type PaymentController struct {
	service services.PaymentService
}

func NewPaymentController(service services.PaymentService) *PaymentController {
	return &PaymentController{service: service}
}

func (c *PaymentController) UploadBankProof(ctx *gin.Context) {
	paymentID, err := uuid.Parse(ctx.Param("paymentId"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid payment ID"})
		return
	}

	var req struct {
		ImageURL string `json:"image_url" binding:"required"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userIDStr, _ := ctx.Get("user_id")
	userID, _ := uuid.Parse(userIDStr.(string))

	if err := c.service.UploadBankProof(ctx.Request.Context(), paymentID, userID, req.ImageURL); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "proof uploaded successfully"})
}

func (c *PaymentController) RequestRefund(ctx *gin.Context) {
	paymentID, err := uuid.Parse(ctx.Param("paymentId"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid payment ID"})
		return
	}

	var req struct {
		Reason string  `json:"reason" binding:"required"`
		Amount float64 `json:"amount" binding:"required"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userIDStr, _ := ctx.Get("user_id")
	userID, _ := uuid.Parse(userIDStr.(string))

	refund := &models.Refund{
		PaymentID:   paymentID,
		RequestedBy: userID,
		Amount:      req.Amount,
		Reason:      req.Reason,
	}

	if err := c.service.RequestRefund(ctx.Request.Context(), refund); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "refund requested"})
}

func (c *PaymentController) ProcessRefund(ctx *gin.Context) {
	refundID, err := uuid.Parse(ctx.Param("refundId"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid refund ID"})
		return
	}

	var req struct {
		Approve bool `json:"approve"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	adminIDStr, _ := ctx.Get("user_id")
	adminID, _ := uuid.Parse(adminIDStr.(string))

	status := "approved"
	if !req.Approve {
		status = "rejected"
	}

	if err := c.service.ProcessRefund(ctx.Request.Context(), refundID, adminID, status); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "refund " + status})
}

func (c *PaymentController) ListRefunds(ctx *gin.Context) {
	status := ctx.Query("status")
	offset := 0
	limit := 50

	refunds, total, err := c.service.ListRefunds(ctx.Request.Context(), status, offset, limit)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": refunds, "total": total})
}

func (c *PaymentController) ApproveBankProof(ctx *gin.Context) {
	paymentID, err := uuid.Parse(ctx.Param("paymentId"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid payment ID"})
		return
	}

	adminIDStr, _ := ctx.Get("user_id")
	adminID, _ := uuid.Parse(adminIDStr.(string))

	if err := c.service.ApproveBankProof(ctx.Request.Context(), paymentID, adminID); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "bank proof approved"})
}

func (c *PaymentController) RejectBankProof(ctx *gin.Context) {
	paymentID, err := uuid.Parse(ctx.Param("paymentId"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid payment ID"})
		return
	}

	var req struct {
		Reason string `json:"reason" binding:"required"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	adminIDStr, _ := ctx.Get("user_id")
	adminID, _ := uuid.Parse(adminIDStr.(string))

	if err := c.service.RejectBankProof(ctx.Request.Context(), paymentID, adminID, req.Reason); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "bank proof rejected"})
}

func (c *PaymentController) GetPayment(ctx *gin.Context) {
	paymentID, err := uuid.Parse(ctx.Param("paymentId"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid payment ID"})
		return
	}

	payment, err := c.service.GetPayment(ctx.Request.Context(), paymentID)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "payment not found"})
		return
	}

	// Simple authorization check could be added here if needed

	ctx.JSON(http.StatusOK, gin.H{"data": payment})
}
