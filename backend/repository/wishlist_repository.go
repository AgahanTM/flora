package repository

import (
	"context"
	"errors"

	"gifts-api/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

var (
	ErrWishlistItemNotFound = errors.New("wishlist item not found")
)

// WishlistRepository defines methods for wishlist operations
type WishlistRepository interface {
	Add(ctx context.Context, userID, productID uuid.UUID) error
	Remove(ctx context.Context, userID, productID uuid.UUID) error
	GetByUserID(ctx context.Context, userID uuid.UUID) ([]models.Wishlist, error)
	IsInWishlist(ctx context.Context, userID, productID uuid.UUID) (bool, error)
}

type wishlistRepository struct {
	db *gorm.DB
}

func NewWishlistRepository(db *gorm.DB) WishlistRepository {
	return &wishlistRepository{db: db}
}

func (r *wishlistRepository) Add(ctx context.Context, userID, productID uuid.UUID) error {
	item := models.Wishlist{UserID: userID, ProductID: productID}
	// Ignore duplicate inserts
	result := r.db.WithContext(ctx).Where("user_id = ? AND product_id = ?", userID, productID).FirstOrCreate(&item)
	return result.Error
}

func (r *wishlistRepository) Remove(ctx context.Context, userID, productID uuid.UUID) error {
	return r.db.WithContext(ctx).
		Where("user_id = ? AND product_id = ?", userID, productID).
		Delete(&models.Wishlist{}).Error
}

func (r *wishlistRepository) GetByUserID(ctx context.Context, userID uuid.UUID) ([]models.Wishlist, error) {
	var items []models.Wishlist
	err := r.db.WithContext(ctx).
		Preload("Product").
		Where("user_id = ?", userID).
		Order("created_at DESC").
		Find(&items).Error
	return items, err
}

func (r *wishlistRepository) IsInWishlist(ctx context.Context, userID, productID uuid.UUID) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&models.Wishlist{}).
		Where("user_id = ? AND product_id = ?", userID, productID).
		Count(&count).Error
	return count > 0, err
}
