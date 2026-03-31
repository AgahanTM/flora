package repository

import (
	"context"
	"errors"
	"time"

	"gifts-api/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

var ErrPromotionNotFound = errors.New("promotion not found")

type PromotionRepository interface {
	Create(ctx context.Context, promo *models.Promotion) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.Promotion, error)
	GetByCode(ctx context.Context, code string) (*models.Promotion, error)
	Update(ctx context.Context, promo *models.Promotion) error
	GetAll(ctx context.Context, activeOnly bool) ([]models.Promotion, error)

	// Usages
	RecordUsage(ctx context.Context, usage *models.PromotionUsage) error
	GetUsageCountForUser(ctx context.Context, promoID uuid.UUID, userID uuid.UUID) (int64, error)
}

type promotionRepository struct {
	db *gorm.DB
}

func NewPromotionRepository(db *gorm.DB) PromotionRepository {
	return &promotionRepository{db: db}
}

func (r *promotionRepository) Create(ctx context.Context, promo *models.Promotion) error {
	return r.db.WithContext(ctx).Create(promo).Error
}

func (r *promotionRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Promotion, error) {
	var promo models.Promotion
	err := r.db.WithContext(ctx).Preload("Sellers").First(&promo, "id = ?", id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrPromotionNotFound
	}
	return &promo, err
}

func (r *promotionRepository) GetByCode(ctx context.Context, code string) (*models.Promotion, error) {
	var promo models.Promotion
	err := r.db.WithContext(ctx).Preload("Sellers").Where("code = ?", code).First(&promo).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrPromotionNotFound
	}
	return &promo, err
}

func (r *promotionRepository) Update(ctx context.Context, promo *models.Promotion) error {
	return r.db.WithContext(ctx).Save(promo).Error
}

func (r *promotionRepository) GetAll(ctx context.Context, activeOnly bool) ([]models.Promotion, error) {
	var promos []models.Promotion
	q := r.db.WithContext(ctx).Model(&models.Promotion{})
	if activeOnly {
		now := time.Now()
		q = q.Where("is_active = ?", true).
			Where("starts_at IS NULL OR starts_at <= ?", now).
			Where("expires_at IS NULL OR expires_at > ?", now)
	}
	err := q.Order("created_at DESC").Find(&promos).Error
	return promos, err
}

func (r *promotionRepository) RecordUsage(ctx context.Context, usage *models.PromotionUsage) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(usage).Error; err != nil {
			return err
		}
		// Increment used_count safely
		return tx.Model(&models.Promotion{}).Where("id = ?", usage.PromotionID).
			Update("used_count", gorm.Expr("used_count + 1")).Error
	})
}

func (r *promotionRepository) GetUsageCountForUser(ctx context.Context, promoID uuid.UUID, userID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&models.PromotionUsage{}).
		Where("promotion_id = ? AND user_id = ?", promoID, userID).Count(&count).Error
	return count, err
}
