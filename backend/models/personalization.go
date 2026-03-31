package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// PersonalizationType represents the personalization_types table
type PersonalizationType struct {
	ID                 uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primaryKey" json:"id"`
	Name               string    `gorm:"type:varchar(30);not null" json:"name"` // laser_engraving, 3d_print, custom_card
	DisplayName        string    `gorm:"type:varchar(255);not null" json:"display_name"`
	Description        string    `gorm:"type:text" json:"description"`
	BasePrice          float64   `gorm:"type:decimal(10,2);not null" json:"base_price"`
	MaxTextLength      *int      `gorm:"type:int" json:"max_text_length"`
	AvailableMaterials *string   `gorm:"type:jsonb" json:"available_materials"` // JSONB array
	AvailableColors    *string   `gorm:"type:jsonb" json:"available_colors"`    // JSONB array
	TurnaroundMinutes  *int      `gorm:"type:int" json:"turnaround_minutes"`
	IsActive           bool      `gorm:"type:boolean;default:true" json:"is_active"`

	// Relations
	Templates []PersonalizationTemplate `gorm:"foreignKey:TypeID" json:"templates,omitempty"`
}

func (pt *PersonalizationType) BeforeCreate(tx *gorm.DB) error {
	if pt.ID == uuid.Nil {
		pt.ID = uuid.New()
	}
	return nil
}

// PersonalizationTemplate represents the personalization_templates table
type PersonalizationTemplate struct {
	ID              uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primaryKey" json:"id"`
	TypeID          uuid.UUID `gorm:"type:uuid;not null" json:"type_id"`
	Name            string    `gorm:"type:varchar(255);not null" json:"name"`
	PreviewImageURL string    `gorm:"type:varchar(500)" json:"preview_image_url"`
	Description     string    `gorm:"type:text" json:"description"`
	ExampleText     string    `gorm:"type:varchar(255)" json:"example_text"`
	IsActive        bool      `gorm:"type:boolean;default:true" json:"is_active"`
	SortOrder       int       `gorm:"type:int;default:0" json:"sort_order"`
}

func (pt *PersonalizationTemplate) BeforeCreate(tx *gorm.DB) error {
	if pt.ID == uuid.Nil {
		pt.ID = uuid.New()
	}
	return nil
}

// PersonalizationJob represents the personalization_jobs table
type PersonalizationJob struct {
	ID           uuid.UUID  `gorm:"type:uuid;default:uuid_generate_v4();primaryKey" json:"id"`
	OrderItemID  uuid.UUID  `gorm:"type:uuid;not null" json:"order_item_id"`
	TypeID       uuid.UUID  `gorm:"type:uuid;not null" json:"type_id"`
	TemplateID   *uuid.UUID `gorm:"type:uuid" json:"template_id"`
	InputText    string     `gorm:"type:varchar(500)" json:"input_text"`
	InputFileURL string     `gorm:"type:varchar(500)" json:"input_file_url"`
	Material     string     `gorm:"type:varchar(100)" json:"material"`
	Color        string     `gorm:"type:varchar(100)" json:"color"`
	Status       string     `gorm:"type:varchar(20);not null;default:'pending'" json:"status"` // pending, in_production, completed, failed
	StartedAt    *time.Time `json:"started_at"`
	CompletedAt  *time.Time `json:"completed_at"`
	Notes        string     `gorm:"type:text" json:"notes"`
	CreatedAt    time.Time  `json:"created_at"`

	// Relations
	Type     *PersonalizationType     `gorm:"foreignKey:TypeID" json:"type,omitempty"`
	Template *PersonalizationTemplate `gorm:"foreignKey:TemplateID" json:"template,omitempty"`
}

func (pj *PersonalizationJob) BeforeCreate(tx *gorm.DB) error {
	if pj.ID == uuid.Nil {
		pj.ID = uuid.New()
	}
	return nil
}
