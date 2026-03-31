package repository

import (
	"context"
	"errors"

	"gifts-api/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

var ErrSellerNotFound = errors.New("seller not found")

type SellerRepository interface {
	Create(ctx context.Context, seller *models.Seller) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.Seller, error)
	GetByUserID(ctx context.Context, userID uuid.UUID) (*models.Seller, error)
	GetBySlug(ctx context.Context, slug string) (*models.Seller, error)
	Update(ctx context.Context, seller *models.Seller) error
	GetAll(ctx context.Context, status string, offset, limit int) ([]models.Seller, int64, error)

	// Documents
	CreateDocument(ctx context.Context, doc *models.SellerDocument) error
	GetDocumentsBySellerID(ctx context.Context, sellerID uuid.UUID) ([]models.SellerDocument, error)
	UpdateDocument(ctx context.Context, doc *models.SellerDocument) error

	// Bank Details
	CreateBankDetail(ctx context.Context, bd *models.SellerBankDetail) error
	GetBankDetailsBySellerID(ctx context.Context, sellerID uuid.UUID) ([]models.SellerBankDetail, error)
	UpdateBankDetail(ctx context.Context, bd *models.SellerBankDetail) error

	// Working Hours
	UpsertWorkingHours(ctx context.Context, hours []models.SellerWorkingHour) error
	GetWorkingHours(ctx context.Context, sellerID uuid.UUID) ([]models.SellerWorkingHour, error)

	// Delivery Zones
	SetDeliveryZones(ctx context.Context, sellerID uuid.UUID, zones []models.SellerDeliveryZone) error
	GetDeliveryZones(ctx context.Context, sellerID uuid.UUID) ([]models.SellerDeliveryZone, error)

	// Stats
	GetStats(ctx context.Context, sellerID uuid.UUID) (*models.SellerStat, error)
	UpsertStats(ctx context.Context, stats *models.SellerStat) error

	// Ratings
	GetRating(ctx context.Context, sellerID uuid.UUID) (*models.SellerRating, error)
	UpsertRating(ctx context.Context, rating *models.SellerRating) error
}

type sellerRepository struct {
	db *gorm.DB
}

func NewSellerRepository(db *gorm.DB) SellerRepository {
	return &sellerRepository{db: db}
}

func (r *sellerRepository) Create(ctx context.Context, seller *models.Seller) error {
	return r.db.WithContext(ctx).Create(seller).Error
}

func (r *sellerRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Seller, error) {
	var seller models.Seller
	err := r.db.WithContext(ctx).Preload("Stats").Preload("WorkingHours").First(&seller, "id = ?", id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrSellerNotFound
	}
	return &seller, err
}

func (r *sellerRepository) GetByUserID(ctx context.Context, userID uuid.UUID) (*models.Seller, error) {
	var seller models.Seller
	err := r.db.WithContext(ctx).Where("user_id = ?", userID).First(&seller).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrSellerNotFound
	}
	return &seller, err
}

func (r *sellerRepository) GetBySlug(ctx context.Context, slug string) (*models.Seller, error) {
	var seller models.Seller
	err := r.db.WithContext(ctx).Preload("Stats").Where("slug = ?", slug).First(&seller).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrSellerNotFound
	}
	return &seller, err
}

func (r *sellerRepository) Update(ctx context.Context, seller *models.Seller) error {
	return r.db.WithContext(ctx).Save(seller).Error
}

func (r *sellerRepository) GetAll(ctx context.Context, status string, offset, limit int) ([]models.Seller, int64, error) {
	var sellers []models.Seller
	var total int64
	q := r.db.WithContext(ctx).Model(&models.Seller{})
	if status != "" {
		q = q.Where("status = ?", status)
	}
	q.Count(&total)
	err := q.Preload("Stats").Offset(offset).Limit(limit).Order("created_at DESC").Find(&sellers).Error
	return sellers, total, err
}

// --- Documents ---

func (r *sellerRepository) CreateDocument(ctx context.Context, doc *models.SellerDocument) error {
	return r.db.WithContext(ctx).Create(doc).Error
}

func (r *sellerRepository) GetDocumentsBySellerID(ctx context.Context, sellerID uuid.UUID) ([]models.SellerDocument, error) {
	var docs []models.SellerDocument
	err := r.db.WithContext(ctx).Where("seller_id = ?", sellerID).Find(&docs).Error
	return docs, err
}

func (r *sellerRepository) UpdateDocument(ctx context.Context, doc *models.SellerDocument) error {
	return r.db.WithContext(ctx).Save(doc).Error
}

// --- Bank Details ---

func (r *sellerRepository) CreateBankDetail(ctx context.Context, bd *models.SellerBankDetail) error {
	return r.db.WithContext(ctx).Create(bd).Error
}

func (r *sellerRepository) GetBankDetailsBySellerID(ctx context.Context, sellerID uuid.UUID) ([]models.SellerBankDetail, error) {
	var bds []models.SellerBankDetail
	err := r.db.WithContext(ctx).Where("seller_id = ?", sellerID).Find(&bds).Error
	return bds, err
}

func (r *sellerRepository) UpdateBankDetail(ctx context.Context, bd *models.SellerBankDetail) error {
	return r.db.WithContext(ctx).Save(bd).Error
}

// --- Working Hours ---

func (r *sellerRepository) UpsertWorkingHours(ctx context.Context, hours []models.SellerWorkingHour) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if len(hours) == 0 {
			return nil
		}
		sellerID := hours[0].SellerID
		if err := tx.Where("seller_id = ?", sellerID).Delete(&models.SellerWorkingHour{}).Error; err != nil {
			return err
		}
		return tx.Create(&hours).Error
	})
}

func (r *sellerRepository) GetWorkingHours(ctx context.Context, sellerID uuid.UUID) ([]models.SellerWorkingHour, error) {
	var hours []models.SellerWorkingHour
	err := r.db.WithContext(ctx).Where("seller_id = ?", sellerID).Order("day_of_week").Find(&hours).Error
	return hours, err
}

// --- Delivery Zones ---

func (r *sellerRepository) SetDeliveryZones(ctx context.Context, sellerID uuid.UUID, zones []models.SellerDeliveryZone) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("seller_id = ?", sellerID).Delete(&models.SellerDeliveryZone{}).Error; err != nil {
			return err
		}
		if len(zones) > 0 {
			return tx.Create(&zones).Error
		}
		return nil
	})
}

func (r *sellerRepository) GetDeliveryZones(ctx context.Context, sellerID uuid.UUID) ([]models.SellerDeliveryZone, error) {
	var zones []models.SellerDeliveryZone
	err := r.db.WithContext(ctx).Where("seller_id = ?", sellerID).Find(&zones).Error
	return zones, err
}

// --- Stats ---

func (r *sellerRepository) GetStats(ctx context.Context, sellerID uuid.UUID) (*models.SellerStat, error) {
	var stats models.SellerStat
	err := r.db.WithContext(ctx).Where("seller_id = ?", sellerID).First(&stats).Error
	return &stats, err
}

func (r *sellerRepository) UpsertStats(ctx context.Context, stats *models.SellerStat) error {
	return r.db.WithContext(ctx).Save(stats).Error
}

// --- Ratings ---

func (r *sellerRepository) GetRating(ctx context.Context, sellerID uuid.UUID) (*models.SellerRating, error) {
	var rating models.SellerRating
	err := r.db.WithContext(ctx).Where("seller_id = ?", sellerID).First(&rating).Error
	return &rating, err
}

func (r *sellerRepository) UpsertRating(ctx context.Context, rating *models.SellerRating) error {
	return r.db.WithContext(ctx).Save(rating).Error
}
