package controllers

import (
	"net/http"
 
	"gifts-api/models"
	"gifts-api/services"
 
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type NotificationController struct {
	service services.NotificationService
}

func NewNotificationController(service services.NotificationService) *NotificationController {
	return &NotificationController{service: service}
}

func (c *NotificationController) GetUserNotifications(ctx *gin.Context) {
	userIDStr, _ := ctx.Get("user_id")
	userID, _ := uuid.Parse(userIDStr.(string))

	notifications, total, err := c.service.GetUserNotifications(ctx.Request.Context(), userID, 50, 0)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": notifications, "total": total})
}

func (c *NotificationController) MarkAsRead(ctx *gin.Context) {
	userIDStr, _ := ctx.Get("user_id")
	userID, _ := uuid.Parse(userIDStr.(string))

	idStr := ctx.Param("id")
	if idStr == "all" {
		if err := c.service.MarkAllAsRead(ctx.Request.Context(), userID); err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	} else {
		notifID, err := uuid.Parse(idStr)
		if err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid notification ID"})
			return
		}
		if err := c.service.MarkAsRead(ctx.Request.Context(), notifID, userID); err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "marked as read"})
}

func (c *NotificationController) GetPreferences(ctx *gin.Context) {
	userIDStr, _ := ctx.Get("user_id")
	userID, _ := uuid.Parse(userIDStr.(string))

	prefs, err := c.service.GetPreferences(ctx.Request.Context(), userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, prefs)
}

func (c *NotificationController) UpdatePreferences(ctx *gin.Context) {
	userIDStr, _ := ctx.Get("user_id")
	userID, _ := uuid.Parse(userIDStr.(string))

	var req models.NotificationPreference
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	req.UserID = userID

	if err := c.service.UpdatePreferences(ctx.Request.Context(), &req); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, req)
}
