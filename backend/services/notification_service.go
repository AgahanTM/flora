package services

import (
	"context"
	"encoding/json"
	"time"

	"gifts-api/models"
	"gifts-api/repository"

	"github.com/google/uuid"
)

type NotificationService interface {
	SendNotification(ctx context.Context, userID uuid.UUID, eventType, channel, title, body string, data map[string]interface{}) error
	GetPendingNotifications(ctx context.Context, limit int) ([]models.Notification, error)
	MarkAsSent(ctx context.Context, notificationID uuid.UUID) error
	MarkAsFailed(ctx context.Context, notificationID uuid.UUID, errorMsg string) error

	// User facing
	GetUserNotifications(ctx context.Context, userID uuid.UUID, limit, offset int) ([]models.Notification, int64, error)
	MarkAllAsRead(ctx context.Context, userID uuid.UUID) error
	MarkAsRead(ctx context.Context, notificationID uuid.UUID, userID uuid.UUID) error

	// Preferences
	GetPreferences(ctx context.Context, userID uuid.UUID) (*models.NotificationPreference, error)
	UpdatePreferences(ctx context.Context, prefs *models.NotificationPreference) error
}

type notificationService struct {
	repo repository.NotificationRepository
}

func NewNotificationService(repo repository.NotificationRepository) NotificationService {
	return &notificationService{repo: repo}
}

// Fix 9
func (s *notificationService) SendNotification(ctx context.Context, userID uuid.UUID, eventType, channel, title, body string, data map[string]interface{}) error {
	var dataJSON *string
	if data != nil {
		b, err := json.Marshal(data)
		if err == nil {
			str := string(b)
			dataJSON = &str
		}
	}

	notification := &models.Notification{
		UserID:    userID,
		EventType: eventType,
		Channel:   channel,
		Title:     title,
		Body:      body,
		Data:      dataJSON,
		Status:    "queued",
	}

	return s.repo.CreateNotification(ctx, notification)
}

func (s *notificationService) GetPendingNotifications(ctx context.Context, limit int) ([]models.Notification, error) {
	return s.repo.GetPendingNotifications(ctx, limit)
}

// Fix 16
func (s *notificationService) MarkAsSent(ctx context.Context, notificationID uuid.UUID) error {
	now := time.Now()
	return s.repo.UpdateNotificationStatus(ctx, notificationID, "sent", &now, "")
}

// Fix 16
func (s *notificationService) MarkAsFailed(ctx context.Context, notificationID uuid.UUID, errorMsg string) error {
	return s.repo.UpdateNotificationStatus(ctx, notificationID, "failed", nil, errorMsg)
}

// Fix 10
func (s *notificationService) GetUserNotifications(ctx context.Context, userID uuid.UUID, limit, offset int) ([]models.Notification, int64, error) {
	return s.repo.GetNotificationsByUserID(ctx, userID, limit, offset)
}

// Fix 11
func (s *notificationService) MarkAllAsRead(ctx context.Context, userID uuid.UUID) error {
	return s.repo.MarkAllAsRead(ctx, userID)
}

// Fix 11
func (s *notificationService) MarkAsRead(ctx context.Context, notificationID uuid.UUID, userID uuid.UUID) error {
	return s.repo.MarkAsRead(ctx, notificationID, userID)
}

func (s *notificationService) GetPreferences(ctx context.Context, userID uuid.UUID) (*models.NotificationPreference, error) {
	return s.repo.GetPreferences(ctx, userID)
}

func (s *notificationService) UpdatePreferences(ctx context.Context, prefs *models.NotificationPreference) error {
	return s.repo.UpdatePreferences(ctx, prefs)
}
