package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Review represents the reviews table
type Review struct {
	ID                 uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primaryKey" json:"id"`
	OrderID            *uuid.UUID `gorm:"type:uuid;uniqueIndex" json:"order_id"`
	CustomerID         uuid.UUID `gorm:"type:uuid;not null" json:"customer_id"`
	SellerID           uuid.UUID `gorm:"type:uuid;not null" json:"seller_id"`
	ProductID          *uuid.UUID `gorm:"type:uuid" json:"product_id"`
	Rating             int       `gorm:"type:int;not null" json:"rating"` // 1-5
	Comment            string    `gorm:"type:text" json:"comment"`
	Images             *string   `gorm:"type:jsonb" json:"images"` // JSONB array of URLs
	IsVerifiedPurchase bool      `gorm:"type:boolean;default:true" json:"is_verified_purchase"`
	IsVisible          bool      `gorm:"type:boolean;default:true" json:"is_visible"`
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`

	// Relations
	Customer *User     `gorm:"foreignKey:CustomerID" json:"customer,omitempty"`
	Seller   *Seller   `gorm:"foreignKey:SellerID" json:"seller,omitempty"`
	Product  *Product  `gorm:"foreignKey:ProductID" json:"product,omitempty"`
	Response *ReviewResponse `gorm:"foreignKey:ReviewID" json:"response,omitempty"`
}

func (r *Review) BeforeCreate(tx *gorm.DB) error {
	if r.ID == uuid.Nil {
		r.ID = uuid.New()
	}
	return nil
}

// ReviewResponse represents the review_responses table
type ReviewResponse struct {
	ID           uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primaryKey" json:"id"`
	ReviewID     uuid.UUID `gorm:"type:uuid;not null;uniqueIndex" json:"review_id"`
	SellerID     uuid.UUID `gorm:"type:uuid;not null" json:"seller_id"`
	ResponseText string   `gorm:"type:text;not null" json:"response_text"`
	CreatedAt    time.Time `json:"created_at"`
}

func (rr *ReviewResponse) BeforeCreate(tx *gorm.DB) error {
	if rr.ID == uuid.Nil {
		rr.ID = uuid.New()
	}
	return nil
}

// SellerRating represents the seller_ratings table
type SellerRating struct {
	SellerID     uuid.UUID `gorm:"type:uuid;primaryKey" json:"seller_id"`
	AvgRating    float64   `gorm:"type:decimal(3,2);default:0" json:"avg_rating"`
	TotalReviews int       `gorm:"type:int;default:0" json:"total_reviews"`
	FiveStar     int       `gorm:"type:int;default:0" json:"five_star"`
	FourStar     int       `gorm:"type:int;default:0" json:"four_star"`
	ThreeStar    int       `gorm:"type:int;default:0" json:"three_star"`
	TwoStar      int       `gorm:"type:int;default:0" json:"two_star"`
	OneStar      int       `gorm:"type:int;default:0" json:"one_star"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// IssueReport represents the issue_reports table
type IssueReport struct {
	ID         uuid.UUID  `gorm:"type:uuid;default:uuid_generate_v4();primaryKey" json:"id"`
	ReporterID uuid.UUID  `gorm:"type:uuid;not null" json:"reporter_id"`
	TargetType string     `gorm:"type:varchar(20);not null" json:"target_type"` // order, product, seller, review
	TargetID   uuid.UUID  `gorm:"type:uuid;not null" json:"target_id"`
	Reason     string     `gorm:"type:text;not null" json:"reason"`
	Status     string     `gorm:"type:varchar(20);not null;default:'open'" json:"status"` // open, investigating, resolved, dismissed
	AdminNote  string     `gorm:"type:text" json:"admin_note"`
	CreatedAt  time.Time  `json:"created_at"`
	ResolvedAt *time.Time `json:"resolved_at"`
	ResolvedBy *uuid.UUID `gorm:"type:uuid" json:"resolved_by"`

	// Relations
	Reporter *User `gorm:"foreignKey:ReporterID" json:"reporter,omitempty"`
}

func (ir *IssueReport) BeforeCreate(tx *gorm.DB) error {
	if ir.ID == uuid.Nil {
		ir.ID = uuid.New()
	}
	return nil
}
