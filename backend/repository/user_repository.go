package repository

import (
	"context"
	"errors"

	"gifts-api/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

var ErrUserNotFound = errors.New("user not found")

type UserRepository interface {
	Create(ctx context.Context, user *models.User) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.User, error)
	GetByEmail(ctx context.Context, email string) (*models.User, error)
	GetByPhone(ctx context.Context, phone string) (*models.User, error)
	Update(ctx context.Context, user *models.User) error
	SoftDelete(ctx context.Context, id uuid.UUID) error

	// Profile
	CreateProfile(ctx context.Context, profile *models.UserProfile) error
	GetProfileByUserID(ctx context.Context, userID uuid.UUID) (*models.UserProfile, error)
	UpdateProfile(ctx context.Context, profile *models.UserProfile) error

	// Addresses
	CreateAddress(ctx context.Context, address *models.UserAddress) error
	GetAddressesByUserID(ctx context.Context, userID uuid.UUID) ([]models.UserAddress, error)
	GetAddressByID(ctx context.Context, id uuid.UUID) (*models.UserAddress, error)
	UpdateAddress(ctx context.Context, address *models.UserAddress) error
	DeleteAddress(ctx context.Context, id uuid.UUID) error
	SetDefaultAddress(ctx context.Context, userID, addressID uuid.UUID) error

	// Sessions
	CreateSession(ctx context.Context, session *models.UserSession) error
	GetSessionByRefreshToken(ctx context.Context, tokenHash string) (*models.UserSession, error)
	DeleteSession(ctx context.Context, id uuid.UUID) error
	DeleteUserSessions(ctx context.Context, userID uuid.UUID) error

	// Phone Verification
	CreatePhoneVerification(ctx context.Context, pv *models.PhoneVerification) error
	GetLatestPhoneVerification(ctx context.Context, phone string) (*models.PhoneVerification, error)
	UpdatePhoneVerification(ctx context.Context, pv *models.PhoneVerification) error

	// Password Reset
	CreatePasswordReset(ctx context.Context, pr *models.PasswordReset) error
	GetPasswordResetByToken(ctx context.Context, tokenHash string) (*models.PasswordReset, error)
	UpdatePasswordReset(ctx context.Context, pr *models.PasswordReset) error

	// Notification Preferences
	GetNotificationPreference(ctx context.Context, userID uuid.UUID) (*models.NotificationPreference, error)
	UpsertNotificationPreference(ctx context.Context, pref *models.NotificationPreference) error
	
	GetDB() *gorm.DB
}

type userRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) GetDB() *gorm.DB {
	return r.db
}

func (r *userRepository) Create(ctx context.Context, user *models.User) error {
	return r.db.WithContext(ctx).Create(user).Error
}

func (r *userRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.User, error) {
	var user models.User
	err := r.db.WithContext(ctx).Preload("Profile").First(&user, "id = ?", id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrUserNotFound
	}
	return &user, err
}

func (r *userRepository) GetByEmail(ctx context.Context, email string) (*models.User, error) {
	var user models.User
	err := r.db.WithContext(ctx).Where("email = ?", email).First(&user).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrUserNotFound
	}
	return &user, err
}

func (r *userRepository) GetByPhone(ctx context.Context, phone string) (*models.User, error) {
	var user models.User
	err := r.db.WithContext(ctx).Where("phone = ?", phone).First(&user).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrUserNotFound
	}
	return &user, err
}

func (r *userRepository) Update(ctx context.Context, user *models.User) error {
	return r.db.WithContext(ctx).Save(user).Error
}

func (r *userRepository) SoftDelete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&models.User{}, "id = ?", id).Error
}

// --- Profile ---

func (r *userRepository) CreateProfile(ctx context.Context, profile *models.UserProfile) error {
	return r.db.WithContext(ctx).Create(profile).Error
}

func (r *userRepository) GetProfileByUserID(ctx context.Context, userID uuid.UUID) (*models.UserProfile, error) {
	var profile models.UserProfile
	err := r.db.WithContext(ctx).Where("user_id = ?", userID).First(&profile).Error
	return &profile, err
}

func (r *userRepository) UpdateProfile(ctx context.Context, profile *models.UserProfile) error {
	return r.db.WithContext(ctx).Save(profile).Error
}

// --- Addresses ---

func (r *userRepository) CreateAddress(ctx context.Context, address *models.UserAddress) error {
	return r.db.WithContext(ctx).Create(address).Error
}

func (r *userRepository) GetAddressesByUserID(ctx context.Context, userID uuid.UUID) ([]models.UserAddress, error) {
	var addresses []models.UserAddress
	err := r.db.WithContext(ctx).Where("user_id = ?", userID).Find(&addresses).Error
	return addresses, err
}

func (r *userRepository) GetAddressByID(ctx context.Context, id uuid.UUID) (*models.UserAddress, error) {
	var address models.UserAddress
	err := r.db.WithContext(ctx).First(&address, "id = ?", id).Error
	return &address, err
}

func (r *userRepository) UpdateAddress(ctx context.Context, address *models.UserAddress) error {
	return r.db.WithContext(ctx).Save(address).Error
}

func (r *userRepository) DeleteAddress(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&models.UserAddress{}, "id = ?", id).Error
}

func (r *userRepository) SetDefaultAddress(ctx context.Context, userID, addressID uuid.UUID) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// Unset all defaults for this user
		if err := tx.Model(&models.UserAddress{}).Where("user_id = ?", userID).Update("is_default", false).Error; err != nil {
			return err
		}
		// Set the one
		return tx.Model(&models.UserAddress{}).Where("id = ? AND user_id = ?", addressID, userID).Update("is_default", true).Error
	})
}

// --- Sessions ---

func (r *userRepository) CreateSession(ctx context.Context, session *models.UserSession) error {
	return r.db.WithContext(ctx).Create(session).Error
}

func (r *userRepository) GetSessionByRefreshToken(ctx context.Context, tokenHash string) (*models.UserSession, error) {
	var session models.UserSession
	err := r.db.WithContext(ctx).Where("refresh_token_hash = ?", tokenHash).First(&session).Error
	return &session, err
}

func (r *userRepository) DeleteSession(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&models.UserSession{}, "id = ?", id).Error
}

func (r *userRepository) DeleteUserSessions(ctx context.Context, userID uuid.UUID) error {
	return r.db.WithContext(ctx).Where("user_id = ?", userID).Delete(&models.UserSession{}).Error
}

// --- Phone Verification ---

func (r *userRepository) CreatePhoneVerification(ctx context.Context, pv *models.PhoneVerification) error {
	return r.db.WithContext(ctx).Create(pv).Error
}

func (r *userRepository) GetLatestPhoneVerification(ctx context.Context, phone string) (*models.PhoneVerification, error) {
	var pv models.PhoneVerification
	err := r.db.WithContext(ctx).Where("phone = ?", phone).Order("created_at DESC").First(&pv).Error
	return &pv, err
}

func (r *userRepository) UpdatePhoneVerification(ctx context.Context, pv *models.PhoneVerification) error {
	return r.db.WithContext(ctx).Save(pv).Error
}

// --- Password Reset ---

func (r *userRepository) CreatePasswordReset(ctx context.Context, pr *models.PasswordReset) error {
	return r.db.WithContext(ctx).Create(pr).Error
}

func (r *userRepository) GetPasswordResetByToken(ctx context.Context, tokenHash string) (*models.PasswordReset, error) {
	var pr models.PasswordReset
	err := r.db.WithContext(ctx).Where("token_hash = ?", tokenHash).First(&pr).Error
	return &pr, err
}

func (r *userRepository) UpdatePasswordReset(ctx context.Context, pr *models.PasswordReset) error {
	return r.db.WithContext(ctx).Save(pr).Error
}

// --- Notification Preferences ---

func (r *userRepository) GetNotificationPreference(ctx context.Context, userID uuid.UUID) (*models.NotificationPreference, error) {
	var pref models.NotificationPreference
	err := r.db.WithContext(ctx).Where("user_id = ?", userID).First(&pref).Error
	return &pref, err
}

func (r *userRepository) UpsertNotificationPreference(ctx context.Context, pref *models.NotificationPreference) error {
	return r.db.WithContext(ctx).Save(pref).Error
}
