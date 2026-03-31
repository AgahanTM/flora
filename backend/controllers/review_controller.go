package controllers

import (
	"net/http"

	"gifts-api/models"
	"gifts-api/services"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ReviewController struct {
	service services.ReviewService
}

func NewReviewController(service services.ReviewService) *ReviewController {
	return &ReviewController{service: service}
}

func (c *ReviewController) CreateReview(ctx *gin.Context) {
	var review models.Review
	if err := ctx.ShouldBindJSON(&review); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userIDStr, _ := ctx.Get("user_id")
	userID, _ := uuid.Parse(userIDStr.(string))
	review.CustomerID = userID

	if err := c.service.CreateReview(ctx.Request.Context(), &review); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, review)
}

func (c *ReviewController) RespondToReview(ctx *gin.Context) {
	reviewID, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid review ID"})
		return
	}

	var req struct {
		Response string `json:"response" binding:"required"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	sellerIDStr, _ := ctx.Get("user_id")
	sellerID, _ := uuid.Parse(sellerIDStr.(string))

	resp := &models.ReviewResponse{
		ReviewID:     reviewID,
		SellerID:     sellerID,
		ResponseText: req.Response,
	}

	if err := c.service.RespondToReview(ctx.Request.Context(), resp); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "response added"})
}

func (c *ReviewController) GetSellerReviews(ctx *gin.Context) {
	sellerIDStr, _ := ctx.Get("user_id")
	sellerID, _ := uuid.Parse(sellerIDStr.(string))

	offset := 0
	limit := 50

	reviews, total, err := c.service.GetSellerReviews(ctx.Request.Context(), sellerID, offset, limit)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": reviews, "total": total})
}

func (c *ReviewController) ReportIssue(ctx *gin.Context) {
	var req models.IssueReport
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userIDStr, _ := ctx.Get("user_id")
	userID, _ := uuid.Parse(userIDStr.(string))
	req.ReporterID = userID

	if err := c.service.ReportIssue(ctx.Request.Context(), &req); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, req)
}

func (c *ReviewController) GetIssueReports(ctx *gin.Context) {
	status := ctx.Query("status")
	reports, total, err := c.service.GetIssueReports(ctx.Request.Context(), status, 50, 0)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"data": reports, "total": total})
}

func (c *ReviewController) UpdateIssueStatus(ctx *gin.Context) {
	reportID, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid report ID"})
		return
	}

	var req struct {
		Status string `json:"status" binding:"required"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := c.service.UpdateIssueStatus(ctx.Request.Context(), reportID, req.Status); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "issue status updated"})
}

func (c *ReviewController) GetProductReviews(ctx *gin.Context) {
	productID, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid product id"})
		return
	}

	limit := 50
	offset := 0

	reviews, total, err := c.service.GetProductReviews(ctx.Request.Context(), productID, offset, limit)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": reviews, "total": total})
}

type UpdateReviewRequest struct {
	Rating  int    `json:"rating" binding:"required,min=1,max=5"`
	Comment string `json:"comment"`
}

func (c *ReviewController) UpdateReview(ctx *gin.Context) {
	reviewID, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid review ID"})
		return
	}

	userIDStr, _ := ctx.Get("user_id")
	userID, _ := uuid.Parse(userIDStr.(string))

	var req UpdateReviewRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := c.service.UpdateReview(ctx.Request.Context(), reviewID, userID, req.Rating, req.Comment); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "review updated"})
}

func (c *ReviewController) DeleteReview(ctx *gin.Context) {
	reviewID, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid review ID"})
		return
	}

	userIDStr, _ := ctx.Get("user_id")
	userID, _ := uuid.Parse(userIDStr.(string))

	if err := c.service.DeleteReview(ctx.Request.Context(), reviewID, userID); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "review deleted"})
}
