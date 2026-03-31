package services

import (
	"context"
	"encoding/json"

	"gifts-api/models"
	"gifts-api/repository"

	"github.com/google/uuid"
)

type AdminService interface {
	LogAction(ctx context.Context, adminID uuid.UUID, action, entityType string, entityID *uuid.UUID, prev, new map[string]interface{}) error
	GetLogs(ctx context.Context, limit, offset int) ([]models.AdminLog, int64, error)
	GetSetting(ctx context.Context, key string) (string, error)
	GetAllSettings(ctx context.Context) ([]models.SystemSetting, error)
	UpdateSetting(ctx context.Context, key, value string) error

	// Banners
	CreateBanner(ctx context.Context, banner *models.Banner) error
	GetBanners(ctx context.Context, position string) ([]models.Banner, error)
	GetBannerByID(ctx context.Context, id uuid.UUID) (*models.Banner, error)
	UpdateBanner(ctx context.Context, banner *models.Banner) error
}

type adminService struct {
	repo repository.AdminRepository
}

func NewAdminService(repo repository.AdminRepository) AdminService {
	return &adminService{repo: repo}
}

func (s *adminService) LogAction(ctx context.Context, adminID uuid.UUID, action, entityType string, entityID *uuid.UUID, prev, new map[string]interface{}) error {
	prevJSON, _ := json.Marshal(prev)
	newJSON, _ := json.Marshal(new)
	
	prevStr := string(prevJSON)
	newStr := string(newJSON)

	var tID string
	if entityID != nil {
		tID = entityID.String()
	}

	log := &models.AdminLog{
		AdminID:       adminID,
		Action:        action,
		TargetType:    entityType,
		TargetID:      tID,
		PreviousValue: &prevStr,
		NewValue:      &newStr,
	}
	return s.repo.CreateLog(ctx, log)
}

func (s *adminService) GetLogs(ctx context.Context, limit, offset int) ([]models.AdminLog, int64, error) {
	return s.repo.GetLogs(ctx, limit, offset)
}

func (s *adminService) GetSetting(ctx context.Context, key string) (string, error) {
	setting, err := s.repo.GetSetting(ctx, key)
	if err != nil {
		return "", err
	}
	if setting.Value != nil {
		return *setting.Value, nil
	}
	return "", nil
}

func (s *adminService) GetAllSettings(ctx context.Context) ([]models.SystemSetting, error) {
	return s.repo.GetAllSettings(ctx)
}

func (s *adminService) UpdateSetting(ctx context.Context, key, value string) error {
	setting := &models.SystemSetting{
		Key:   key,
		Value: &value,
	}
	return s.repo.UpsertSetting(ctx, setting)
}

func (s *adminService) CreateBanner(ctx context.Context, banner *models.Banner) error {
	return s.repo.CreateBanner(ctx, banner)
}

func (s *adminService) GetBanners(ctx context.Context, position string) ([]models.Banner, error) {
	return s.repo.GetBannersByPosition(ctx, position, false)
}

func (s *adminService) GetBannerByID(ctx context.Context, id uuid.UUID) (*models.Banner, error) {
	return s.repo.GetBannerByID(ctx, id)
}

func (s *adminService) UpdateBanner(ctx context.Context, banner *models.Banner) error {
	return s.repo.UpdateBanner(ctx, banner)
}
