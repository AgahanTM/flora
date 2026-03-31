package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// AnalyticsEvent represents the analytics_events table
type AnalyticsEvent struct {
	ID        uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primaryKey" json:"id"`
	EventType string    `gorm:"type:varchar(100);not null" json:"event_type"`
	UserID    *uuid.UUID `gorm:"type:uuid" json:"user_id"`
	SessionID string    `gorm:"type:varchar(255)" json:"session_id"`
	Data      *string   `gorm:"type:jsonb" json:"data"`
	IPAddress string    `gorm:"type:varchar(45)" json:"ip_address"`
	UserAgent string    `gorm:"type:text" json:"user_agent"`
	CreatedAt time.Time `json:"created_at"`
}

func (ae *AnalyticsEvent) BeforeCreate(tx *gorm.DB) error {
	if ae.ID == uuid.Nil {
		ae.ID = uuid.New()
	}
	return nil
}

// DailyStat represents the daily_stats table
type DailyStat struct {
	StatDate           string   `gorm:"type:date;primaryKey" json:"stat_date"`
	TotalOrders        int      `gorm:"type:int;default:0" json:"total_orders"`
	CompletedOrders    int      `gorm:"type:int;default:0" json:"completed_orders"`
	CancelledOrders    int      `gorm:"type:int;default:0" json:"cancelled_orders"`
	TotalRevenue       float64  `gorm:"type:decimal(12,2);default:0" json:"total_revenue"`
	NewCustomers       int      `gorm:"type:int;default:0" json:"new_customers"`
	ReturningCustomers int      `gorm:"type:int;default:0" json:"returning_customers"`
	AvgOrderValue      float64  `gorm:"type:decimal(10,2);default:0" json:"avg_order_value"`
	TopProducts        *string  `gorm:"type:jsonb" json:"top_products"`
	TopSellers         *string  `gorm:"type:jsonb" json:"top_sellers"`
	UpdatedAt          time.Time `json:"updated_at"`
}

// SellerDailyStat represents the seller_daily_stats table
type SellerDailyStat struct {
	SellerID  uuid.UUID `gorm:"type:uuid;not null;primaryKey" json:"seller_id"`
	StatDate  string    `gorm:"type:date;not null;primaryKey" json:"stat_date"`
	Orders    int       `gorm:"type:int;default:0" json:"orders"`
	Revenue   float64   `gorm:"type:decimal(12,2);default:0" json:"revenue"`
	AvgRating float64   `gorm:"type:decimal(3,2);default:0" json:"avg_rating"`
}

// SearchLog represents the search_logs table
type SearchLog struct {
	ID               uuid.UUID  `gorm:"type:uuid;default:uuid_generate_v4();primaryKey" json:"id"`
	Query            string     `gorm:"type:varchar(255);not null" json:"query"`
	UserID           *uuid.UUID `gorm:"type:uuid" json:"user_id"`
	ResultsCount     int        `gorm:"type:int;default:0" json:"results_count"`
	ClickedProductID *uuid.UUID `gorm:"type:uuid" json:"clicked_product_id"`
	CreatedAt        time.Time  `json:"created_at"`
}

func (sl *SearchLog) BeforeCreate(tx *gorm.DB) error {
	if sl.ID == uuid.Nil {
		sl.ID = uuid.New()
	}
	return nil
}
