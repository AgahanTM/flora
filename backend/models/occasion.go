package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Occasion represents the occasions catalog table
type Occasion struct {
	ID          uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primaryKey" json:"id"`
	Name        string    `gorm:"type:varchar(255);not null" json:"name"`
	Slug        string    `gorm:"type:varchar(255);uniqueIndex;not null" json:"slug"`
	IconURL     string    `gorm:"type:varchar(500)" json:"icon_url"`
	Description string    `gorm:"type:text" json:"description"`
	IsActive    bool      `gorm:"type:boolean;default:true" json:"is_active"`
	SortOrder   int       `gorm:"type:int;default:0" json:"sort_order"`

	// Relations
	Suggestions []OccasionSuggestion `gorm:"foreignKey:OccasionID" json:"suggestions,omitempty"`
}

func (o *Occasion) BeforeCreate(tx *gorm.DB) error {
	if o.ID == uuid.Nil {
		o.ID = uuid.New()
	}
	return nil
}

// OccasionSuggestion represents the occasion_suggestions table
type OccasionSuggestion struct {
	ID                    uuid.UUID  `gorm:"type:uuid;default:uuid_generate_v4();primaryKey" json:"id"`
	OccasionID            uuid.UUID  `gorm:"type:uuid;not null" json:"occasion_id"`
	Title                 string     `gorm:"type:varchar(255);not null" json:"title"`
	Description           string     `gorm:"type:text" json:"description"`
	MinBudget             *float64   `gorm:"type:decimal(10,2)" json:"min_budget"`
	MaxBudget             *float64   `gorm:"type:decimal(10,2)" json:"max_budget"`
	ProductIDs            *string    `gorm:"type:jsonb" json:"product_ids"`  // JSONB array
	AddonIDs              *string    `gorm:"type:jsonb" json:"addon_ids"`    // JSONB array
	SuggestedMessage      string     `gorm:"type:text" json:"suggested_message"`
	PersonalizationTypeID *uuid.UUID `gorm:"type:uuid" json:"personalization_type_id"`
	PreviewImageURL       string     `gorm:"type:varchar(500)" json:"preview_image_url"`
	IsFeatured            bool       `gorm:"type:boolean;default:false" json:"is_featured"`
	SortOrder             int        `gorm:"type:int;default:0" json:"sort_order"`

	// Relations
	Occasion            *Occasion            `gorm:"foreignKey:OccasionID" json:"occasion,omitempty"`
	PersonalizationType *PersonalizationType `gorm:"foreignKey:PersonalizationTypeID" json:"personalization_type,omitempty"`
}

func (os *OccasionSuggestion) BeforeCreate(tx *gorm.DB) error {
	if os.ID == uuid.Nil {
		os.ID = uuid.New()
	}
	return nil
}

// GiftBuilderSession represents the gift_builder_sessions table
type GiftBuilderSession struct {
	ID                   uuid.UUID  `gorm:"type:uuid;default:uuid_generate_v4();primaryKey" json:"id"`
	CustomerID           *uuid.UUID `gorm:"type:uuid" json:"customer_id"` // nullable for anonymous
	OccasionID           uuid.UUID  `gorm:"type:uuid;not null" json:"occasion_id"`
	Budget               *float64   `gorm:"type:decimal(10,2)" json:"budget"`
	SelectedSuggestionID *uuid.UUID `gorm:"type:uuid" json:"selected_suggestion_id"`
	CustomMessage        string     `gorm:"type:text" json:"custom_message"`
	RecipientName        string     `gorm:"type:varchar(255)" json:"recipient_name"`
	PersonalizationInput string     `gorm:"type:text" json:"personalization_input"`
	SessionData          *string    `gorm:"type:jsonb" json:"session_data"`
	ConvertedToOrderID   *uuid.UUID `gorm:"type:uuid" json:"converted_to_order_id"`
	CreatedAt            time.Time  `json:"created_at"`
	ExpiresAt            *time.Time `json:"expires_at"`

	// Relations
	Customer           *User               `gorm:"foreignKey:CustomerID" json:"customer,omitempty"`
	Occasion           *Occasion           `gorm:"foreignKey:OccasionID" json:"occasion,omitempty"`
	SelectedSuggestion *OccasionSuggestion `gorm:"foreignKey:SelectedSuggestionID" json:"selected_suggestion,omitempty"`
}

func (gbs *GiftBuilderSession) BeforeCreate(tx *gorm.DB) error {
	if gbs.ID == uuid.Nil {
		gbs.ID = uuid.New()
	}
	return nil
}

// SavedOccasion represents the saved_occasions table
type SavedOccasion struct {
	ID                 uuid.UUID  `gorm:"type:uuid;default:uuid_generate_v4();primaryKey" json:"id"`
	CustomerID         uuid.UUID  `gorm:"type:uuid;not null" json:"customer_id"`
	OccasionName       string     `gorm:"type:varchar(255);not null" json:"occasion_name"`
	RecipientName      string     `gorm:"type:varchar(255)" json:"recipient_name"`
	OccasionDate       string     `gorm:"type:date;not null" json:"occasion_date"`
	ReminderDaysBefore int        `gorm:"type:int;default:3" json:"reminder_days_before"`
	Notes              string     `gorm:"type:text" json:"notes"`
	IsActive           bool       `gorm:"type:boolean;default:true" json:"is_active"`
	LastRemindedAt     *time.Time `json:"last_reminded_at"`
	CreatedAt          time.Time  `json:"created_at"`

	// Relations
	Customer *User `gorm:"foreignKey:CustomerID" json:"customer,omitempty"`
}

func (so *SavedOccasion) BeforeCreate(tx *gorm.DB) error {
	if so.ID == uuid.Nil {
		so.ID = uuid.New()
	}
	return nil
}
