package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Promotion represents the promotions table
type Promotion struct {
	ID               uuid.UUID  `gorm:"type:uuid;default:uuid_generate_v4();primaryKey" json:"id"`
	Code             string     `gorm:"type:varchar(50);uniqueIndex;not null" json:"code"`
	Name             string     `gorm:"type:varchar(255)" json:"name"`
	Type             string     `gorm:"type:varchar(20);not null" json:"type"` // percentage, fixed_amount, free_delivery
	Value            float64    `gorm:"type:decimal(10,2);not null" json:"value"`
	MinOrderAmount   float64    `gorm:"type:decimal(10,2);default:0" json:"min_order_amount"`
	MaxDiscountAmount *float64  `gorm:"type:decimal(10,2)" json:"max_discount_amount"`
	Scope            string     `gorm:"type:varchar(20);not null;default:'all_orders'" json:"scope"` // all_orders, first_order, specific_sellers
	StartsAt         *time.Time `json:"starts_at"`
	ExpiresAt        *time.Time `json:"expires_at"`
	MaxUses          *int       `json:"max_uses"`
	UsedCount        int        `gorm:"type:int;default:0" json:"used_count"`
	IsActive         bool       `gorm:"type:boolean;default:true" json:"is_active"`
	CreatedBy        *uuid.UUID `gorm:"type:uuid" json:"created_by"`
	CreatedAt        time.Time  `json:"created_at"`

	// Relations
	Sellers []PromotionSeller `gorm:"foreignKey:PromotionID" json:"sellers,omitempty"`
	Usages  []PromotionUsage  `gorm:"foreignKey:PromotionID" json:"usages,omitempty"`
}

func (p *Promotion) BeforeCreate(tx *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return nil
}

// PromotionUsage represents the promotion_usages table
type PromotionUsage struct {
	ID              uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primaryKey" json:"id"`
	PromotionID     uuid.UUID `gorm:"type:uuid;not null" json:"promotion_id"`
	UserID          uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`
	OrderID         uuid.UUID `gorm:"type:uuid;not null" json:"order_id"`
	DiscountApplied float64   `gorm:"type:decimal(10,2);not null" json:"discount_applied"`
	UsedAt          time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"used_at"`
}

func (pu *PromotionUsage) BeforeCreate(tx *gorm.DB) error {
	if pu.ID == uuid.Nil {
		pu.ID = uuid.New()
	}
	return nil
}

// PromotionSeller represents the promotion_sellers join table
type PromotionSeller struct {
	PromotionID uuid.UUID `gorm:"type:uuid;not null;primaryKey" json:"promotion_id"`
	SellerID    uuid.UUID `gorm:"type:uuid;not null;primaryKey" json:"seller_id"`
}
