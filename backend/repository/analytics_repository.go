package repository

import (
	"context"

	"gifts-api/models"

	"gorm.io/gorm"
)

type AnalyticsRepository interface {
	// Events
	LogEvent(ctx context.Context, event *models.AnalyticsEvent) error

	// Daily Stats
	GetDailyStat(ctx context.Context, date string) (*models.DailyStat, error)
	UpsertDailyStat(ctx context.Context, stat *models.DailyStat) error
	GetDailyStatsRange(ctx context.Context, startDate, endDate string) ([]models.DailyStat, error)

	// Seller Daily Stats
	GetSellerDailyStat(ctx context.Context, sellerID string, date string) (*models.SellerDailyStat, error)
	UpsertSellerDailyStat(ctx context.Context, stat *models.SellerDailyStat) error
	GetSellerDailyStatsRange(ctx context.Context, sellerID string, startDate, endDate string) ([]models.SellerDailyStat, error)

	// Search Log
	LogSearch(ctx context.Context, log *models.SearchLog) error
}

type analyticsRepository struct {
	db *gorm.DB
}

func NewAnalyticsRepository(db *gorm.DB) AnalyticsRepository {
	return &analyticsRepository{db: db}
}

// --- Events ---
func (r *analyticsRepository) LogEvent(ctx context.Context, event *models.AnalyticsEvent) error {
	return r.db.WithContext(ctx).Create(event).Error
}

// --- Daily Stats ---
func (r *analyticsRepository) GetDailyStat(ctx context.Context, date string) (*models.DailyStat, error) {
	var stat models.DailyStat
	err := r.db.WithContext(ctx).First(&stat, "stat_date = ?", date).Error
	return &stat, err
}

func (r *analyticsRepository) UpsertDailyStat(ctx context.Context, stat *models.DailyStat) error {
	return r.db.WithContext(ctx).Save(stat).Error
}

func (r *analyticsRepository) GetDailyStatsRange(ctx context.Context, startDate, endDate string) ([]models.DailyStat, error) {
	var stats []models.DailyStat
	err := r.db.WithContext(ctx).Where("stat_date >= ? AND stat_date <= ?", startDate, endDate).Order("stat_date ASC").Find(&stats).Error
	return stats, err
}

// --- Seller Daily Stats ---
func (r *analyticsRepository) GetSellerDailyStat(ctx context.Context, sellerID string, date string) (*models.SellerDailyStat, error) {
	var stat models.SellerDailyStat
	err := r.db.WithContext(ctx).First(&stat, "seller_id = ? AND stat_date = ?", sellerID, date).Error
	return &stat, err
}

func (r *analyticsRepository) UpsertSellerDailyStat(ctx context.Context, stat *models.SellerDailyStat) error {
	return r.db.WithContext(ctx).Save(stat).Error
}

func (r *analyticsRepository) GetSellerDailyStatsRange(ctx context.Context, sellerID string, startDate, endDate string) ([]models.SellerDailyStat, error) {
	var stats []models.SellerDailyStat
	err := r.db.WithContext(ctx).Where("seller_id = ? AND stat_date >= ? AND stat_date <= ?", sellerID, startDate, endDate).Order("stat_date ASC").Find(&stats).Error
	return stats, err
}

// --- Search Log ---
func (r *analyticsRepository) LogSearch(ctx context.Context, log *models.SearchLog) error {
	return r.db.WithContext(ctx).Create(log).Error
}
