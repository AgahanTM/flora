package repository

import (
	"context"
	"errors"

	"gifts-api/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

var ErrOccasionNotFound = errors.New("occasion not found")

type OccasionRepository interface {
	// Catalog
	CreateOccasion(ctx context.Context, occasion *models.Occasion) error
	GetOccasionByID(ctx context.Context, id uuid.UUID) (*models.Occasion, error)
	GetOccasionBySlug(ctx context.Context, slug string) (*models.Occasion, error)
	GetAllOccasions(ctx context.Context, activeOnly bool) ([]models.Occasion, error)
	UpdateOccasion(ctx context.Context, occasion *models.Occasion) error

	// Suggestions
	CreateSuggestion(ctx context.Context, suggestion *models.OccasionSuggestion) error
	GetSuggestionsByOccasionID(ctx context.Context, occasionID uuid.UUID) ([]models.OccasionSuggestion, error)
	GetSuggestionByID(ctx context.Context, id uuid.UUID) (*models.OccasionSuggestion, error)
	UpdateSuggestion(ctx context.Context, suggestion *models.OccasionSuggestion) error

	// Gift Builder Sessions
	CreateSession(ctx context.Context, session *models.GiftBuilderSession) error
	GetSessionByID(ctx context.Context, id uuid.UUID) (*models.GiftBuilderSession, error)
	UpdateSession(ctx context.Context, session *models.GiftBuilderSession) error

	// Saved Occasions
	CreateSavedOccasion(ctx context.Context, saved *models.SavedOccasion) error
	GetSavedOccasionsByUserID(ctx context.Context, userID uuid.UUID) ([]models.SavedOccasion, error)
	UpdateSavedOccasion(ctx context.Context, saved *models.SavedOccasion) error
	DeleteSavedOccasion(ctx context.Context, id uuid.UUID) error
	GetUpcomingSavedOccasions(ctx context.Context, days int) ([]models.SavedOccasion, error)
}

type occasionRepository struct {
	db *gorm.DB
}

func NewOccasionRepository(db *gorm.DB) OccasionRepository {
	return &occasionRepository{db: db}
}

// --- Catalog ---

func (r *occasionRepository) CreateOccasion(ctx context.Context, occasion *models.Occasion) error {
	return r.db.WithContext(ctx).Create(occasion).Error
}

func (r *occasionRepository) GetOccasionByID(ctx context.Context, id uuid.UUID) (*models.Occasion, error) {
	var occasion models.Occasion
	err := r.db.WithContext(ctx).First(&occasion, "id = ?", id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrOccasionNotFound
	}
	return &occasion, err
}

func (r *occasionRepository) GetOccasionBySlug(ctx context.Context, slug string) (*models.Occasion, error) {
	var occasion models.Occasion
	err := r.db.WithContext(ctx).Where("slug = ?", slug).First(&occasion).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrOccasionNotFound
	}
	return &occasion, err
}

func (r *occasionRepository) GetAllOccasions(ctx context.Context, activeOnly bool) ([]models.Occasion, error) {
	var occasions []models.Occasion
	q := r.db.WithContext(ctx).Model(&models.Occasion{})
	if activeOnly {
		q = q.Where("is_active = ?", true)
	}
	err := q.Order("sort_order ASC").Find(&occasions).Error
	return occasions, err
}

func (r *occasionRepository) UpdateOccasion(ctx context.Context, occasion *models.Occasion) error {
	return r.db.WithContext(ctx).Save(occasion).Error
}

// --- Suggestions ---

func (r *occasionRepository) CreateSuggestion(ctx context.Context, suggestion *models.OccasionSuggestion) error {
	return r.db.WithContext(ctx).Create(suggestion).Error
}

func (r *occasionRepository) GetSuggestionsByOccasionID(ctx context.Context, occasionID uuid.UUID) ([]models.OccasionSuggestion, error) {
	var suggestions []models.OccasionSuggestion
	err := r.db.WithContext(ctx).Where("occasion_id = ?", occasionID).Order("sort_order ASC").Find(&suggestions).Error
	return suggestions, err
}

func (r *occasionRepository) GetSuggestionByID(ctx context.Context, id uuid.UUID) (*models.OccasionSuggestion, error) {
	var suggestion models.OccasionSuggestion
	err := r.db.WithContext(ctx).First(&suggestion, "id = ?", id).Error
	return &suggestion, err
}

func (r *occasionRepository) UpdateSuggestion(ctx context.Context, suggestion *models.OccasionSuggestion) error {
	return r.db.WithContext(ctx).Save(suggestion).Error
}

// --- Sessions ---

func (r *occasionRepository) CreateSession(ctx context.Context, session *models.GiftBuilderSession) error {
	return r.db.WithContext(ctx).Create(session).Error
}

func (r *occasionRepository) GetSessionByID(ctx context.Context, id uuid.UUID) (*models.GiftBuilderSession, error) {
	var session models.GiftBuilderSession
	err := r.db.WithContext(ctx).Preload("SelectedSuggestion").First(&session, "id = ?", id).Error
	return &session, err
}

func (r *occasionRepository) UpdateSession(ctx context.Context, session *models.GiftBuilderSession) error {
	return r.db.WithContext(ctx).Save(session).Error
}

// --- Saved Occasions ---

func (r *occasionRepository) CreateSavedOccasion(ctx context.Context, saved *models.SavedOccasion) error {
	return r.db.WithContext(ctx).Create(saved).Error
}

func (r *occasionRepository) GetSavedOccasionsByUserID(ctx context.Context, userID uuid.UUID) ([]models.SavedOccasion, error) {
	var saved []models.SavedOccasion
	err := r.db.WithContext(ctx).Where("customer_id = ?", userID).Order("occasion_date ASC").Find(&saved).Error
	return saved, err
}

func (r *occasionRepository) UpdateSavedOccasion(ctx context.Context, saved *models.SavedOccasion) error {
	return r.db.WithContext(ctx).Save(saved).Error
}

func (r *occasionRepository) DeleteSavedOccasion(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&models.SavedOccasion{}, "id = ?", id).Error
}

func (r *occasionRepository) GetUpcomingSavedOccasions(ctx context.Context, days int) ([]models.SavedOccasion, error) {
	// Query for occasions where (occasion_date - today) <= days and haven't been reminded recently
	var saved []models.SavedOccasion
	err := r.db.WithContext(ctx).
		Where("is_active = ?", true).
		Where("(occasion_date - CURRENT_DATE) <= reminder_days_before").
		Where("(occasion_date - CURRENT_DATE) >= 0").
		Where("last_reminded_at IS NULL OR last_reminded_at < CURRENT_DATE - INTERVAL '1 day'").
		Find(&saved).Error
	return saved, err
}
