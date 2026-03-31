package controllers

import (
	"net/http"

	"gifts-api/models"
	"gifts-api/services"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type DeliveryController struct {
	service services.DeliveryService
}

func NewDeliveryController(service services.DeliveryService) *DeliveryController {
	return &DeliveryController{service: service}
}

func (c *DeliveryController) CreateZone(ctx *gin.Context) {
	var zone models.DeliveryZone
	if err := ctx.ShouldBindJSON(&zone); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := c.service.CreateZone(ctx.Request.Context(), &zone); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusCreated, zone)
}

func (c *DeliveryController) GetZones(ctx *gin.Context) {
	zones, err := c.service.GetZones(ctx.Request.Context())
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, zones)
}

func (c *DeliveryController) GetAvailableSlots(ctx *gin.Context) {
	date := ctx.Query("date")
	
	var selIDPtr *uuid.UUID
	if selID := ctx.Query("seller_id"); selID != "" {
		id, err := uuid.Parse(selID)
		if err == nil {
			selIDPtr = &id
		}
	}

	slots, err := c.service.GetAvailableSlots(ctx.Request.Context(), selIDPtr, date)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, slots)
}

func (c *DeliveryController) UpdateCourierLocation(ctx *gin.Context) {
	courierIDStr, _ := ctx.Get("user_id") // Assuming courier's user_id = courier_id
	courierID, _ := uuid.Parse(courierIDStr.(string))

	var req struct {
		Lat float64 `json:"latitude" binding:"required"`
		Lng float64 `json:"longitude" binding:"required"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := c.service.UpdateLocation(ctx.Request.Context(), courierID, req.Lat, req.Lng); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "location updated"})
}

func (c *DeliveryController) CreateTimeSlot(ctx *gin.Context) {
	var slot models.DeliveryTimeSlot
	if err := ctx.ShouldBindJSON(&slot); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := c.service.CreateTimeSlot(ctx.Request.Context(), &slot); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusCreated, slot)
}

func (c *DeliveryController) CreateCourier(ctx *gin.Context) {
	var courier models.Courier
	if err := ctx.ShouldBindJSON(&courier); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := c.service.CreateCourier(ctx.Request.Context(), &courier); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusCreated, courier)
}

func (c *DeliveryController) ListCouriers(ctx *gin.Context) {
	// Let's assume there is a GetAllCouriers method in the service
	couriers, err := c.service.GetCouriers(ctx.Request.Context())
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"data": couriers})
}

func (c *DeliveryController) AssignDelivery(ctx *gin.Context) {
	deliveryID, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid delivery id"})
		return
	}

	var req struct {
		CourierID uuid.UUID `json:"courier_id" binding:"required"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := c.service.AssignDelivery(ctx.Request.Context(), deliveryID, req.CourierID); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "delivery assigned"})
}

func (c *DeliveryController) GetCourierDeliveries(ctx *gin.Context) {
	courierIDStr, _ := ctx.Get("user_id") // Assuming user_id maps to courier_id
	courierID, _ := uuid.Parse(courierIDStr.(string))
	status := ctx.Query("status")

	deliveries, err := c.service.GetDeliveriesByCourier(ctx.Request.Context(), courierID, status)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"data": deliveries})
}
