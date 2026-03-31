package controllers

import (
	"encoding/json"
	"net/http"

	"gifts-api/models"
	"gifts-api/services"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type AnalyticsController struct {
	service services.AnalyticsService
}

func NewAnalyticsController(service services.AnalyticsService) *AnalyticsController {
	return &AnalyticsController{service: service}
}

func (c *AnalyticsController) TrackEvent(ctx *gin.Context) {
	var event models.AnalyticsEvent
	if err := ctx.ShouldBindJSON(&event); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userIDStr, exists := ctx.Get("user_id")
	if exists {
		id, err := uuid.Parse(userIDStr.(string))
		if err == nil {
			event.UserID = &id
		}
	}

	// parse data string as json map to pass
	var meta map[string]interface{}
	if event.Data != nil {
		_ = json.Unmarshal([]byte(*event.Data), &meta)
	}
	if err := c.service.LogEvent(ctx.Request.Context(), event.EventType, event.UserID, nil, meta); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{"message": "event tracked"})
}

func (c *AnalyticsController) GetDailyStats(ctx *gin.Context) {
	date := ctx.Query("date")
	if date == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "date query param required"})
		return
	}

	stats, err := c.service.GetDailyStats(ctx.Request.Context(), date, date)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, stats)
}

func (c *AnalyticsController) GetSellerDailyStats(ctx *gin.Context) {
	sellerIDStr, _ := ctx.Get("user_id")
	sellerID, _ := uuid.Parse(sellerIDStr.(string))

	date := ctx.Query("date")
	if date == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "date query param required"})
		return
	}

	stats, err := c.service.GetSellerDailyStats(ctx.Request.Context(), sellerID, date, date)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, stats)
}
