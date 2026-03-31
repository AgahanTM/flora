package services

import (
	"context"
	"encoding/json"

	"gifts-api/models"
	"gifts-api/repository"

	"github.com/google/uuid"
)

type AnalyticsService interface {
	LogEvent(ctx context.Context, eventType string, userID *uuid.UUID, deviceID *string, meta map[string]interface{}) error
	LogSearch(ctx context.Context, req *models.SearchLog) error
	GetDailyStats(ctx context.Context, startDate, endDate string) ([]models.DailyStat, error)
	GetSellerDailyStats(ctx context.Context, sellerID uuid.UUID, startDate, endDate string) ([]models.SellerDailyStat, error)
}

type analyticsService struct {
	repo repository.AnalyticsRepository
}

func NewAnalyticsService(repo repository.AnalyticsRepository) AnalyticsService {
	return &analyticsService{repo: repo}
}

func (s *analyticsService) LogEvent(ctx context.Context, eventType string, userID *uuid.UUID, deviceID *string, meta map[string]interface{}) error {
	metaJSON, _ := json.Marshal(meta)
	metaStr := string(metaJSON)

	event := &models.AnalyticsEvent{
		EventType: eventType,
		UserID:    userID,
		Data:      &metaStr,
	}
	return s.repo.LogEvent(ctx, event)
}

func (s *analyticsService) LogSearch(ctx context.Context, req *models.SearchLog) error {
	return s.repo.LogSearch(ctx, req)
}

func (s *analyticsService) GetDailyStats(ctx context.Context, startDate, endDate string) ([]models.DailyStat, error) {
	return s.repo.GetDailyStatsRange(ctx, startDate, endDate)
}

func (s *analyticsService) GetSellerDailyStats(ctx context.Context, sellerID uuid.UUID, startDate, endDate string) ([]models.SellerDailyStat, error) {
	return s.repo.GetSellerDailyStatsRange(ctx, sellerID.String(), startDate, endDate)
}
