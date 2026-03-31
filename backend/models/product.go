package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Category represents the categories table
type Category struct {
	ID       uuid.UUID  `gorm:"type:uuid;default:uuid_generate_v4();primaryKey" json:"id"`
	Name     string     `gorm:"type:varchar(255);not null" json:"name"`
	Slug     string     `gorm:"type:varchar(255);uniqueIndex;not null" json:"slug"`
	ParentID *uuid.UUID `gorm:"type:uuid" json:"parent_id"`
	IconURL  string     `gorm:"type:varchar(500)" json:"icon_url"`
	IsActive bool       `gorm:"type:boolean;default:true" json:"is_active"`
	SortOrder int       `gorm:"type:int;default:0" json:"sort_order"`

	// Relations
	Parent   *Category  `gorm:"foreignKey:ParentID" json:"parent,omitempty"`
	Children []Category `gorm:"foreignKey:ParentID" json:"children,omitempty"`
}

func (c *Category) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}

// Product represents the products table
type Product struct {
	ID                  uuid.UUID      `gorm:"type:uuid;default:uuid_generate_v4();primaryKey" json:"id"`
	SellerID            uuid.UUID      `gorm:"type:uuid;not null" json:"seller_id"`
	CategoryID          *uuid.UUID     `gorm:"type:uuid" json:"category_id"`
	Title               string         `gorm:"type:varchar(255);not null" json:"title"`
	Description         string         `gorm:"type:text" json:"description"`
	BasePrice           float64        `gorm:"type:decimal(10,2);not null" json:"base_price"`
	ComparePrice        *float64       `gorm:"type:decimal(10,2)" json:"compare_price"`
	Status              string         `gorm:"type:varchar(20);not null;default:'draft'" json:"status"` // draft, active, paused, deleted
	ShelfLifeHours      *int           `gorm:"type:int" json:"shelf_life_hours"`
	RequiresColdStorage bool           `gorm:"type:boolean;default:false" json:"requires_cold_storage"`
	IsFeatured          bool           `gorm:"type:boolean;default:false" json:"is_featured"`
	CreatedAt           time.Time      `json:"created_at"`
	UpdatedAt           time.Time      `json:"updated_at"`
	DeletedAt           gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`

	// Relations
	Seller   *Seller          `gorm:"foreignKey:SellerID" json:"seller,omitempty"`
	Category *Category        `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
	Images   []ProductImage   `gorm:"foreignKey:ProductID" json:"images,omitempty"`
	Variants []ProductVariant `gorm:"foreignKey:ProductID" json:"variants,omitempty"`
	Addons   []ProductAddon   `gorm:"foreignKey:ProductID" json:"addons,omitempty"`
	Tags     []ProductTag     `gorm:"foreignKey:ProductID" json:"tags,omitempty"`
}

func (p *Product) BeforeCreate(tx *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return nil
}

// ProductImage represents the product_images table
type ProductImage struct {
	ID        uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primaryKey" json:"id"`
	ProductID uuid.UUID `gorm:"type:uuid;not null" json:"product_id"`
	URL       string    `gorm:"type:varchar(500);not null" json:"url"`
	SortOrder int       `gorm:"type:int;default:0" json:"sort_order"`
	IsPrimary bool      `gorm:"type:boolean;default:false" json:"is_primary"`
}

func (pi *ProductImage) BeforeCreate(tx *gorm.DB) error {
	if pi.ID == uuid.Nil {
		pi.ID = uuid.New()
	}
	return nil
}

// ProductVariant represents the product_variants table
type ProductVariant struct {
	ID            uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primaryKey" json:"id"`
	ProductID     uuid.UUID `gorm:"type:uuid;not null" json:"product_id"`
	Name          string    `gorm:"type:varchar(100);not null" json:"name"`
	PriceModifier float64  `gorm:"type:decimal(10,2);default:0" json:"price_modifier"`
	SKU           *string   `gorm:"type:varchar(100);uniqueIndex" json:"sku"`
	IsActive      bool      `gorm:"type:boolean;default:true" json:"is_active"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

func (pv *ProductVariant) BeforeCreate(tx *gorm.DB) error {
	if pv.ID == uuid.Nil {
		pv.ID = uuid.New()
	}
	return nil
}

// ProductAddon represents the product_addons table
type ProductAddon struct {
	ID          uuid.UUID  `gorm:"type:uuid;default:uuid_generate_v4();primaryKey" json:"id"`
	ProductID   *uuid.UUID `gorm:"type:uuid" json:"product_id"` // null = global addon
	Name        string     `gorm:"type:varchar(255);not null" json:"name"`
	Description string     `gorm:"type:text" json:"description"`
	Price       float64    `gorm:"type:decimal(10,2);not null" json:"price"`
	AddonType   string     `gorm:"type:varchar(30);not null" json:"addon_type"` // flower_addon, gift_item, personalization
	MaxQuantity int        `gorm:"type:int;default:1" json:"max_quantity"`
	IsActive    bool       `gorm:"type:boolean;default:true" json:"is_active"`
}

func (pa *ProductAddon) BeforeCreate(tx *gorm.DB) error {
	if pa.ID == uuid.Nil {
		pa.ID = uuid.New()
	}
	return nil
}

// Inventory represents the inventory table
type Inventory struct {
	ID                uuid.UUID  `gorm:"type:uuid;default:uuid_generate_v4();primaryKey" json:"id"`
	ProductID         uuid.UUID  `gorm:"type:uuid;not null" json:"product_id"`
	VariantID         *uuid.UUID `gorm:"type:uuid" json:"variant_id"`
	QuantityTotal     int        `gorm:"type:int;not null;default:0" json:"quantity_total"`
	QuantityReserved  int        `gorm:"type:int;not null;default:0" json:"quantity_reserved"`
	LowStockThreshold int       `gorm:"type:int;default:5" json:"low_stock_threshold"`
	Version           int        `gorm:"type:int;default:0" json:"version"` // optimistic locking
	UpdatedAt         time.Time  `json:"updated_at"`
}

func (i *Inventory) BeforeCreate(tx *gorm.DB) error {
	if i.ID == uuid.Nil {
		i.ID = uuid.New()
	}
	return nil
}

// ProductOccasion represents the product_occasions join table
type ProductOccasion struct {
	ProductID  uuid.UUID `gorm:"type:uuid;not null;primaryKey" json:"product_id"`
	OccasionID uuid.UUID `gorm:"type:uuid;not null;primaryKey" json:"occasion_id"`
}

// ProductTag represents the product_tags table
type ProductTag struct {
	ProductID uuid.UUID `gorm:"type:uuid;not null;primaryKey" json:"product_id"`
	Tag       string    `gorm:"type:varchar(100);not null;primaryKey" json:"tag"`
}
