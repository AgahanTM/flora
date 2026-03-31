package services

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	"gifts-api/models"
	"gifts-api/repository"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

var (
	ErrInvalidTransition = errors.New("invalid order status transition")
	ErrCancelWindowOver  = errors.New("cancel window has expired")
	ErrInventoryShortage = errors.New("insufficient inventory for one or more items")
)

type OrderService interface {
	PlaceOrder(ctx context.Context, order *models.Order) (*models.Order, error)
	GetOrder(ctx context.Context, id uuid.UUID) (*models.Order, error)
	CustomerCancelOrder(ctx context.Context, orderID uuid.UUID, customerID uuid.UUID) error
	
	// State Machine
	AdminUpdateStatus(ctx context.Context, orderID uuid.UUID, adminID uuid.UUID, newStatus, note string) error
	SellerUpdateStatus(ctx context.Context, orderID uuid.UUID, sellerID uuid.UUID, newStatus, note string) error
	CourierUpdateStatus(ctx context.Context, orderID uuid.UUID, courierID uuid.UUID, newStatus, note string) error

	// Messages
	AddMessage(ctx context.Context, message *models.OrderMessage) error
	GetMessages(ctx context.Context, orderID uuid.UUID) ([]models.OrderMessage, error)

	// List queries
	GetCustomerOrders(ctx context.Context, customerID uuid.UUID, offset, limit int) ([]models.Order, int64, error)
	GetSellerOrders(ctx context.Context, sellerID uuid.UUID, status string, offset, limit int) ([]models.Order, int64, error)
	GetAllOrders(ctx context.Context, status string, offset, limit int) ([]models.Order, int64, error)
}

type orderService struct {
	orderRepo   repository.OrderRepository
	productRepo repository.ProductRepository // Needed for inventory reservation tx
}

func NewOrderService(orderRepo repository.OrderRepository, productRepo repository.ProductRepository) OrderService {
	return &orderService{
		orderRepo:   orderRepo,
		productRepo: productRepo,
	}
}

func (s *orderService) PlaceOrder(ctx context.Context, order *models.Order) (*models.Order, error) {
	order.Status = "pending"
	
	// Transaction to reserve inventory and save the order
	db := s.orderRepo.GetDB().WithContext(ctx)
	err := db.Transaction(func(tx *gorm.DB) error {
		// Calculate totals and take product snapshots, reserve stock
		var subtotal float64
		for i := range order.Items {
			item := &order.Items[i]
			
			// Snapshot logic
			p, err := s.productRepo.GetByID(ctx, item.ProductID)
			if err != nil {
				return err
			}
			
			// Reserve inventory
			res := tx.Model(&models.Inventory{}).
				Where("product_id = ? AND quantity_total - quantity_reserved >= ?", item.ProductID, item.Quantity)
			if item.VariantID != nil {
				res = res.Where("variant_id = ?", item.VariantID)
			} else {
				res = res.Where("variant_id IS NULL")
			}
			
			updateRes := res.Update("quantity_reserved", gorm.Expr("quantity_reserved + ?", item.Quantity))
			if updateRes.Error != nil {
				return updateRes.Error
			}
			if updateRes.RowsAffected == 0 {
				return ErrInventoryShortage
			}

			// Calculate unit price: base + variant modifier
			unitPrice := p.BasePrice
			if item.VariantID != nil {
				variant, vErr := s.productRepo.GetVariantByID(ctx, *item.VariantID)
				if vErr == nil {
					unitPrice += variant.PriceModifier
				}
			}

			// Add addon prices from the JSONB addons field
			if item.Addons != nil && *item.Addons != "" {
				var addonEntries []struct {
					AddonID  string `json:"addon_id"`
					Quantity int    `json:"quantity"`
				}
				if jsonErr := json.Unmarshal([]byte(*item.Addons), &addonEntries); jsonErr == nil {
					for _, ae := range addonEntries {
						addonID, parseErr := uuid.Parse(ae.AddonID)
						if parseErr != nil {
							continue
						}
						// Look up addon by scanning all addons on the product
						for _, addon := range p.Addons {
							if addon.ID == addonID {
								qty := ae.Quantity
								if qty <= 0 {
									qty = 1
								}
								unitPrice += addon.Price * float64(qty)
								break
							}
						}
					}
				}
			}

			item.UnitPrice = unitPrice
			item.LineTotal = float64(item.Quantity) * item.UnitPrice + item.PersonalizationPrice
			item.ProductSnapshot = nil

			subtotal += item.LineTotal
		}

		
		order.Subtotal = subtotal
		order.TotalPrice = order.Subtotal + order.DeliveryFee - order.DiscountAmount
		
		if err := tx.Create(order).Error; err != nil {
			return err
		}
		
		// Initial history
		history := models.OrderStatusHistory{
			OrderID:  order.ID,
			ToStatus: "pending",
			Note:     "Order placed by customer",
		}
		return tx.Create(&history).Error
	})
	
	if err != nil {
		return nil, err
	}
	
	return s.GetOrder(ctx, order.ID)
}

func (s *orderService) GetOrder(ctx context.Context, id uuid.UUID) (*models.Order, error) {
	return s.orderRepo.GetByID(ctx, id)
}

// State Machine transitions:
// pending -> confirmed (seller/admin)
// pending -> cancelled (customer <30m / admin)
// confirmed -> preparing (seller)
// confirmed -> cancelled (admin)
// preparing -> out_for_delivery (courier / admin)
// out_for_delivery -> delivered (courier / admin)
// out_for_delivery -> failed (courier / admin)
// failed -> out_for_delivery (admin)
// delivered -> refunded (admin)

func isValidTransition(from, to string) bool {
	valid := map[string][]string{
		"pending":          {"confirmed", "cancelled"},
		"confirmed":        {"preparing", "cancelled"},
		"preparing":        {"out_for_delivery"},
		"out_for_delivery": {"delivered", "failed"},
		"failed":           {"out_for_delivery", "cancelled"},
		"delivered":        {"refunded"},
	}
	
	allowed, ok := valid[from]
	if !ok {
		return false
	}
	for _, a := range allowed {
		if a == to {
			return true
		}
	}
	return false
}

func (s *orderService) internalUpdateStatus(ctx context.Context, orderID uuid.UUID, fromStatus []string, toStatus string, updatedBy *uuid.UUID, role, note string) error {
	order, err := s.orderRepo.GetByID(ctx, orderID)
	if err != nil {
		return err
	}
	
	// Ensure current status matches one of the expected fromStatus
	match := false
	for _, fs := range fromStatus {
		if order.Status == fs {
			match = true
			break
		}
	}
	if !match {
		return ErrInvalidTransition
	}
	
	if !isValidTransition(order.Status, toStatus) {
		return ErrInvalidTransition
	}
	
	// Perform status update and handle consequences (e.g. releasing inventory if cancelled)
	return s.orderRepo.GetDB().WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		old := order.Status
		if err := tx.Model(order).Update("status", toStatus).Error; err != nil {
			return err
		}
		
		history := models.OrderStatusHistory{
			OrderID:   order.ID,
			FromStatus: &old,
			ToStatus:  toStatus,
			ChangedBy: updatedBy,
			Note:      note,
		}
		if err := tx.Create(&history).Error; err != nil {
			return err
		}
		
		// If cancelled, release inventory reservations
		if toStatus == "cancelled" {
			for _, item := range order.Items {
				releaseQuery := tx.Model(&models.Inventory{}).
					Where("product_id = ?", item.ProductID)
				if item.VariantID != nil {
					releaseQuery = releaseQuery.Where("variant_id = ?", item.VariantID)
				} else {
					releaseQuery = releaseQuery.Where("variant_id IS NULL")
				}
				releaseQuery.Update("quantity_reserved", gorm.Expr("quantity_reserved - ?", item.Quantity))
			}
		}

		// (Add logic to update Personalization Job status if moving to `preparing` or `cancelled`)
		
		return nil
	})
}

func (s *orderService) CustomerCancelOrder(ctx context.Context, orderID uuid.UUID, customerID uuid.UUID) error {
	order, err := s.orderRepo.GetByID(ctx, orderID)
	if err != nil {
		return err
	}
	if order.CustomerID != customerID {
		return errors.New("unauthorized")
	}
	if order.Status != "pending" {
		return errors.New("cannot cancel order after confirmation")
	}
	if time.Since(order.CreatedAt) > 30*time.Minute {
		return ErrCancelWindowOver
	}
	
	return s.internalUpdateStatus(ctx, orderID, []string{"pending"}, "cancelled", &customerID, "customer", "Cancelled by customer within 30 min window")
}

func (s *orderService) AdminUpdateStatus(ctx context.Context, orderID uuid.UUID, adminID uuid.UUID, newStatus, note string) error {
	order, err := s.orderRepo.GetByID(ctx, orderID)
	if err != nil {
		return err
	}
	return s.internalUpdateStatus(ctx, orderID, []string{order.Status}, newStatus, &adminID, "admin", note)
}

func (s *orderService) SellerUpdateStatus(ctx context.Context, orderID uuid.UUID, sellerID uuid.UUID, newStatus, note string) error {
	order, err := s.orderRepo.GetByID(ctx, orderID)
	if err != nil {
		return err
	}
	if order.SellerID != sellerID {
		return errors.New("unauthorized: order belongs to another seller")
	}
	
	// Sellers can transition pending -> confirmed, confirmed -> preparing
	if newStatus == "confirmed" {
		return s.internalUpdateStatus(ctx, orderID, []string{"pending"}, newStatus, &sellerID, "seller", note)
	} else if newStatus == "preparing" {
		return s.internalUpdateStatus(ctx, orderID, []string{"confirmed"}, newStatus, &sellerID, "seller", note)
	}
	
	return errors.New("seller not allowed to perform this status transition")
}

func (s *orderService) CourierUpdateStatus(ctx context.Context, orderID uuid.UUID, courierID uuid.UUID, newStatus, note string) error {
	// (Should ideally check if delivery is assigned to this courier)
	// Couriers can transition preparing -> out_for_delivery -> delivered/failed
	if newStatus == "out_for_delivery" {
		return s.internalUpdateStatus(ctx, orderID, []string{"preparing", "failed"}, newStatus, &courierID, "courier", note)
	} else if newStatus == "delivered" || newStatus == "failed" {
		return s.internalUpdateStatus(ctx, orderID, []string{"out_for_delivery"}, newStatus, &courierID, "courier", note)
	}
	return errors.New("courier not allowed to perform this status transition")
}

func (s *orderService) AddMessage(ctx context.Context, message *models.OrderMessage) error {
	return s.orderRepo.AddOrderMessage(ctx, message)
}

func (s *orderService) GetMessages(ctx context.Context, orderID uuid.UUID) ([]models.OrderMessage, error) {
	return s.orderRepo.GetOrderMessages(ctx, orderID)
}

func (s *orderService) GetCustomerOrders(ctx context.Context, customerID uuid.UUID, offset, limit int) ([]models.Order, int64, error) {
	return s.orderRepo.GetByCustomerID(ctx, customerID, offset, limit)
}

func (s *orderService) GetSellerOrders(ctx context.Context, sellerID uuid.UUID, status string, offset, limit int) ([]models.Order, int64, error) {
	return s.orderRepo.GetBySellerID(ctx, sellerID, status, offset, limit)
}

func (s *orderService) GetAllOrders(ctx context.Context, status string, offset, limit int) ([]models.Order, int64, error) {
	// For admin: Get all orders. We reuse GetBySellerID with uuid.Nil or add a direct repo call.
	// Since there's no GetAll in repo, we query with no seller filter.
	return s.orderRepo.GetBySellerID(ctx, uuid.Nil, status, offset, limit)
}
