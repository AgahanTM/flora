package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// AdminLog represents the admin_logs table
type AdminLog struct {
	ID            uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primaryKey" json:"id"`
	AdminID       uuid.UUID `gorm:"type:uuid;not null" json:"admin_id"`
	Action        string    `gorm:"type:varchar(255);not null" json:"action"`
	TargetType    string    `gorm:"type:varchar(100)" json:"target_type"`
	TargetID      string    `gorm:"type:varchar(255)" json:"target_id"`
	PreviousValue *string   `gorm:"type:jsonb" json:"previous_value"`
	NewValue      *string   `gorm:"type:jsonb" json:"new_value"`
	IPAddress     string    `gorm:"type:varchar(45)" json:"ip_address"`
	CreatedAt     time.Time `json:"created_at"`

	// Relations
	Admin *User `gorm:"foreignKey:AdminID" json:"admin,omitempty"`
}

func (al *AdminLog) BeforeCreate(tx *gorm.DB) error {
	if al.ID == uuid.Nil {
		al.ID = uuid.New()
	}
	return nil
}

// SystemSetting represents the system_settings table
type SystemSetting struct {
	Key         string     `gorm:"type:varchar(255);primaryKey" json:"key"`
	Value       *string    `gorm:"type:jsonb" json:"value"`
	Description string     `gorm:"type:text" json:"description"`
	UpdatedBy   *uuid.UUID `gorm:"type:uuid" json:"updated_by"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

// FeaturedProduct represents the featured_products table
type FeaturedProduct struct {
	ProductID uuid.UUID  `gorm:"type:uuid;primaryKey" json:"product_id"`
	Position  int        `gorm:"type:int;not null" json:"position"`
	StartsAt  *time.Time `json:"starts_at"`
	EndsAt    *time.Time `json:"ends_at"`
	IsActive  bool       `gorm:"type:boolean;default:true" json:"is_active"`
	AddedBy   *uuid.UUID `gorm:"type:uuid" json:"added_by"`

	// Relations
	Product *Product `gorm:"foreignKey:ProductID" json:"product,omitempty"`
}

// Banner represents the banners table
type Banner struct {
	ID        uuid.UUID  `gorm:"type:uuid;default:uuid_generate_v4();primaryKey" json:"id"`
	Title     string     `gorm:"type:varchar(255)" json:"title"`
	ImageURL  string     `gorm:"type:varchar(500);not null" json:"image_url"`
	LinkURL   string     `gorm:"type:varchar(500)" json:"link_url"`
	Position  string     `gorm:"type:varchar(20);not null" json:"position"` // home_top, home_mid, category_page
	IsActive  bool       `gorm:"type:boolean;default:true" json:"is_active"`
	StartsAt  *time.Time `json:"starts_at"`
	EndsAt    *time.Time `json:"ends_at"`
	SortOrder int        `gorm:"type:int;default:0" json:"sort_order"`
	CreatedBy *uuid.UUID `gorm:"type:uuid" json:"created_by"`
}

func (b *Banner) BeforeCreate(tx *gorm.DB) error {
	if b.ID == uuid.Nil {
		b.ID = uuid.New()
	}
	return nil
}
