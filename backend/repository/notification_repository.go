package repository

import (
	"context"
	"time"

	"gifts-api/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type NotificationRepository interface {
	// Templates
	GetTemplate(ctx context.Context, eventType, channel, language string) (*models.NotificationTemplate, error)
	CreateTemplate(ctx context.Context, tmpl *models.NotificationTemplate) error
	UpdateTemplate(ctx context.Context, tmpl *models.NotificationTemplate) error

	// Notifications
	CreateNotification(ctx context.Context, notification *models.Notification) error
	GetPendingNotifications(ctx context.Context, limit int) ([]models.Notification, error)
	UpdateNotification(ctx context.Context, notification *models.Notification) error
	GetNotificationsByUserID(ctx context.Context, userID uuid.UUID, limit, offset int) ([]models.Notification, int64, error)
	MarkAsRead(ctx context.Context, id uuid.UUID, userID uuid.UUID) error
	MarkAllAsRead(ctx context.Context, userID uuid.UUID) error
	UpdateNotificationStatus(ctx context.Context, id uuid.UUID, status string, sentAt *time.Time, errorMsg string) error

	// Preferences
	GetPreferences(ctx context.Context, userID uuid.UUID) (*models.NotificationPreference, error)
	UpdatePreferences(ctx context.Context, prefs *models.NotificationPreference) error
}

type notificationRepository struct {
	db *gorm.DB
}

func NewNotificationRepository(db *gorm.DB) NotificationRepository {
	return &notificationRepository{db: db}
}

// --- Templates ---

func (r *notificationRepository) GetTemplate(ctx context.Context, eventType, channel, language string) (*models.NotificationTemplate, error) {
	var tmpl models.NotificationTemplate
	err := r.db.WithContext(ctx).Where("event_type = ? AND channel = ? AND language = ? AND is_active = ?", eventType, channel, language, true).First(&tmpl).Error
	return &tmpl, err
}

func (r *notificationRepository) CreateTemplate(ctx context.Context, tmpl *models.NotificationTemplate) error {
	return r.db.WithContext(ctx).Create(tmpl).Error
}

func (r *notificationRepository) UpdateTemplate(ctx context.Context, tmpl *models.NotificationTemplate) error {
	return r.db.WithContext(ctx).Save(tmpl).Error
}

// --- Notifications ---

func (r *notificationRepository) CreateNotification(ctx context.Context, notification *models.Notification) error {
	return r.db.WithContext(ctx).Create(notification).Error
}

func (r *notificationRepository) GetPendingNotifications(ctx context.Context, limit int) ([]models.Notification, error) {
	var notifs []models.Notification
	err := r.db.WithContext(ctx).Where("status = ?", "queued").Order("created_at ASC").Limit(limit).Find(&notifs).Error
	return notifs, err
}

func (r *notificationRepository) UpdateNotification(ctx context.Context, notification *models.Notification) error {
	return r.db.WithContext(ctx).Save(notification).Error
}

func (r *notificationRepository) GetNotificationsByUserID(ctx context.Context, userID uuid.UUID, limit, offset int) ([]models.Notification, int64, error) {
	var notifs []models.Notification
	var total int64
	q := r.db.WithContext(ctx).Model(&models.Notification{}).Where("user_id = ?", userID)
	q.Count(&total)
	err := q.Order("created_at DESC").Limit(limit).Offset(offset).Find(&notifs).Error
	return notifs, total, err
}

func (r *notificationRepository) MarkAsRead(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	return r.db.WithContext(ctx).Model(&models.Notification{}).
		Where("id = ? AND user_id = ?", id, userID).
		Updates(map[string]interface{}{
			"status":  "read",
			"read_at": gorm.Expr("CURRENT_TIMESTAMP"),
		}).Error
}

func (r *notificationRepository) MarkAllAsRead(ctx context.Context, userID uuid.UUID) error {
	return r.db.WithContext(ctx).Model(&models.Notification{}).
		Where("user_id = ? AND status != ?", userID, "read").
		Updates(map[string]interface{}{
			"status":  "read",
			"read_at": gorm.Expr("CURRENT_TIMESTAMP"),
		}).Error
}

func (r *notificationRepository) UpdateNotificationStatus(ctx context.Context, id uuid.UUID, status string, sentAt *time.Time, errorMsg string) error {
	updates := map[string]interface{}{
		"status": status,
	}
	if sentAt != nil {
		updates["sent_at"] = *sentAt
	}
	if errorMsg != "" {
		updates["error_message"] = errorMsg
		updates["retry_count"] = gorm.Expr("retry_count + 1")
	}
	return r.db.WithContext(ctx).Model(&models.Notification{}).Where("id = ?", id).Updates(updates).Error
}

func (r *notificationRepository) GetPreferences(ctx context.Context, userID uuid.UUID) (*models.NotificationPreference, error) {
	var prefs models.NotificationPreference
	err := r.db.WithContext(ctx).FirstOrCreate(&prefs, models.NotificationPreference{UserID: userID}).Error
	return &prefs, err
}

func (r *notificationRepository) UpdatePreferences(ctx context.Context, prefs *models.NotificationPreference) error {
	return r.db.WithContext(ctx).Save(prefs).Error
}
