package services

import (
	"context"

	"gifts-api/models"
	"gifts-api/repository"

	"github.com/google/uuid"
)

type OccasionService interface {
	// Catalog
	CreateOccasion(ctx context.Context, occasion *models.Occasion) error
	GetCatalog(ctx context.Context) ([]models.Occasion, error)
	GetSuggestions(ctx context.Context, occasionID uuid.UUID) ([]models.OccasionSuggestion, error)

	// Gift Builder
	StartSession(ctx context.Context, customerID *uuid.UUID, occasionID uuid.UUID) (*models.GiftBuilderSession, error)
	GetSession(ctx context.Context, sessionID uuid.UUID) (*models.GiftBuilderSession, error)
	UpdateSessionStep(ctx context.Context, sessionID uuid.UUID, step string) error
	CompleteSession(ctx context.Context, sessionID uuid.UUID) error

	// Saved Occasions
	SaveOccasion(ctx context.Context, saved *models.SavedOccasion) error
	GetSavedOccasions(ctx context.Context, userID uuid.UUID) ([]models.SavedOccasion, error)
}

type occasionService struct {
	repo repository.OccasionRepository
}

func NewOccasionService(repo repository.OccasionRepository) OccasionService {
	return &occasionService{repo: repo}
}

func (s *occasionService) CreateOccasion(ctx context.Context, occasion *models.Occasion) error {
	return s.repo.CreateOccasion(ctx, occasion)
}

func (s *occasionService) GetCatalog(ctx context.Context) ([]models.Occasion, error) {
	return s.repo.GetAllOccasions(ctx, true)
}

func (s *occasionService) GetSuggestions(ctx context.Context, occasionID uuid.UUID) ([]models.OccasionSuggestion, error) {
	return s.repo.GetSuggestionsByOccasionID(ctx, occasionID)
}

func (s *occasionService) StartSession(ctx context.Context, customerID *uuid.UUID, occasionID uuid.UUID) (*models.GiftBuilderSession, error) {
	// Map CurrentStep to SessionData
	sessionData := `{"current_step": "start"}`

	session := &models.GiftBuilderSession{
		CustomerID:  customerID,
		OccasionID:  occasionID,
		SessionData: &sessionData,
	}
	err := s.repo.CreateSession(ctx, session)
	return session, err
}

func (s *occasionService) GetSession(ctx context.Context, sessionID uuid.UUID) (*models.GiftBuilderSession, error) {
	return s.repo.GetSessionByID(ctx, sessionID)
}

func (s *occasionService) UpdateSessionStep(ctx context.Context, sessionID uuid.UUID, step string) error {
	session, err := s.repo.GetSessionByID(ctx, sessionID)
	if err != nil {
		return err
	}
	
	// Simply over-write SessionData for this basic implementation
	sessionData := `{"current_step": "` + step + `"}`
	session.SessionData = &sessionData
	
	return s.repo.UpdateSession(ctx, session)
}

func (s *occasionService) CompleteSession(ctx context.Context, sessionID uuid.UUID) error {
	session, err := s.repo.GetSessionByID(ctx, sessionID)
	if err != nil {
		return err
	}
	
	sessionData := `{"current_step": "completed"}`
	session.SessionData = &sessionData
	
	return s.repo.UpdateSession(ctx, session)
}

func (s *occasionService) SaveOccasion(ctx context.Context, saved *models.SavedOccasion) error {
	return s.repo.CreateSavedOccasion(ctx, saved)
}

func (s *occasionService) GetSavedOccasions(ctx context.Context, userID uuid.UUID) ([]models.SavedOccasion, error) {
	return s.repo.GetSavedOccasionsByUserID(ctx, userID)
}
