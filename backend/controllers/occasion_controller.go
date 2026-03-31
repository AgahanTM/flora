package controllers

import (
	"net/http"
 
	"gifts-api/models"
	"gifts-api/services"
 
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type OccasionController struct {
	service services.OccasionService
}

func NewOccasionController(service services.OccasionService) *OccasionController {
	return &OccasionController{service: service}
}

func (c *OccasionController) GetAllOccasions(ctx *gin.Context) {
	occasions, err := c.service.GetCatalog(ctx.Request.Context())
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, occasions)
}

func (c *OccasionController) GetSuggestions(ctx *gin.Context) {
	occasionID, err := uuid.Parse(ctx.Query("occasionId"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid occasion id"})
		return
	}
	responses, err := c.service.GetSuggestions(ctx.Request.Context(), occasionID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, responses)
}

func (c *OccasionController) StartSession(ctx *gin.Context) {
	var req struct {
		OccasionID uuid.UUID `json:"occasion_id" binding:"required"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var customerID *uuid.UUID
	userIDStr, exists := ctx.Get("user_id")
	if exists {
		parsed, err := uuid.Parse(userIDStr.(string))
		if err == nil {
			customerID = &parsed
		}
	}

	session, err := c.service.StartSession(ctx.Request.Context(), customerID, req.OccasionID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, session)
}

func (c *OccasionController) GetSession(ctx *gin.Context) {
	sessionID, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid session id"})
		return
	}

	session, err := c.service.GetSession(ctx.Request.Context(), sessionID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, session)
}

func (c *OccasionController) UpdateSessionStep(ctx *gin.Context) {
	sessionID, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid session id"})
		return
	}

	var req struct {
		Step string `json:"step" binding:"required"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := c.service.UpdateSessionStep(ctx.Request.Context(), sessionID, req.Step); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "session step updated"})
}

func (c *OccasionController) CompleteSession(ctx *gin.Context) {
	sessionID, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid session id"})
		return
	}

	if err := c.service.CompleteSession(ctx.Request.Context(), sessionID); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "session completed"})
}

func (c *OccasionController) SaveOccasion(ctx *gin.Context) {
	var req models.SavedOccasion
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userIDStr, _ := ctx.Get("user_id")
	userID, _ := uuid.Parse(userIDStr.(string))
	req.CustomerID = userID

	if err := c.service.SaveOccasion(ctx.Request.Context(), &req); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, req)
}

func (c *OccasionController) GetSavedOccasions(ctx *gin.Context) {
	userIDStr, _ := ctx.Get("user_id")
	userID, _ := uuid.Parse(userIDStr.(string))

	occasions, err := c.service.GetSavedOccasions(ctx.Request.Context(), userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": occasions})
}

func (c *OccasionController) CreateOccasion(ctx *gin.Context) {
	var req models.Occasion
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := c.service.CreateOccasion(ctx.Request.Context(), &req); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, req)
}
