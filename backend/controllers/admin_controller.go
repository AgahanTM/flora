package controllers

import (
	"net/http"
 
	"gifts-api/models"
	"gifts-api/services"
 
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type AdminController struct {
	service services.AdminService
}

func NewAdminController(service services.AdminService) *AdminController {
	return &AdminController{service: service}
}

func (c *AdminController) GetSettings(ctx *gin.Context) {
	settings, err := c.service.GetAllSettings(ctx.Request.Context())
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, settings)
}

func (c *AdminController) UpdateSetting(ctx *gin.Context) {
	var setting models.SystemSetting
	if err := ctx.ShouldBindJSON(&setting); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var value string
	if setting.Value != nil {
		value = *setting.Value
	}

	if err := c.service.UpdateSetting(ctx.Request.Context(), setting.Key, value); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "setting updated"})
}

func (c *AdminController) GetAuditLogs(ctx *gin.Context) {
	// Paging removed for brevity
	logs, _, err := c.service.GetLogs(ctx.Request.Context(), 50, 0)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, logs)
}

func (c *AdminController) CreateBanner(ctx *gin.Context) {
	var banner models.Banner
	if err := ctx.ShouldBindJSON(&banner); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := c.service.CreateBanner(ctx.Request.Context(), &banner); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusCreated, banner)
}

func (c *AdminController) UpdateBanner(ctx *gin.Context) {
	idStr := ctx.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid banner ID"})
		return
	}

	var req models.Banner
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	banner, err := c.service.GetBannerByID(ctx.Request.Context(), id)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "banner not found"})
		return
	}

	banner.Title = req.Title
	banner.ImageURL = req.ImageURL
	banner.LinkURL = req.LinkURL
	banner.Position = req.Position
	banner.SortOrder = req.SortOrder
	banner.IsActive = req.IsActive

	if err := c.service.UpdateBanner(ctx.Request.Context(), banner); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, banner)
}

func (c *AdminController) GetBanners(ctx *gin.Context) {
	position := ctx.Query("position")
	banners, err := c.service.GetBanners(ctx.Request.Context(), position)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"data": banners})
}
