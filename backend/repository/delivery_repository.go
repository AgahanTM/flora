package repository

import (
	"context"
	"errors"

	"gifts-api/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

var ErrDeliveryZoneNotFound = errors.New("delivery zone not found")
var ErrCourierNotFound = errors.New("courier not found")
var ErrDeliveryNotFound = errors.New("delivery not found")

type DeliveryRepository interface {
	// Zones
	CreateZone(ctx context.Context, zone *models.DeliveryZone) error
	GetZoneByID(ctx context.Context, id uuid.UUID) (*models.DeliveryZone, error)
	GetAllZones(ctx context.Context) ([]models.DeliveryZone, error)
	UpdateZone(ctx context.Context, zone *models.DeliveryZone) error
	DeleteZone(ctx context.Context, id uuid.UUID) error

	// Time Slots
	CreateTimeSlot(ctx context.Context, slot *models.DeliveryTimeSlot) error
	GetTimeSlots(ctx context.Context, sellerID *uuid.UUID, date string) ([]models.DeliveryTimeSlot, error)
	GetTimeSlotByID(ctx context.Context, id uuid.UUID) (*models.DeliveryTimeSlot, error)
	IncrementBookedOrders(ctx context.Context, id uuid.UUID) error

	// Couriers
	CreateCourier(ctx context.Context, courier *models.Courier) error
	GetCourierByID(ctx context.Context, id uuid.UUID) (*models.Courier, error)
	GetCourierByUserID(ctx context.Context, userID uuid.UUID) (*models.Courier, error)
	UpdateCourier(ctx context.Context, courier *models.Courier) error
	UpdateCourierLocation(ctx context.Context, id uuid.UUID, lat, lng float64) error

	// Deliveries
	CreateDelivery(ctx context.Context, delivery *models.Delivery) error
	GetDeliveryByID(ctx context.Context, id uuid.UUID) (*models.Delivery, error)
	GetDeliveryByOrderID(ctx context.Context, orderID uuid.UUID) (*models.Delivery, error)
	GetDeliveriesByCourierID(ctx context.Context, courierID uuid.UUID, status string) ([]models.Delivery, error)
	GetUnassignedDeliveries(ctx context.Context, zoneID *uuid.UUID) ([]models.Delivery, error)
	UpdateDelivery(ctx context.Context, delivery *models.Delivery) error

	// Delivery SLAs & Breaches
	GetSLAsByZone(ctx context.Context, zoneID uuid.UUID) ([]models.DeliverySLA, error)
	RecordBreach(ctx context.Context, breach *models.DeliveryBreach) error
}

type deliveryRepository struct {
	db *gorm.DB
}

func NewDeliveryRepository(db *gorm.DB) DeliveryRepository {
	return &deliveryRepository{db: db}
}

// --- Zones ---

func (r *deliveryRepository) CreateZone(ctx context.Context, zone *models.DeliveryZone) error {
	return r.db.WithContext(ctx).Create(zone).Error
}

func (r *deliveryRepository) GetZoneByID(ctx context.Context, id uuid.UUID) (*models.DeliveryZone, error) {
	var zone models.DeliveryZone
	err := r.db.WithContext(ctx).First(&zone, "id = ?", id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrDeliveryZoneNotFound
	}
	return &zone, err
}

func (r *deliveryRepository) GetAllZones(ctx context.Context) ([]models.DeliveryZone, error) {
	var zones []models.DeliveryZone
	err := r.db.WithContext(ctx).Where("is_active = ?", true).Find(&zones).Error
	return zones, err
}

func (r *deliveryRepository) UpdateZone(ctx context.Context, zone *models.DeliveryZone) error {
	return r.db.WithContext(ctx).Save(zone).Error
}

func (r *deliveryRepository) DeleteZone(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&models.DeliveryZone{}, "id = ?", id).Error
}

// --- Time Slots ---

func (r *deliveryRepository) CreateTimeSlot(ctx context.Context, slot *models.DeliveryTimeSlot) error {
	return r.db.WithContext(ctx).Create(slot).Error
}

func (r *deliveryRepository) GetTimeSlots(ctx context.Context, sellerID *uuid.UUID, date string) ([]models.DeliveryTimeSlot, error) {
	var slots []models.DeliveryTimeSlot
	q := r.db.WithContext(ctx).Where("slot_date = ? AND is_blocked = ?", date, false)
	if sellerID != nil {
		q = q.Where("seller_id = ? OR seller_id IS NULL", *sellerID)
	} else {
		q = q.Where("seller_id IS NULL")
	}
	err := q.Order("start_time").Find(&slots).Error
	return slots, err
}

func (r *deliveryRepository) GetTimeSlotByID(ctx context.Context, id uuid.UUID) (*models.DeliveryTimeSlot, error) {
	var slot models.DeliveryTimeSlot
	err := r.db.WithContext(ctx).First(&slot, "id = ?", id).Error
	return &slot, err
}

func (r *deliveryRepository) IncrementBookedOrders(ctx context.Context, id uuid.UUID) error {
	// Optimistic: only increment if booked_orders < max_orders
	res := r.db.WithContext(ctx).Model(&models.DeliveryTimeSlot{}).
		Where("id = ? AND booked_orders < max_orders", id).
		Update("booked_orders", gorm.Expr("booked_orders + 1"))
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return errors.New("time slot is full")
	}
	return nil
}

// --- Couriers ---

func (r *deliveryRepository) CreateCourier(ctx context.Context, courier *models.Courier) error {
	return r.db.WithContext(ctx).Create(courier).Error
}

func (r *deliveryRepository) GetCourierByID(ctx context.Context, id uuid.UUID) (*models.Courier, error) {
	var courier models.Courier
	err := r.db.WithContext(ctx).Preload("User").First(&courier, "id = ?", id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrCourierNotFound
	}
	return &courier, err
}

func (r *deliveryRepository) GetCourierByUserID(ctx context.Context, userID uuid.UUID) (*models.Courier, error) {
	var courier models.Courier
	err := r.db.WithContext(ctx).Where("user_id = ?", userID).First(&courier).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrCourierNotFound
	}
	return &courier, err
}

func (r *deliveryRepository) UpdateCourier(ctx context.Context, courier *models.Courier) error {
	return r.db.WithContext(ctx).Save(courier).Error
}

func (r *deliveryRepository) UpdateCourierLocation(ctx context.Context, id uuid.UUID, lat, lng float64) error {
	return r.db.WithContext(ctx).Model(&models.Courier{}).Where("id = ?", id).
		Updates(map[string]interface{}{
			"current_lat":  lat,
			"current_lng":  lng,
			"last_seen_at": gorm.Expr("CURRENT_TIMESTAMP"),
		}).Error
}

// --- Deliveries ---

func (r *deliveryRepository) CreateDelivery(ctx context.Context, delivery *models.Delivery) error {
	return r.db.WithContext(ctx).Create(delivery).Error
}

func (r *deliveryRepository) GetDeliveryByID(ctx context.Context, id uuid.UUID) (*models.Delivery, error) {
	var delivery models.Delivery
	err := r.db.WithContext(ctx).Preload("Order").Preload("Courier").Preload("Zone").First(&delivery, "id = ?", id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrDeliveryNotFound
	}
	return &delivery, err
}

func (r *deliveryRepository) GetDeliveryByOrderID(ctx context.Context, orderID uuid.UUID) (*models.Delivery, error) {
	var delivery models.Delivery
	err := r.db.WithContext(ctx).Preload("Courier").Where("order_id = ?", orderID).First(&delivery).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrDeliveryNotFound
	}
	return &delivery, err
}

func (r *deliveryRepository) GetDeliveriesByCourierID(ctx context.Context, courierID uuid.UUID, status string) ([]models.Delivery, error) {
	var deliveries []models.Delivery
	q := r.db.WithContext(ctx).Where("courier_id = ?", courierID)
	if status != "" {
		q = q.Where("status = ?", status)
	}
	err := q.Preload("Order").Order("created_at DESC").Find(&deliveries).Error
	return deliveries, err
}

func (r *deliveryRepository) GetUnassignedDeliveries(ctx context.Context, zoneID *uuid.UUID) ([]models.Delivery, error) {
	var deliveries []models.Delivery
	q := r.db.WithContext(ctx).Where("status = ?", "unassigned")
	if zoneID != nil {
		q = q.Where("zone_id = ?", *zoneID)
	}
	err := q.Preload("Order").Order("created_at ASC").Find(&deliveries).Error
	return deliveries, err
}

func (r *deliveryRepository) UpdateDelivery(ctx context.Context, delivery *models.Delivery) error {
	return r.db.WithContext(ctx).Save(delivery).Error
}

// --- SLAs & Breaches ---

func (r *deliveryRepository) GetSLAsByZone(ctx context.Context, zoneID uuid.UUID) ([]models.DeliverySLA, error) {
	var slas []models.DeliverySLA
	err := r.db.WithContext(ctx).Where("zone_id = ? AND is_active = ?", zoneID, true).Find(&slas).Error
	return slas, err
}

func (r *deliveryRepository) RecordBreach(ctx context.Context, breach *models.DeliveryBreach) error {
	return r.db.WithContext(ctx).Create(breach).Error
}
