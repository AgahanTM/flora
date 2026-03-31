package repository

import (
	"context"
	"errors"

	"gifts-api/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

var ErrOrderNotFound = errors.New("order not found")

type OrderRepository interface {
	// Orders
	CreateOrder(ctx context.Context, order *models.Order) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.Order, error)
	GetByCustomerID(ctx context.Context, customerID uuid.UUID, offset, limit int) ([]models.Order, int64, error)
	GetBySellerID(ctx context.Context, sellerID uuid.UUID, status string, offset, limit int) ([]models.Order, int64, error)
	UpdateOrder(ctx context.Context, order *models.Order) error
	UpdateOrderStatus(ctx context.Context, orderID uuid.UUID, status string, updatedBy *uuid.UUID, note string) error

	// Status History
	AddStatusHistory(ctx context.Context, history *models.OrderStatusHistory) error
	GetStatusHistory(ctx context.Context, orderID uuid.UUID) ([]models.OrderStatusHistory, error)

	// Messages
	AddOrderMessage(ctx context.Context, message *models.OrderMessage) error
	GetOrderMessages(ctx context.Context, orderID uuid.UUID) ([]models.OrderMessage, error)

	// DB Access for Tx
	GetDB() *gorm.DB
}

type orderRepository struct {
	db *gorm.DB
}

func NewOrderRepository(db *gorm.DB) OrderRepository {
	return &orderRepository{db: db}
}

func (r *orderRepository) GetDB() *gorm.DB {
	return r.db
}

func (r *orderRepository) CreateOrder(ctx context.Context, order *models.Order) error {
	return r.db.WithContext(ctx).Create(order).Error
}

func (r *orderRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Order, error) {
	var order models.Order
	err := r.db.WithContext(ctx).
		Preload("Customer").
		Preload("Seller").
		Preload("DeliveryAddress").
		Preload("TimeSlot").
		Preload("Promotion").
		Preload("Items.Product").
		Preload("Items.Variant").
		Preload("Items.PersonalizationJob.Type").
		Preload("Items.PersonalizationJob.Template").
		Preload("StatusHistory").
		Preload("Messages").
		First(&order, "id = ?", id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrOrderNotFound
	}
	return &order, err
}

func (r *orderRepository) GetByCustomerID(ctx context.Context, customerID uuid.UUID, offset, limit int) ([]models.Order, int64, error) {
	var orders []models.Order
	var total int64
	q := r.db.WithContext(ctx).Model(&models.Order{}).Where("customer_id = ?", customerID)
	q.Count(&total)
	err := q.Preload("Items.Product").Preload("Seller").
		Order("created_at DESC").Offset(offset).Limit(limit).Find(&orders).Error
	return orders, total, err
}

func (r *orderRepository) GetBySellerID(ctx context.Context, sellerID uuid.UUID, status string, offset, limit int) ([]models.Order, int64, error) {
	var orders []models.Order
	var total int64
	q := r.db.WithContext(ctx).Model(&models.Order{}).Where("seller_id = ?", sellerID)
	if status != "" {
		q = q.Where("status = ?", status)
	}
	q.Count(&total)
	err := q.Preload("Items.Product").Preload("Customer").
		Order("created_at DESC").Offset(offset).Limit(limit).Find(&orders).Error
	return orders, total, err
}

func (r *orderRepository) UpdateOrder(ctx context.Context, order *models.Order) error {
	return r.db.WithContext(ctx).Save(order).Error
}

func (r *orderRepository) UpdateOrderStatus(ctx context.Context, orderID uuid.UUID, status string, updatedBy *uuid.UUID, note string) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var order models.Order
		if err := tx.First(&order, "id = ?", orderID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrOrderNotFound
			}
			return err
		}

		oldStatus := order.Status
		if oldStatus == status {
			return nil
		}

		if err := tx.Model(&order).Update("status", status).Error; err != nil {
			return err
		}

		// Insert history
		history := models.OrderStatusHistory{
			OrderID:   orderID,
			FromStatus: &oldStatus,
			ToStatus:  status,
			ChangedBy: updatedBy,
			Note:      note,
		}
		return tx.Create(&history).Error
	})
}

// --- Status History ---

func (r *orderRepository) AddStatusHistory(ctx context.Context, history *models.OrderStatusHistory) error {
	return r.db.WithContext(ctx).Create(history).Error
}

func (r *orderRepository) GetStatusHistory(ctx context.Context, orderID uuid.UUID) ([]models.OrderStatusHistory, error) {
	var history []models.OrderStatusHistory
	err := r.db.WithContext(ctx).Where("order_id = ?", orderID).Order("created_at DESC").Find(&history).Error
	return history, err
}

// --- Messages ---

func (r *orderRepository) AddOrderMessage(ctx context.Context, message *models.OrderMessage) error {
	return r.db.WithContext(ctx).Create(message).Error
}

func (r *orderRepository) GetOrderMessages(ctx context.Context, orderID uuid.UUID) ([]models.OrderMessage, error) {
	var messages []models.OrderMessage
	err := r.db.WithContext(ctx).Where("order_id = ?", orderID).Order("created_at ASC").Find(&messages).Error
	return messages, err
}
