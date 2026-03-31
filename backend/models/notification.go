package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// NotificationTemplate represents the notification_templates table
type NotificationTemplate struct {
	ID           uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primaryKey" json:"id"`
	EventType    string    `gorm:"type:varchar(100);not null" json:"event_type"`
	Channel      string    `gorm:"type:varchar(10);not null" json:"channel"` // sms, email, push
	Language     string    `gorm:"type:varchar(10);default:'tk'" json:"language"`
	Subject      string    `gorm:"type:varchar(255)" json:"subject"`
	BodyTemplate string    `gorm:"type:text;not null" json:"body_template"`
	IsActive     bool      `gorm:"type:boolean;default:true" json:"is_active"`
}

func (nt *NotificationTemplate) BeforeCreate(tx *gorm.DB) error {
	if nt.ID == uuid.Nil {
		nt.ID = uuid.New()
	}
	return nil
}

// Notification represents the notifications table
type Notification struct {
	ID           uuid.UUID  `gorm:"type:uuid;default:uuid_generate_v4();primaryKey" json:"id"`
	UserID       uuid.UUID  `gorm:"type:uuid;not null" json:"user_id"`
	EventType    string     `gorm:"type:varchar(100);not null" json:"event_type"`
	Channel      string     `gorm:"type:varchar(10);not null" json:"channel"`
	Title        string     `gorm:"type:varchar(255)" json:"title"`
	Body         string     `gorm:"type:text" json:"body"`
	Data         *string    `gorm:"type:jsonb" json:"data"`
	Status       string     `gorm:"type:varchar(10);not null;default:'queued'" json:"status"` // queued, sent, failed, read
	SentAt       *time.Time `json:"sent_at"`
	ReadAt       *time.Time `json:"read_at"`
	ErrorMessage string     `gorm:"type:text" json:"error_message"`
	RetryCount   int        `gorm:"type:int;default:0" json:"retry_count"`
	CreatedAt    time.Time  `json:"created_at"`
}

func (n *Notification) BeforeCreate(tx *gorm.DB) error {
	if n.ID == uuid.Nil {
		n.ID = uuid.New()
	}
	return nil
}

// NotificationPreference represents the notification_preferences table
type NotificationPreference struct {
	UserID            uuid.UUID `gorm:"type:uuid;primaryKey" json:"user_id"`
	SMSEnabled        bool      `gorm:"type:boolean;default:true" json:"sms_enabled"`
	EmailEnabled      bool      `gorm:"type:boolean;default:true" json:"email_enabled"`
	PushEnabled       bool      `gorm:"type:boolean;default:true" json:"push_enabled"`
	MarketingEnabled  bool      `gorm:"type:boolean;default:false" json:"marketing_enabled"`
}
