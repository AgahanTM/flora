package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Seller represents the sellers table
type Seller struct {
	ID              uuid.UUID  `gorm:"type:uuid;default:uuid_generate_v4();primaryKey" json:"id"`
	UserID          uuid.UUID  `gorm:"type:uuid;not null;uniqueIndex" json:"user_id"`
	ShopName        string     `gorm:"type:varchar(255);not null" json:"shop_name"`
	Slug            string     `gorm:"type:varchar(255);uniqueIndex;not null" json:"slug"`
	Description     string     `gorm:"type:text" json:"description"`
	LogoURL         string     `gorm:"type:varchar(500)" json:"logo_url"`
	CoverURL        string     `gorm:"type:varchar(500)" json:"cover_url"`
	Status          string     `gorm:"type:varchar(20);not null;default:'pending'" json:"status"` // pending, approved, suspended, rejected
	ApprovedAt      *time.Time `json:"approved_at"`
	ApprovedBy      *uuid.UUID `gorm:"type:uuid" json:"approved_by"`
	RejectionReason string     `gorm:"type:text" json:"rejection_reason"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`

	// Relations
	User          *User                `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Documents     []SellerDocument     `gorm:"foreignKey:SellerID" json:"documents,omitempty"`
	BankDetails   []SellerBankDetail   `gorm:"foreignKey:SellerID" json:"bank_details,omitempty"`
	WorkingHours  []SellerWorkingHour  `gorm:"foreignKey:SellerID" json:"working_hours,omitempty"`
	Stats         *SellerStat          `gorm:"foreignKey:SellerID" json:"stats,omitempty"`
}

func (s *Seller) BeforeCreate(tx *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return nil
}

// SellerDocument represents the seller_documents table
type SellerDocument struct {
	ID         uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primaryKey" json:"id"`
	SellerID   uuid.UUID `gorm:"type:uuid;not null" json:"seller_id"`
	Type       string    `gorm:"type:varchar(30);not null" json:"type"` // id_card, business_license, tax_certificate
	FileURL    string    `gorm:"type:varchar(500);not null" json:"file_url"`
	UploadedAt time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"uploaded_at"`
	IsVerified bool      `gorm:"type:boolean;default:false" json:"is_verified"`
	VerifiedBy *uuid.UUID `gorm:"type:uuid" json:"verified_by"`
}

func (sd *SellerDocument) BeforeCreate(tx *gorm.DB) error {
	if sd.ID == uuid.Nil {
		sd.ID = uuid.New()
	}
	return nil
}

// SellerBankDetail represents the seller_bank_details table
type SellerBankDetail struct {
	ID                uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primaryKey" json:"id"`
	SellerID          uuid.UUID `gorm:"type:uuid;not null" json:"seller_id"`
	BankName          string    `gorm:"type:varchar(255);not null" json:"bank_name"`
	AccountNumber     string    `gorm:"type:varchar(100);not null" json:"account_number"`
	AccountHolderName string    `gorm:"type:varchar(255);not null" json:"account_holder_name"`
	IsVerified        bool      `gorm:"type:boolean;default:false" json:"is_verified"`
}

func (sb *SellerBankDetail) BeforeCreate(tx *gorm.DB) error {
	if sb.ID == uuid.Nil {
		sb.ID = uuid.New()
	}
	return nil
}

// SellerWorkingHour represents the seller_working_hours table
type SellerWorkingHour struct {
	ID        uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primaryKey" json:"id"`
	SellerID  uuid.UUID `gorm:"type:uuid;not null" json:"seller_id"`
	DayOfWeek int       `gorm:"type:int;not null" json:"day_of_week"` // 0-6
	OpenTime  string    `gorm:"type:time;not null" json:"open_time"`
	CloseTime string    `gorm:"type:time;not null" json:"close_time"`
	IsClosed  bool      `gorm:"type:boolean;default:false" json:"is_closed"`
}

func (sw *SellerWorkingHour) BeforeCreate(tx *gorm.DB) error {
	if sw.ID == uuid.Nil {
		sw.ID = uuid.New()
	}
	return nil
}

// SellerDeliveryZone represents the seller_delivery_zones join table
type SellerDeliveryZone struct {
	SellerID uuid.UUID `gorm:"type:uuid;not null;primaryKey" json:"seller_id"`
	ZoneID   uuid.UUID `gorm:"type:uuid;not null;primaryKey" json:"zone_id"`
	IsActive bool      `gorm:"type:boolean;default:true" json:"is_active"`
}

// SellerStat represents the seller_stats table
type SellerStat struct {
	SellerID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"seller_id"`
	TotalOrders     int       `gorm:"type:int;default:0" json:"total_orders"`
	CompletedOrders int       `gorm:"type:int;default:0" json:"completed_orders"`
	CancelledOrders int       `gorm:"type:int;default:0" json:"cancelled_orders"`
	AvgRating       float64   `gorm:"type:decimal(3,2);default:0" json:"avg_rating"`
	TotalRevenue    float64   `gorm:"type:decimal(12,2);default:0" json:"total_revenue"`
	UpdatedAt       time.Time `json:"updated_at"`
}
