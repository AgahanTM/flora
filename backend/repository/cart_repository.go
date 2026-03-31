package repository

import (
	"context"
	"errors"

	"gifts-api/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

var (
	ErrCartNotFound = errors.New("cart not found")
)

// CartRepository defines methods for cart data operations
type CartRepository interface {
	GetByUserID(ctx context.Context, userID uuid.UUID) (*models.Cart, error)
	CreateForUser(ctx context.Context, userID uuid.UUID) (*models.Cart, error)
	AddItem(ctx context.Context, cartID, productID uuid.UUID, variantID *uuid.UUID, quantity int) error
	UpdateItemQuantity(ctx context.Context, cartID, productID uuid.UUID, variantID *uuid.UUID, quantity int) error
	RemoveItem(ctx context.Context, cartID, productID uuid.UUID, variantID *uuid.UUID) error
	ClearCart(ctx context.Context, cartID uuid.UUID) error
	ApplyPromo(ctx context.Context, cartID uuid.UUID, promoCodeID uuid.UUID) error
	RemovePromo(ctx context.Context, cartID uuid.UUID) error
}

type cartRepository struct {
	db *gorm.DB
}

// NewCartRepository creates a new cart repository
func NewCartRepository(db *gorm.DB) CartRepository {
	return &cartRepository{db: db}
}

func (r *cartRepository) GetByUserID(ctx context.Context, userID uuid.UUID) (*models.Cart, error) {
	var cart models.Cart
	err := r.db.WithContext(ctx).
		Preload("Items.Product").
		Preload("Items.Variant").
		Preload("PromoCode").
		First(&cart, "user_id = ?", userID).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrCartNotFound
		}
		return nil, err
	}
	return &cart, nil
}

func (r *cartRepository) CreateForUser(ctx context.Context, userID uuid.UUID) (*models.Cart, error) {
	cart := &models.Cart{
		UserID: &userID,
	}
	err := r.db.WithContext(ctx).Create(cart).Error
	return cart, err
}

func (r *cartRepository) AddItem(ctx context.Context, cartID, productID uuid.UUID, variantID *uuid.UUID, quantity int) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var existing models.CartItem
		query := tx.Where("cart_id = ? AND product_id = ?", cartID, productID)
		if variantID != nil {
			query = query.Where("variant_id = ?", *variantID)
		} else {
			query = query.Where("variant_id IS NULL")
		}
		err := query.First(&existing).Error

		if err == nil {
			// Item exists, update quantity
			existing.Quantity += quantity
			return tx.Save(&existing).Error
		}

		if errors.Is(err, gorm.ErrRecordNotFound) {
			// Create new
			newItem := models.CartItem{
				CartID:    cartID,
				ProductID: productID,
				VariantID: variantID,
				Quantity:  quantity,
			}
			return tx.Create(&newItem).Error
		}

		return err
	})
}

func (r *cartRepository) UpdateItemQuantity(ctx context.Context, cartID, productID uuid.UUID, variantID *uuid.UUID, quantity int) error {
	query := r.db.WithContext(ctx).Model(&models.CartItem{}).Where("cart_id = ? AND product_id = ?", cartID, productID)
	if variantID != nil {
		query = query.Where("variant_id = ?", *variantID)
	} else {
		query = query.Where("variant_id IS NULL")
	}
	return query.Update("quantity", quantity).Error
}

func (r *cartRepository) RemoveItem(ctx context.Context, cartID, productID uuid.UUID, variantID *uuid.UUID) error {
	query := r.db.WithContext(ctx).Where("cart_id = ? AND product_id = ?", cartID, productID)
	if variantID != nil {
		query = query.Where("variant_id = ?", *variantID)
	} else {
		query = query.Where("variant_id IS NULL")
	}
	return query.Delete(&models.CartItem{}).Error
}

func (r *cartRepository) ClearCart(ctx context.Context, cartID uuid.UUID) error {
	return r.db.WithContext(ctx).Where("cart_id = ?", cartID).Delete(&models.CartItem{}).Error
}

func (r *cartRepository) ApplyPromo(ctx context.Context, cartID uuid.UUID, promoCodeID uuid.UUID) error {
	return r.db.WithContext(ctx).Model(&models.Cart{}).Where("id = ?", cartID).Update("promo_code_id", promoCodeID).Error
}

func (r *cartRepository) RemovePromo(ctx context.Context, cartID uuid.UUID) error {
	return r.db.WithContext(ctx).Model(&models.Cart{}).Where("id = ?", cartID).Update("promo_code_id", nil).Error
}
