package controllers

import (
	"net/http"

	"gifts-api/models"
	"gifts-api/services"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type PersonalizationController struct {
	service services.PersonalizationService
}

func NewPersonalizationController(service services.PersonalizationService) *PersonalizationController {
	return &PersonalizationController{service: service}
}

func (c *PersonalizationController) GetTypes(ctx *gin.Context) {
	activeOnly := ctx.Query("active_only") != "false"
	types, err := c.service.GetTypes(ctx.Request.Context(), activeOnly)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, types)
}

func (c *PersonalizationController) CreateType(ctx *gin.Context) {
	var req models.PersonalizationType
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := c.service.CreateType(ctx.Request.Context(), &req); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusCreated, req)
}

func (c *PersonalizationController) GetTemplates(ctx *gin.Context) {
	typeID, err := uuid.Parse(ctx.Param("typeId"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid type ID"})
		return
	}

	activeOnly := ctx.Query("active_only") != "false"
	templates, err := c.service.GetTemplates(ctx.Request.Context(), typeID, activeOnly)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, templates)
}

func (c *PersonalizationController) CreateTemplate(ctx *gin.Context) {
	var req models.PersonalizationTemplate
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := c.service.CreateTemplate(ctx.Request.Context(), &req); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusCreated, req)
}

func (c *PersonalizationController) GetJob(ctx *gin.Context) {
	jobID, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid job ID"})
		return
	}

	job, err := c.service.GetJob(ctx.Request.Context(), jobID)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "job not found"})
		return
	}
	ctx.JSON(http.StatusOK, job)
}

func (c *PersonalizationController) UpdateJobStatus(ctx *gin.Context) {
	jobID, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid job ID"})
		return
	}

	var req struct {
		Status string `json:"status" binding:"required"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := c.service.UpdateJobStatus(ctx.Request.Context(), jobID, req.Status); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "status updated"})
}
