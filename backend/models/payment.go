package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Payment represents the payments table
type Payment struct {
	ID            uuid.UUID  `gorm:"type:uuid;default:uuid_generate_v4();primaryKey" json:"id"`
	OrderID       uuid.UUID  `gorm:"type:uuid;not null;uniqueIndex" json:"order_id"`
	Method        string     `gorm:"type:varchar(30);not null" json:"method"` // cash_on_delivery, bank_transfer
	Status        string     `gorm:"type:varchar(20);not null;default:'pending'" json:"status"` // pending, confirmed, failed, refunded
	Amount        float64    `gorm:"type:decimal(10,2);not null" json:"amount"`
	Currency      string     `gorm:"type:varchar(10);default:'TMT'" json:"currency"`
	ReferenceCode *string    `gorm:"type:varchar(100);uniqueIndex" json:"reference_code"`
	ConfirmedAt   *time.Time `json:"confirmed_at"`
	ConfirmedBy   *uuid.UUID `gorm:"type:uuid" json:"confirmed_by"`
	Notes         string     `gorm:"type:text" json:"notes"`
	CreatedAt     time.Time  `json:"created_at"`

	// Relations
	Order        *Order               `gorm:"foreignKey:OrderID" json:"order,omitempty"`
	Transactions []PaymentTransaction `gorm:"foreignKey:PaymentID" json:"transactions,omitempty"`
	Proofs       []BankTransferProof  `gorm:"foreignKey:PaymentID" json:"proofs,omitempty"`
}

func (p *Payment) BeforeCreate(tx *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return nil
}

// PaymentTransaction represents the payment_transactions table
type PaymentTransaction struct {
	ID          uuid.UUID  `gorm:"type:uuid;default:uuid_generate_v4();primaryKey" json:"id"`
	PaymentID   uuid.UUID  `gorm:"type:uuid;not null" json:"payment_id"`
	Type        string     `gorm:"type:varchar(20);not null" json:"type"` // charge, refund, adjustment
	Amount      float64    `gorm:"type:decimal(10,2);not null" json:"amount"`
	PerformedBy *uuid.UUID `gorm:"type:uuid" json:"performed_by"`
	Note        string     `gorm:"type:text" json:"note"`
	CreatedAt   time.Time  `json:"created_at"`
}

func (pt *PaymentTransaction) BeforeCreate(tx *gorm.DB) error {
	if pt.ID == uuid.Nil {
		pt.ID = uuid.New()
	}
	return nil
}

// BankTransferProof represents the bank_transfer_proofs table
type BankTransferProof struct {
	ID         uuid.UUID  `gorm:"type:uuid;default:uuid_generate_v4();primaryKey" json:"id"`
	PaymentID  uuid.UUID  `gorm:"type:uuid;not null" json:"payment_id"`
	ImageURL   string     `gorm:"type:varchar(500);not null" json:"image_url"`
	UploadedBy uuid.UUID  `gorm:"type:uuid;not null" json:"uploaded_by"`
	UploadedAt time.Time  `gorm:"default:CURRENT_TIMESTAMP" json:"uploaded_at"`
	VerifiedAt *time.Time `json:"verified_at"`
	VerifiedBy *uuid.UUID `gorm:"type:uuid" json:"verified_by"`
}

func (btp *BankTransferProof) BeforeCreate(tx *gorm.DB) error {
	if btp.ID == uuid.Nil {
		btp.ID = uuid.New()
	}
	return nil
}

// Refund represents the refunds table
type Refund struct {
	ID          uuid.UUID  `gorm:"type:uuid;default:uuid_generate_v4();primaryKey" json:"id"`
	PaymentID   uuid.UUID  `gorm:"type:uuid;not null" json:"payment_id"`
	OrderID     uuid.UUID  `gorm:"type:uuid;not null" json:"order_id"`
	Amount      float64    `gorm:"type:decimal(10,2);not null" json:"amount"`
	Reason      string     `gorm:"type:text" json:"reason"`
	Status      string     `gorm:"type:varchar(20);not null;default:'pending'" json:"status"` // pending, approved, rejected, completed
	RequestedBy uuid.UUID  `gorm:"type:uuid;not null" json:"requested_by"`
	ProcessedBy *uuid.UUID `gorm:"type:uuid" json:"processed_by"`
	CreatedAt   time.Time  `json:"created_at"`
	CompletedAt *time.Time `json:"completed_at"`

	// Relations
	Payment *Payment `gorm:"foreignKey:PaymentID" json:"payment,omitempty"`
	Order   *Order   `gorm:"foreignKey:OrderID" json:"order,omitempty"`
}

func (r *Refund) BeforeCreate(tx *gorm.DB) error {
	if r.ID == uuid.Nil {
		r.ID = uuid.New()
	}
	return nil
}
