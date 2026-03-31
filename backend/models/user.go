package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// User represents the users table
type User struct {
	ID           uuid.UUID      `gorm:"type:uuid;default:uuid_generate_v4();primaryKey" json:"id"`
	Email        *string        `gorm:"type:varchar(255);uniqueIndex" json:"email"`
	Phone        *string        `gorm:"type:varchar(20);uniqueIndex" json:"phone"`
	PasswordHash string         `gorm:"type:varchar(255);not null" json:"-"`
	Role         string         `gorm:"type:varchar(20);not null;default:'customer'" json:"role"` // customer, seller, admin, courier
	IsVerified   bool           `gorm:"type:boolean;not null;default:false" json:"is_verified"`
	IsActive     bool           `gorm:"type:boolean;not null;default:true" json:"is_active"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`

	// Relations
	Profile   *UserProfile   `gorm:"foreignKey:UserID" json:"profile,omitempty"`
	Addresses []UserAddress  `gorm:"foreignKey:UserID" json:"addresses,omitempty"`
	Sessions  []UserSession  `gorm:"foreignKey:UserID" json:"sessions,omitempty"`
}

func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
}

// UserProfile represents the user_profiles table
type UserProfile struct {
	ID                uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primaryKey" json:"id"`
	UserID            uuid.UUID `gorm:"type:uuid;not null;uniqueIndex" json:"user_id"`
	FullName          string    `gorm:"type:varchar(255)" json:"full_name"`
	AvatarURL         string    `gorm:"type:varchar(500)" json:"avatar_url"`
	DateOfBirth       *string   `gorm:"type:date" json:"date_of_birth"`
	PreferredLanguage string    `gorm:"type:varchar(10);default:'tk'" json:"preferred_language"`
}

func (up *UserProfile) BeforeCreate(tx *gorm.DB) error {
	if up.ID == uuid.Nil {
		up.ID = uuid.New()
	}
	return nil
}

// UserAddress represents the user_addresses table
type UserAddress struct {
	ID        uuid.UUID      `gorm:"type:uuid;default:uuid_generate_v4();primaryKey" json:"id"`
	UserID    uuid.UUID      `gorm:"type:uuid;not null" json:"user_id"`
	Label     string         `gorm:"type:varchar(100)" json:"label"`
	City      string         `gorm:"type:varchar(100)" json:"city"`
	District  string         `gorm:"type:varchar(100)" json:"district"`
	Street    string         `gorm:"type:varchar(255)" json:"street"`
	Building  string         `gorm:"type:varchar(100)" json:"building"`
	Apartment string         `gorm:"type:varchar(100)" json:"apartment"`
	Lat       *float64       `gorm:"type:decimal(10,7)" json:"lat"`
	Lng       *float64       `gorm:"type:decimal(10,7)" json:"lng"`
	IsDefault bool           `gorm:"type:boolean;default:false" json:"is_default"`
	CreatedAt time.Time      `json:"created_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
}

func (ua *UserAddress) BeforeCreate(tx *gorm.DB) error {
	if ua.ID == uuid.Nil {
		ua.ID = uuid.New()
	}
	return nil
}

// UserSession represents the user_sessions table
type UserSession struct {
	ID               uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primaryKey" json:"id"`
	UserID           uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`
	AccessTokenHash  string    `gorm:"type:text;not null" json:"-"`
	RefreshTokenHash string    `gorm:"type:text;not null" json:"-"`
	DeviceInfo       *string   `gorm:"type:varchar(500)" json:"device_info"`
	IPAddress        string    `gorm:"type:varchar(45)" json:"ip_address"`
	ExpiresAt        time.Time `gorm:"not null" json:"expires_at"`
	CreatedAt        time.Time `json:"created_at"`
}

func (us *UserSession) BeforeCreate(tx *gorm.DB) error {
	if us.ID == uuid.Nil {
		us.ID = uuid.New()
	}
	return nil
}

// PhoneVerification represents the phone_verifications table
type PhoneVerification struct {
	ID         uuid.UUID  `gorm:"type:uuid;default:uuid_generate_v4();primaryKey" json:"id"`
	Phone      string     `gorm:"type:varchar(20);not null" json:"phone"`
	Code       string     `gorm:"type:varchar(6);not null" json:"-"`
	Attempts   int        `gorm:"type:int;default:0" json:"attempts"`
	ExpiresAt  time.Time  `gorm:"not null" json:"expires_at"`
	VerifiedAt *time.Time `json:"verified_at"`
	CreatedAt  time.Time  `json:"created_at"`
}

func (pv *PhoneVerification) BeforeCreate(tx *gorm.DB) error {
	if pv.ID == uuid.Nil {
		pv.ID = uuid.New()
	}
	return nil
}

// PasswordReset represents the password_resets table
type PasswordReset struct {
	ID        uuid.UUID  `gorm:"type:uuid;default:uuid_generate_v4();primaryKey" json:"id"`
	UserID    uuid.UUID  `gorm:"type:uuid;not null" json:"user_id"`
	TokenHash string     `gorm:"type:varchar(255);not null" json:"-"`
	ExpiresAt time.Time  `gorm:"not null" json:"expires_at"`
	UsedAt    *time.Time `json:"used_at"`
	CreatedAt time.Time  `json:"created_at"`
}

func (pr *PasswordReset) BeforeCreate(tx *gorm.DB) error {
	if pr.ID == uuid.Nil {
		pr.ID = uuid.New()
	}
	return nil
}
