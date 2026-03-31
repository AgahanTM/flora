package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// SubscriptionPlan represents the subscription_plans table
type SubscriptionPlan struct {
	ID                  uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primaryKey" json:"id"`
	Name                string    `gorm:"type:varchar(255);not null" json:"name"`
	Description         string    `gorm:"type:text" json:"description"`
	Frequency           string    `gorm:"type:varchar(20);not null" json:"frequency"` // weekly, biweekly, monthly
	BasePrice           float64   `gorm:"type:decimal(10,2);not null" json:"base_price"`
	IncludesDescription string    `gorm:"type:text" json:"includes_description"`
	IsActive            bool      `gorm:"type:boolean;default:true" json:"is_active"`
	SortOrder           int       `gorm:"type:int;default:0" json:"sort_order"`
}

func (sp *SubscriptionPlan) BeforeCreate(tx *gorm.DB) error {
	if sp.ID == uuid.Nil {
		sp.ID = uuid.New()
	}
	return nil
}

// Subscription represents the subscriptions table
type Subscription struct {
	ID                uuid.UUID  `gorm:"type:uuid;default:uuid_generate_v4();primaryKey" json:"id"`
	CustomerID        uuid.UUID  `gorm:"type:uuid;not null" json:"customer_id"`
	SellerID          uuid.UUID  `gorm:"type:uuid;not null" json:"seller_id"`
	PlanID            uuid.UUID  `gorm:"type:uuid;not null" json:"plan_id"`
	Status            string     `gorm:"type:varchar(20);not null;default:'active'" json:"status"` // active, paused, cancelled
	DeliveryAddressID *uuid.UUID `gorm:"type:uuid" json:"delivery_address_id"`
	NextDeliveryDate  *string    `gorm:"type:date" json:"next_delivery_date"`
	LastDeliveryDate  *string    `gorm:"type:date" json:"last_delivery_date"`
	StartedAt         time.Time  `gorm:"default:CURRENT_TIMESTAMP" json:"started_at"`
	CancelledAt       *time.Time `json:"cancelled_at"`
	PauseUntil        *string    `gorm:"type:date" json:"pause_until"`
	CreatedAt         time.Time  `json:"created_at"`

	// Relations
	Customer        *User              `gorm:"foreignKey:CustomerID" json:"customer,omitempty"`
	Seller          *Seller            `gorm:"foreignKey:SellerID" json:"seller,omitempty"`
	Plan            *SubscriptionPlan  `gorm:"foreignKey:PlanID" json:"plan,omitempty"`
	DeliveryAddress *UserAddress       `gorm:"foreignKey:DeliveryAddressID" json:"delivery_address,omitempty"`
	Deliveries      []SubscriptionDelivery `gorm:"foreignKey:SubscriptionID" json:"deliveries,omitempty"`
}

func (s *Subscription) BeforeCreate(tx *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return nil
}

// SubscriptionDelivery represents the subscription_deliveries table
type SubscriptionDelivery struct {
	ID             uuid.UUID  `gorm:"type:uuid;default:uuid_generate_v4();primaryKey" json:"id"`
	SubscriptionID uuid.UUID  `gorm:"type:uuid;not null" json:"subscription_id"`
	OrderID        *uuid.UUID `gorm:"type:uuid" json:"order_id"`
	ScheduledDate  string     `gorm:"type:date;not null" json:"scheduled_date"`
	Status         string     `gorm:"type:varchar(20);not null;default:'scheduled'" json:"status"` // scheduled, completed, skipped, failed
	CreatedAt      time.Time  `json:"created_at"`
}

func (sd *SubscriptionDelivery) BeforeCreate(tx *gorm.DB) error {
	if sd.ID == uuid.Nil {
		sd.ID = uuid.New()
	}
	return nil
}
