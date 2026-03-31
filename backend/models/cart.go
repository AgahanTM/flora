package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Cart represents the carts table
type Cart struct {
	ID        uuid.UUID  `gorm:"type:uuid;default:uuid_generate_v4();primaryKey" json:"id"`
	UserID    *uuid.UUID `gorm:"type:uuid;uniqueIndex" json:"user_id"`
	SessionID *string    `gorm:"type:varchar(255);uniqueIndex" json:"session_id"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`

	// Relations
	Items []CartItem `gorm:"foreignKey:CartID;constraint:OnDelete:CASCADE;" json:"items,omitempty"`
}

func (c *Cart) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}

// CartItem represents the cart_items table
type CartItem struct {
	ID        uuid.UUID  `gorm:"type:uuid;default:uuid_generate_v4();primaryKey" json:"id"`
	CartID    uuid.UUID  `gorm:"type:uuid;not null" json:"cart_id"`
	ProductID uuid.UUID  `gorm:"type:uuid;not null" json:"product_id"`
	VariantID *uuid.UUID `gorm:"type:uuid" json:"variant_id"`
	Quantity  int        `gorm:"type:int;not null;default:1" json:"quantity"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`

	// Relations
	Product *Product        `gorm:"foreignKey:ProductID" json:"product,omitempty"`
	Variant *ProductVariant `gorm:"foreignKey:VariantID" json:"variant,omitempty"`
}

func (ci *CartItem) BeforeCreate(tx *gorm.DB) error {
	if ci.ID == uuid.Nil {
		ci.ID = uuid.New()
	}
	return nil
}

// Wishlist represents the wishlists table
type Wishlist struct {
	UserID    uuid.UUID `gorm:"type:uuid;not null;primaryKey" json:"user_id"`
	ProductID uuid.UUID `gorm:"type:uuid;not null;primaryKey" json:"product_id"`
	CreatedAt time.Time `json:"created_at"`

	// Relations
	Product *Product `gorm:"foreignKey:ProductID" json:"product,omitempty"`
}
