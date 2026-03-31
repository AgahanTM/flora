package services

import (
	"context"

	"gifts-api/models"
	"gifts-api/repository"

	"github.com/google/uuid"
)

type PersonalizationService interface {
	// Catalog
	CreateType(ctx context.Context, pt *models.PersonalizationType) error
	GetTypes(ctx context.Context, activeOnly bool) ([]models.PersonalizationType, error)
	CreateTemplate(ctx context.Context, tmpl *models.PersonalizationTemplate) error
	GetTemplates(ctx context.Context, typeID uuid.UUID, activeOnly bool) ([]models.PersonalizationTemplate, error)

	// Jobs
	CreateJob(ctx context.Context, job *models.PersonalizationJob) error
	GetJob(ctx context.Context, id uuid.UUID) (*models.PersonalizationJob, error)
	UpdateJobStatus(ctx context.Context, jobID uuid.UUID, status string) error // pending -> in_production -> completed/failed
}

type personalizationService struct {
	repo repository.PersonalizationRepository
}

func NewPersonalizationService(repo repository.PersonalizationRepository) PersonalizationService {
	return &personalizationService{repo: repo}
}

func (s *personalizationService) CreateType(ctx context.Context, pt *models.PersonalizationType) error {
	return s.repo.CreateType(ctx, pt)
}

func (s *personalizationService) GetTypes(ctx context.Context, activeOnly bool) ([]models.PersonalizationType, error) {
	return s.repo.GetAllTypes(ctx, activeOnly)
}

func (s *personalizationService) CreateTemplate(ctx context.Context, tmpl *models.PersonalizationTemplate) error {
	return s.repo.CreateTemplate(ctx, tmpl)
}

func (s *personalizationService) GetTemplates(ctx context.Context, typeID uuid.UUID, activeOnly bool) ([]models.PersonalizationTemplate, error) {
	return s.repo.GetTemplatesByTypeID(ctx, typeID, activeOnly)
}

func (s *personalizationService) CreateJob(ctx context.Context, job *models.PersonalizationJob) error {
	job.Status = "pending"
	return s.repo.CreateJob(ctx, job)
}

func (s *personalizationService) GetJob(ctx context.Context, id uuid.UUID) (*models.PersonalizationJob, error) {
	return s.repo.GetJobByID(ctx, id)
}

func (s *personalizationService) UpdateJobStatus(ctx context.Context, jobID uuid.UUID, status string) error {
	return s.repo.UpdateJobStatus(ctx, jobID, status)
}
