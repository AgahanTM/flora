package controllers

import (
	"net/http"
	"strconv"

	"gifts-api/models"
	"gifts-api/services"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type OrderController struct {
	orderService services.OrderService
	sellerService services.SellerService
}

func NewOrderController(orderService services.OrderService, sellerService services.SellerService) *OrderController {
	return &OrderController{
		orderService: orderService,
		sellerService: sellerService,
	}
}

func (c *OrderController) PlaceOrder(ctx *gin.Context) {
	userIDStr, _ := ctx.Get("user_id")
	userID, _ := uuid.Parse(userIDStr.(string))

	var order models.Order
	if err := ctx.ShouldBindJSON(&order); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	order.CustomerID = userID

	placedOrder, err := c.orderService.PlaceOrder(ctx.Request.Context(), &order)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, placedOrder)
}

func (c *OrderController) GetOrder(ctx *gin.Context) {
	id, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid order id"})
		return
	}

	order, err := c.orderService.GetOrder(ctx.Request.Context(), id)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "order not found"})
		return
	}

	// Basic authorization check: customer, seller, or admin
	userIDStr, _ := ctx.Get("user_id")
	userID, _ := uuid.Parse(userIDStr.(string))
	role, _ := ctx.Get("role")

	if role == "seller" {
		seller, _ := c.sellerService.GetSellerByUserID(ctx.Request.Context(), userID)
		if seller != nil && order.SellerID == seller.ID {
			// Authorized as seller
		} else if role != "admin" && order.CustomerID != userID {
			ctx.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}
	} else if role != "admin" && order.CustomerID != userID {
		ctx.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	ctx.JSON(http.StatusOK, order)
}

func (c *OrderController) UpdateStatus(ctx *gin.Context) {
	orderID, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid order id"})
		return
	}

	var req struct {
		Status string `json:"status" binding:"required"`
		Note   string `json:"note"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userIDStr, _ := ctx.Get("user_id")
	userID, _ := uuid.Parse(userIDStr.(string))
	role, _ := ctx.Get("role")

	var updateErr error
	if role == "admin" {
		updateErr = c.orderService.AdminUpdateStatus(ctx.Request.Context(), orderID, userID, req.Status, req.Note)
	} else if role == "seller" {
		seller, err := c.sellerService.GetSellerByUserID(ctx.Request.Context(), userID)
		if err != nil {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "seller not found"})
			return
		}
		updateErr = c.orderService.SellerUpdateStatus(ctx.Request.Context(), orderID, seller.ID, req.Status, req.Note)
	} else if role == "courier" {
		updateErr = c.orderService.CourierUpdateStatus(ctx.Request.Context(), orderID, userID, req.Status, req.Note)
	} else if req.Status == "cancelled" {
		updateErr = c.orderService.CustomerCancelOrder(ctx.Request.Context(), orderID, userID)
	} else {
		ctx.JSON(http.StatusForbidden, gin.H{"error": "role not allowed to update status"})
		return
	}

	if updateErr != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": updateErr.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "order status updated"})
}

func (c *OrderController) GetCustomerOrders(ctx *gin.Context) {
	userIDStr, _ := ctx.Get("user_id")
	userID, _ := uuid.Parse(userIDStr.(string))

	limit, _ := strconv.Atoi(ctx.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(ctx.DefaultQuery("offset", "0"))

	orders, total, err := c.orderService.GetCustomerOrders(ctx.Request.Context(), userID, offset, limit)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": orders, "total": total})
}

func (c *OrderController) GetSellerOrders(ctx *gin.Context) {
	userIDStr, _ := ctx.Get("user_id")
	userID, _ := uuid.Parse(userIDStr.(string))

	// Resolve sellerID from userID
	seller, err := c.sellerService.GetSellerByUserID(ctx.Request.Context(), userID)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "seller not found"})
		return
	}

	status := ctx.DefaultQuery("status", "")
	limit, _ := strconv.Atoi(ctx.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(ctx.DefaultQuery("offset", "0"))

	orders, total, err := c.orderService.GetSellerOrders(ctx.Request.Context(), seller.ID, status, offset, limit)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": orders, "total": total})
}

func (c *OrderController) GetAllOrders(ctx *gin.Context) {
	status := ctx.DefaultQuery("status", "")
	limit, _ := strconv.Atoi(ctx.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(ctx.DefaultQuery("offset", "0"))

	orders, total, err := c.orderService.GetAllOrders(ctx.Request.Context(), status, offset, limit)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": orders, "total": total})
}

