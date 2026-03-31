package repository

import (
	"context"

	"gifts-api/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AdminRepository interface {
	// Audit Logs
	CreateLog(ctx context.Context, log *models.AdminLog) error
	GetLogs(ctx context.Context, limit, offset int) ([]models.AdminLog, int64, error)

	// Settings
	GetSetting(ctx context.Context, key string) (*models.SystemSetting, error)
	UpsertSetting(ctx context.Context, setting *models.SystemSetting) error
	GetAllSettings(ctx context.Context) ([]models.SystemSetting, error)

	// Featured Products
	AddFeaturedProduct(ctx context.Context, fp *models.FeaturedProduct) error
	RemoveFeaturedProduct(ctx context.Context, productID uuid.UUID) error
	GetFeaturedProducts(ctx context.Context, activeOnly bool) ([]models.FeaturedProduct, error)

	// Banners
	CreateBanner(ctx context.Context, banner *models.Banner) error
	GetBannersByPosition(ctx context.Context, position string, activeOnly bool) ([]models.Banner, error)
	GetBannerByID(ctx context.Context, id uuid.UUID) (*models.Banner, error)
	UpdateBanner(ctx context.Context, banner *models.Banner) error
	DeleteBanner(ctx context.Context, id uuid.UUID) error
}

type adminRepository struct {
	db *gorm.DB
}

func NewAdminRepository(db *gorm.DB) AdminRepository {
	return &adminRepository{db: db}
}

// --- Audit Logs ---

func (r *adminRepository) CreateLog(ctx context.Context, log *models.AdminLog) error {
	return r.db.WithContext(ctx).Create(log).Error
}

func (r *adminRepository) GetLogs(ctx context.Context, limit, offset int) ([]models.AdminLog, int64, error) {
	var logs []models.AdminLog
	var total int64
	q := r.db.WithContext(ctx).Model(&models.AdminLog{})
	q.Count(&total)
	err := q.Preload("Admin").Order("created_at DESC").Limit(limit).Offset(offset).Find(&logs).Error
	return logs, total, err
}

// --- Settings ---

func (r *adminRepository) GetSetting(ctx context.Context, key string) (*models.SystemSetting, error) {
	var setting models.SystemSetting
	err := r.db.WithContext(ctx).First(&setting, "key = ?", key).Error
	return &setting, err
}

func (r *adminRepository) UpsertSetting(ctx context.Context, setting *models.SystemSetting) error {
	return r.db.WithContext(ctx).Save(setting).Error
}

func (r *adminRepository) GetAllSettings(ctx context.Context) ([]models.SystemSetting, error) {
	var settings []models.SystemSetting
	err := r.db.WithContext(ctx).Find(&settings).Error
	return settings, err
}

// --- Featured Products ---

func (r *adminRepository) AddFeaturedProduct(ctx context.Context, fp *models.FeaturedProduct) error {
	return r.db.WithContext(ctx).Save(fp).Error // Upsert based on product_id PK
}

func (r *adminRepository) RemoveFeaturedProduct(ctx context.Context, productID uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&models.FeaturedProduct{}, "product_id = ?", productID).Error
}

func (r *adminRepository) GetFeaturedProducts(ctx context.Context, activeOnly bool) ([]models.FeaturedProduct, error) {
	var fps []models.FeaturedProduct
	q := r.db.WithContext(ctx).Preload("Product.Images")
	if activeOnly {
		q = q.Where("is_active = ?", true)
		// Check starts_at and ends_at logic can be added here if needed
	}
	err := q.Order("position ASC").Find(&fps).Error
	return fps, err
}

// --- Banners ---

func (r *adminRepository) CreateBanner(ctx context.Context, banner *models.Banner) error {
	return r.db.WithContext(ctx).Create(banner).Error
}

func (r *adminRepository) GetBannersByPosition(ctx context.Context, position string, activeOnly bool) ([]models.Banner, error) {
	var banners []models.Banner
	q := r.db.WithContext(ctx).Where("position = ?", position)
	if activeOnly {
		q = q.Where("is_active = ?", true)
	}
	err := q.Order("sort_order ASC").Find(&banners).Error
	return banners, err
}

func (r *adminRepository) GetBannerByID(ctx context.Context, id uuid.UUID) (*models.Banner, error) {
	var banner models.Banner
	err := r.db.WithContext(ctx).First(&banner, "id = ?", id).Error
	return &banner, err
}

func (r *adminRepository) UpdateBanner(ctx context.Context, banner *models.Banner) error {
	return r.db.WithContext(ctx).Save(banner).Error
}

func (r *adminRepository) DeleteBanner(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&models.Banner{}, "id = ?", id).Error
}
