package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// DeliveryZone represents the delivery_zones table
type DeliveryZone struct {
	ID               uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primaryKey" json:"id"`
	Name             string    `gorm:"type:varchar(255);not null" json:"name"`
	City             string    `gorm:"type:varchar(100)" json:"city"`
	Polygon          *string   `gorm:"type:jsonb" json:"polygon"` // GeoJSON polygon
	BaseDeliveryFee  float64   `gorm:"type:decimal(10,2);default:0" json:"base_delivery_fee"`
	EstimatedMinutes *int      `gorm:"type:int" json:"estimated_minutes"`
	IsActive         bool      `gorm:"type:boolean;default:true" json:"is_active"`
}

func (dz *DeliveryZone) BeforeCreate(tx *gorm.DB) error {
	if dz.ID == uuid.Nil {
		dz.ID = uuid.New()
	}
	return nil
}

// DeliveryTimeSlot represents the delivery_time_slots table
type DeliveryTimeSlot struct {
	ID            uuid.UUID  `gorm:"type:uuid;default:uuid_generate_v4();primaryKey" json:"id"`
	SellerID      *uuid.UUID `gorm:"type:uuid" json:"seller_id"` // null = platform-wide
	SlotDate      string     `gorm:"type:date;not null" json:"slot_date"`
	StartTime     string     `gorm:"type:time;not null" json:"start_time"`
	EndTime       string     `gorm:"type:time;not null" json:"end_time"`
	MaxOrders     int        `gorm:"type:int;not null" json:"max_orders"`
	BookedOrders  int        `gorm:"type:int;default:0" json:"booked_orders"`
	PriceModifier float64    `gorm:"type:decimal(10,2);default:0" json:"price_modifier"`
	IsBlocked     bool       `gorm:"type:boolean;default:false" json:"is_blocked"`
	CreatedAt     time.Time  `json:"created_at"`
}

func (dts *DeliveryTimeSlot) BeforeCreate(tx *gorm.DB) error {
	if dts.ID == uuid.Nil {
		dts.ID = uuid.New()
	}
	return nil
}

// Courier represents the couriers table
type Courier struct {
	ID          uuid.UUID  `gorm:"type:uuid;default:uuid_generate_v4();primaryKey" json:"id"`
	UserID      uuid.UUID  `gorm:"type:uuid;not null" json:"user_id"`
	FullName    string     `gorm:"type:varchar(255);not null" json:"full_name"`
	Phone       string     `gorm:"type:varchar(20);not null" json:"phone"`
	VehicleType string     `gorm:"type:varchar(20);not null;default:'car'" json:"vehicle_type"` // bike, car, on_foot
	Status      string     `gorm:"type:varchar(20);not null;default:'offline'" json:"status"`    // available, busy, offline
	CurrentLat  *float64   `gorm:"type:decimal(10,7)" json:"current_lat"`
	CurrentLng  *float64   `gorm:"type:decimal(10,7)" json:"current_lng"`
	LastSeenAt  *time.Time `json:"last_seen_at"`
	CreatedAt   time.Time  `json:"created_at"`

	// Relations
	User *User `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

func (c *Courier) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}

// Delivery represents the deliveries table
type Delivery struct {
	ID            uuid.UUID  `gorm:"type:uuid;default:uuid_generate_v4();primaryKey" json:"id"`
	OrderID       uuid.UUID  `gorm:"type:uuid;not null;uniqueIndex" json:"order_id"`
	CourierID     *uuid.UUID `gorm:"type:uuid" json:"courier_id"`
	ZoneID        *uuid.UUID `gorm:"type:uuid" json:"zone_id"`
	Status        string     `gorm:"type:varchar(20);not null;default:'unassigned'" json:"status"` // unassigned, assigned, picked_up, en_route, delivered, failed
	PickupNotes   string     `gorm:"type:text" json:"pickup_notes"`
	DropoffNotes  string     `gorm:"type:text" json:"dropoff_notes"`
	DeliveryFee   float64    `gorm:"type:decimal(10,2);default:0" json:"delivery_fee"`
	AssignedAt    *time.Time `json:"assigned_at"`
	PickedUpAt    *time.Time `json:"picked_up_at"`
	EnRouteAt     *time.Time `json:"en_route_at"`
	DeliveredAt   *time.Time `json:"delivered_at"`
	FailedAt      *time.Time `json:"failed_at"`
	FailureReason string     `gorm:"type:text" json:"failure_reason"`
	ETA           *time.Time `json:"eta"`

	// Relations
	Order   *Order        `gorm:"foreignKey:OrderID" json:"order,omitempty"`
	Courier *Courier      `gorm:"foreignKey:CourierID" json:"courier,omitempty"`
	Zone    *DeliveryZone `gorm:"foreignKey:ZoneID" json:"zone,omitempty"`
}

func (d *Delivery) BeforeCreate(tx *gorm.DB) error {
	if d.ID == uuid.Nil {
		d.ID = uuid.New()
	}
	return nil
}

// DeliverySLA represents the delivery_slas table
type DeliverySLA struct {
	ID                        uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primaryKey" json:"id"`
	ZoneID                    uuid.UUID `gorm:"type:uuid;not null" json:"zone_id"`
	MaxDeliveryMinutes        int       `gorm:"type:int;not null" json:"max_delivery_minutes"`
	BreachCompensationAmount  float64   `gorm:"type:decimal(10,2);default:0" json:"breach_compensation_amount"`
	IsActive                  bool      `gorm:"type:boolean;default:true" json:"is_active"`

	// Relations
	Zone *DeliveryZone `gorm:"foreignKey:ZoneID" json:"zone,omitempty"`
}

func (ds *DeliverySLA) BeforeCreate(tx *gorm.DB) error {
	if ds.ID == uuid.Nil {
		ds.ID = uuid.New()
	}
	return nil
}

// DeliveryBreach represents the delivery_breaches table
type DeliveryBreach struct {
	ID                 uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primaryKey" json:"id"`
	DeliveryID         uuid.UUID `gorm:"type:uuid;not null" json:"delivery_id"`
	SLAID              uuid.UUID `gorm:"column:sla_id;type:uuid;not null" json:"sla_id"`
	BreachDetectedAt   time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"breach_detected_at"`
	CompensationIssued bool      `gorm:"type:boolean;default:false" json:"compensation_issued"`
	CompensationAmount float64   `gorm:"type:decimal(10,2);default:0" json:"compensation_amount"`

	// Relations
	Delivery *Delivery    `gorm:"foreignKey:DeliveryID" json:"delivery,omitempty"`
	SLA      *DeliverySLA `gorm:"foreignKey:SLAID" json:"sla,omitempty"`
}

func (db *DeliveryBreach) BeforeCreate(tx *gorm.DB) error {
	if db.ID == uuid.Nil {
		db.ID = uuid.New()
	}
	return nil
}
