package services

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"math/big"
	"time"

	"gifts-api/config"
	"gifts-api/models"
	"gifts-api/repository"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

var (
	ErrInvalidCredentials  = errors.New("invalid credentials")
	ErrUserNotVerified     = errors.New("user is not verified")
	ErrUserInactive        = errors.New("user is inactive")
	ErrInvalidToken        = errors.New("invalid or expired token")
	ErrOTPInvalidOrExpired = errors.New("OTP invalid or expired")
	ErrTooManyAttempts     = errors.New("too many OTP attempts")
	ErrEmailExists         = errors.New("email already registered")
	ErrPhoneExists         = errors.New("phone already registered")
)

type AuthService interface {
	RegisterWithPhone(ctx context.Context, phone, password, fullName string) (*models.User, error)
	Login(ctx context.Context, identifier, password, ipAddress, deviceInfo string) (string, string, error) // returns accessToken, refreshToken
	Refresh(ctx context.Context, refreshToken string) (string, string, error)
	Logout(ctx context.Context, refreshToken string) error
	
	SendPhoneOTP(ctx context.Context, phone string) error
	VerifyPhoneOTP(ctx context.Context, phone, code string) error
	
	RequestPasswordReset(ctx context.Context, email string) error
	ConfirmPasswordReset(ctx context.Context, token, newPassword string) error

	GetUserProfile(ctx context.Context, userID uuid.UUID) (*models.User, error)
	UpdateProfile(ctx context.Context, userID uuid.UUID, profile *models.UserProfile) error
	
	// Address
	AddAddress(ctx context.Context, address *models.UserAddress) error
	GetAddresses(ctx context.Context, userID uuid.UUID) ([]models.UserAddress, error)
	UpdateAddress(ctx context.Context, userID uuid.UUID, addressID uuid.UUID, updates *models.UserAddress) error
	SetDefaultAddress(ctx context.Context, userID, addressID uuid.UUID) error
	DeleteAddress(ctx context.Context, addressID uuid.UUID) error
}

type authService struct {
	repo repository.UserRepository
	cfg  *config.AppConfig
}

func NewAuthService(repo repository.UserRepository, cfg *config.AppConfig) AuthService {
	return &authService{repo: repo, cfg: cfg}
}

// GenerateOTP generates a random 6-digit string
func generateOTP() string {
	max := big.NewInt(1000000)
	n, _ := rand.Int(rand.Reader, max)
	return fmt.Sprintf("%06d", n.Int64())
}

func (s *authService) RegisterWithPhone(ctx context.Context, phone, password, fullName string) (*models.User, error) {
	// Check if phone exists
	_, err := s.repo.GetByPhone(ctx, phone)
	if err == nil {
		return nil, ErrPhoneExists
	}
	if !errors.Is(err, repository.ErrUserNotFound) {
		return nil, err
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	user := &models.User{
		Phone:        &phone,
		PasswordHash: string(hashedPassword),
		Role:         "customer",
		IsVerified:   false,
		IsActive:     true,
	}

	err = s.repo.GetDB().WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(user).Error; err != nil {
			return err
		}
		profile := &models.UserProfile{
			UserID:   user.ID,
			FullName: fullName,
		}
		if err := tx.Create(profile).Error; err != nil {
			return err
		}
		user.Profile = profile
		return nil
	})

	if err != nil {
		return nil, err
	}

	// Auto-send OTP (could be done strictly asynchronously)
	_ = s.SendPhoneOTP(ctx, phone)

	return user, nil
}

func (s *authService) Login(ctx context.Context, identifier, password, ipAddress, deviceInfo string) (string, string, error) {
	var user *models.User
	var err error

	// Try phone then email
	user, err = s.repo.GetByPhone(ctx, identifier)
	if errors.Is(err, repository.ErrUserNotFound) {
		user, err = s.repo.GetByEmail(ctx, identifier)
	}
	if err != nil {
		if errors.Is(err, repository.ErrUserNotFound) {
			return "", "", ErrInvalidCredentials
		}
		return "", "", err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return "", "", ErrInvalidCredentials
	}

	if !user.IsActive {
		return "", "", ErrUserInactive
	}
	if !user.IsVerified {
		return "", "", ErrUserNotVerified
	}

	return s.generateAndStoreTokens(ctx, user, ipAddress, deviceInfo)
}

func sha256Hash(s string) string {
	h := sha256.Sum256([]byte(s))
	return hex.EncodeToString(h[:])
}

func (s *authService) generateAndStoreTokens(ctx context.Context, user *models.User, ipAddress, deviceInfo string) (string, string, error) {
	accessTokenClaims := jwt.MapClaims{
		"user_id": user.ID.String(),
		"role":    user.Role,
		"exp":     time.Now().Add(15 * time.Minute).Unix(),
	}
	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, accessTokenClaims)
	accessString, err := accessToken.SignedString([]byte(s.cfg.JWTSecret))
	if err != nil {
		return "", "", err
	}

	refreshTokenClaims := jwt.MapClaims{
		"user_id": user.ID.String(),
		"exp":     time.Now().Add(30 * 24 * time.Hour).Unix(),
		"type":    "refresh",
	}
	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshTokenClaims)
	refreshString, err := refreshToken.SignedString([]byte(s.cfg.JWTSecret))
	if err != nil {
		return "", "", err
	}

	devInfo := deviceInfo
	session := &models.UserSession{
		UserID:           user.ID,
		AccessTokenHash:  sha256Hash(accessString),
		RefreshTokenHash: sha256Hash(refreshString),
		IPAddress:        ipAddress,
		DeviceInfo:       &devInfo,
		ExpiresAt:        time.Now().Add(30 * 24 * time.Hour),
	}
	if err := s.repo.CreateSession(ctx, session); err != nil {
		return "", "", err
	}

	return accessString, refreshString, nil
}

func (s *authService) Refresh(ctx context.Context, refreshToken string) (string, string, error) {
	session, err := s.repo.GetSessionByRefreshToken(ctx, sha256Hash(refreshToken))
	if err != nil || session.ExpiresAt.Before(time.Now()) {
		return "", "", ErrInvalidToken
	}

	// Validate JWT
	token, err := jwt.Parse(refreshToken, func(token *jwt.Token) (interface{}, error) {
		return []byte(s.cfg.JWTSecret), nil
	})
	if err != nil || !token.Valid {
		return "", "", ErrInvalidToken
	}

	user, err := s.repo.GetByID(ctx, session.UserID)
	if err != nil {
		return "", "", err
	}

	if !user.IsActive {
		return "", "", ErrUserInactive
	}

	// Invalidate old session
	_ = s.repo.DeleteSession(ctx, session.ID)

	devInfo := ""
	if session.DeviceInfo != nil {
		devInfo = *session.DeviceInfo
	}
	return s.generateAndStoreTokens(ctx, user, session.IPAddress, devInfo)
}

func (s *authService) Logout(ctx context.Context, refreshToken string) error {
	session, err := s.repo.GetSessionByRefreshToken(ctx, sha256Hash(refreshToken))
	if err == nil {
		return s.repo.DeleteSession(ctx, session.ID)
	}
	return nil
}

func (s *authService) SendPhoneOTP(ctx context.Context, phone string) error {
	otp := generateOTP()
	hashedOTP, err := bcrypt.GenerateFromPassword([]byte(otp), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	pv := &models.PhoneVerification{
		Phone:     phone,
		Code:      string(hashedOTP),
		ExpiresAt: time.Now().Add(5 * time.Minute),
	}
	if err := s.repo.CreatePhoneVerification(ctx, pv); err != nil {
		return err
	}

	// TODO: Integrate actual SMS gateway (NotificationService)
	fmt.Printf("MOCK SMS to %s: Your OTP is %s\n", phone, otp)
	return nil
}

func (s *authService) VerifyPhoneOTP(ctx context.Context, phone, code string) error {
	pv, err := s.repo.GetLatestPhoneVerification(ctx, phone)
	if err != nil || pv.VerifiedAt != nil || pv.ExpiresAt.Before(time.Now()) {
		return ErrOTPInvalidOrExpired
	}

	if pv.Attempts >= 3 {
		return ErrTooManyAttempts
	}

	if bcryptErr := bcrypt.CompareHashAndPassword([]byte(pv.Code), []byte(code)); bcryptErr != nil {
		pv.Attempts++
		_ = s.repo.UpdatePhoneVerification(ctx, pv)
		return ErrOTPInvalidOrExpired
	}

	now := time.Now()
	pv.VerifiedAt = &now
	_ = s.repo.UpdatePhoneVerification(ctx, pv)

	// Verify the user
	user, err := s.repo.GetByPhone(ctx, phone)
	if err == nil && !user.IsVerified {
		user.IsVerified = true
		_ = s.repo.Update(ctx, user)
	}

	return nil
}

func (s *authService) RequestPasswordReset(ctx context.Context, email string) error {
	user, err := s.repo.GetByEmail(ctx, email)
	if err != nil {
		// Don't leak existence
		return nil
	}

	token := uuid.New().String()
	tokenHash := sha256Hash(token)
	pr := &models.PasswordReset{
		UserID:    user.ID,
		TokenHash: tokenHash,
		ExpiresAt: time.Now().Add(1 * time.Hour),
	}
	if err := s.repo.CreatePasswordReset(ctx, pr); err != nil {
		return err
	}

	fmt.Printf("MOCK EMAIL to %s: Reset token: %s\n", email, token)
	return nil
}

func (s *authService) ConfirmPasswordReset(ctx context.Context, token, newPassword string) error {
	tokenHash := sha256Hash(token)
	pr, err := s.repo.GetPasswordResetByToken(ctx, tokenHash)
	if err != nil || pr.UsedAt != nil || pr.ExpiresAt.Before(time.Now()) {
		return ErrInvalidToken
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	user, err := s.repo.GetByID(ctx, pr.UserID)
	if err != nil {
		return err
	}

	user.PasswordHash = string(hashed)
	if err := s.repo.Update(ctx, user); err != nil {
		return err
	}

	now := time.Now()
	pr.UsedAt = &now
	_ = s.repo.UpdatePasswordReset(ctx, pr)

	// Invalidate all active sessions for security
	_ = s.repo.DeleteUserSessions(ctx, user.ID)

	return nil
}

func (s *authService) GetUserProfile(ctx context.Context, userID uuid.UUID) (*models.User, error) {
	return s.repo.GetByID(ctx, userID)
}

func (s *authService) UpdateProfile(ctx context.Context, userID uuid.UUID, profile *models.UserProfile) error {
	profile.UserID = userID
	
	// Check if profile exists
	existing, err := s.repo.GetProfileByUserID(ctx, userID)
	if err != nil { // Not found
		return s.repo.CreateProfile(ctx, profile)
	}
	
	profile.ID = existing.ID
	return s.repo.UpdateProfile(ctx, profile)
}

func (s *authService) AddAddress(ctx context.Context, address *models.UserAddress) error {
	// If first address, make it default
	addrs, _ := s.repo.GetAddressesByUserID(ctx, address.UserID)
	if len(addrs) == 0 {
		address.IsDefault = true
	}
	return s.repo.CreateAddress(ctx, address)
}

func (s *authService) GetAddresses(ctx context.Context, userID uuid.UUID) ([]models.UserAddress, error) {
	return s.repo.GetAddressesByUserID(ctx, userID)
}

func (s *authService) UpdateAddress(ctx context.Context, userID uuid.UUID, addressID uuid.UUID, updates *models.UserAddress) error {
	updates.ID = addressID
	updates.UserID = userID
	// Usually verify ownership first, simplified here
	return s.repo.UpdateAddress(ctx, updates)
}

func (s *authService) SetDefaultAddress(ctx context.Context, userID, addressID uuid.UUID) error {
	return s.repo.SetDefaultAddress(ctx, userID, addressID)
}

func (s *authService) DeleteAddress(ctx context.Context, addressID uuid.UUID) error {
	return s.repo.DeleteAddress(ctx, addressID)
}
