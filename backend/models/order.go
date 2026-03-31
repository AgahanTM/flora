package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Order represents the orders table
type Order struct {
	ID                  uuid.UUID      `gorm:"type:uuid;default:uuid_generate_v4();primaryKey" json:"id"`
	CustomerID          uuid.UUID      `gorm:"type:uuid;not null" json:"customer_id"`
	SellerID            uuid.UUID      `gorm:"type:uuid;not null" json:"seller_id"`
	Status              string         `gorm:"type:varchar(30);not null;default:'pending'" json:"status"`
	Subtotal            float64        `gorm:"type:decimal(10,2);not null" json:"subtotal"`
	DeliveryFee         float64        `gorm:"type:decimal(10,2);default:0" json:"delivery_fee"`
	DiscountAmount      float64        `gorm:"type:decimal(10,2);default:0" json:"discount_amount"`
	TotalPrice          float64        `gorm:"type:decimal(10,2);not null" json:"total_price"`
	PaymentMethod       string         `gorm:"type:varchar(30);not null;default:'cash_on_delivery'" json:"payment_method"`
	PaymentStatus       string         `gorm:"type:varchar(20);not null;default:'pending'" json:"payment_status"`
	DeliveryAddressID   *uuid.UUID     `gorm:"type:uuid" json:"delivery_address_id"`
	DeliveryDate        *string        `gorm:"type:date" json:"delivery_date"`
	TimeSlotID          *uuid.UUID     `gorm:"type:uuid" json:"time_slot_id"`
	SpecialInstructions string         `gorm:"type:text" json:"special_instructions"`
	CancellationReason  string         `gorm:"type:text" json:"cancellation_reason"`
	CancelledBy         *string        `gorm:"type:varchar(20)" json:"cancelled_by"` // customer, seller, admin, system
	PromotionID         *uuid.UUID     `gorm:"type:uuid" json:"promotion_id"`
	CreatedAt           time.Time      `json:"created_at"`
	UpdatedAt           time.Time      `json:"updated_at"`
	DeletedAt           gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`

	// Relations
	Customer        *User              `gorm:"foreignKey:CustomerID" json:"customer,omitempty"`
	Seller          *Seller            `gorm:"foreignKey:SellerID" json:"seller,omitempty"`
	DeliveryAddress *UserAddress       `gorm:"foreignKey:DeliveryAddressID" json:"delivery_address,omitempty"`
	TimeSlot        *DeliveryTimeSlot  `gorm:"foreignKey:TimeSlotID" json:"time_slot,omitempty"`
	Promotion       *Promotion         `gorm:"foreignKey:PromotionID" json:"promotion,omitempty"`
	Items           []OrderItem        `gorm:"foreignKey:OrderID" json:"items,omitempty"`
	Messages        []OrderMessage     `gorm:"foreignKey:OrderID" json:"messages,omitempty"`
	StatusHistory   []OrderStatusHistory `gorm:"foreignKey:OrderID" json:"status_history,omitempty"`
}

func (o *Order) BeforeCreate(tx *gorm.DB) error {
	if o.ID == uuid.Nil {
		o.ID = uuid.New()
	}
	return nil
}

// OrderItem represents the order_items table
type OrderItem struct {
	ID                   uuid.UUID  `gorm:"type:uuid;default:uuid_generate_v4();primaryKey" json:"id"`
	OrderID              uuid.UUID  `gorm:"type:uuid;not null" json:"order_id"`
	ProductID            uuid.UUID  `gorm:"type:uuid;not null" json:"product_id"`
	VariantID            *uuid.UUID `gorm:"type:uuid" json:"variant_id"`
	Quantity             int        `gorm:"type:int;not null" json:"quantity"`
	UnitPrice            float64    `gorm:"type:decimal(10,2);not null" json:"unit_price"`
	Addons               *string    `gorm:"type:jsonb" json:"addons"`
	PersonalizationPrice float64    `gorm:"type:decimal(10,2);default:0" json:"personalization_price"`
	LineTotal            float64    `gorm:"type:decimal(10,2);not null" json:"line_total"`
	ProductSnapshot      *string    `gorm:"type:jsonb" json:"product_snapshot"`
	PersonalizationJobID *uuid.UUID `gorm:"type:uuid" json:"personalization_job_id"`

	// Relations
	Product            *Product            `gorm:"foreignKey:ProductID" json:"product,omitempty"`
	Variant            *ProductVariant     `gorm:"foreignKey:VariantID" json:"variant,omitempty"`
	PersonalizationJob *PersonalizationJob `gorm:"foreignKey:PersonalizationJobID" json:"personalization_job,omitempty"`
}

func (oi *OrderItem) BeforeCreate(tx *gorm.DB) error {
	if oi.ID == uuid.Nil {
		oi.ID = uuid.New()
	}
	return nil
}

// OrderMessage represents the order_messages table
type OrderMessage struct {
	ID          uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primaryKey" json:"id"`
	OrderID     uuid.UUID `gorm:"type:uuid;not null" json:"order_id"`
	MessageText string    `gorm:"type:varchar(200)" json:"message_text"`
	FontStyle   string    `gorm:"type:varchar(100)" json:"font_style"`
	CreatedAt   time.Time `json:"created_at"`
}

func (om *OrderMessage) BeforeCreate(tx *gorm.DB) error {
	if om.ID == uuid.Nil {
		om.ID = uuid.New()
	}
	return nil
}

// OrderStatusHistory represents the order_status_history table
type OrderStatusHistory struct {
	ID        uuid.UUID  `gorm:"type:uuid;default:uuid_generate_v4();primaryKey" json:"id"`
	OrderID   uuid.UUID  `gorm:"type:uuid;not null" json:"order_id"`
	FromStatus *string   `gorm:"type:varchar(50)" json:"from_status"`
	ToStatus  string     `gorm:"type:varchar(50);not null" json:"to_status"`
	ChangedBy *uuid.UUID `gorm:"type:uuid" json:"changed_by"`
	Note      string     `gorm:"type:text" json:"note"`
	CreatedAt time.Time  `json:"created_at"`
}

func (osh *OrderStatusHistory) BeforeCreate(tx *gorm.DB) error {
	if osh.ID == uuid.Nil {
		osh.ID = uuid.New()
	}
	return nil
}
