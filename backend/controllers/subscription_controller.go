package controllers

import (
	"net/http"

	"gifts-api/models"
	"gifts-api/services"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type SubscriptionController struct {
	service services.SubscriptionService
}

func NewSubscriptionController(service services.SubscriptionService) *SubscriptionController {
	return &SubscriptionController{service: service}
}

func (c *SubscriptionController) GetPlans(ctx *gin.Context) {
	plans, err := c.service.GetActivePlans(ctx.Request.Context())
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, plans)
}

func (c *SubscriptionController) Subscribe(ctx *gin.Context) {
	var req models.Subscription
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userIDStr, _ := ctx.Get("user_id")
	userID, _ := uuid.Parse(userIDStr.(string))
	req.CustomerID = userID

	if err := c.service.Subscribe(ctx.Request.Context(), &req); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, req)
}

func (c *SubscriptionController) PauseSubscription(ctx *gin.Context) {
	subID, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid subscription ID"})
		return
	}

	if err := c.service.PauseSubscription(ctx.Request.Context(), subID); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "subscription paused"})
}

func (c *SubscriptionController) ProcessDelivery(ctx *gin.Context) {
	deliveryID, err := uuid.Parse(ctx.Param("deliveryId"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid delivery ID"})
		return
	}

	var req struct {
		Status string `json:"status" binding:"required"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := c.service.ProcessDelivery(ctx.Request.Context(), deliveryID, req.Status); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "delivery status updated"})
}

func (c *SubscriptionController) CancelSubscription(ctx *gin.Context) {
	subID, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid subscription ID"})
		return
	}

	if err := c.service.CancelSubscription(ctx.Request.Context(), subID); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "subscription cancelled"})
}

func (c *SubscriptionController) GetSubscriptions(ctx *gin.Context) {
	userIDStr, _ := ctx.Get("user_id")
	userID, _ := uuid.Parse(userIDStr.(string))

	subs, err := c.service.GetSubscriptions(ctx.Request.Context(), userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"data": subs})
}

func (c *SubscriptionController) ScheduleDeliveries(ctx *gin.Context) {
	subID, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid subscription ID"})
		return
	}

	var req struct {
		Dates []string `json:"dates" binding:"required"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := c.service.ScheduleDeliveries(ctx.Request.Context(), subID, req.Dates); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{"message": "deliveries scheduled"})
}

func (c *SubscriptionController) ResumeSubscription(ctx *gin.Context) {
	subID, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid subscription ID"})
		return
	}

	if err := c.service.ResumeSubscription(ctx.Request.Context(), subID); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "subscription resumed"})
}
