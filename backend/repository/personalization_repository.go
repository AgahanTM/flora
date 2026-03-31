package repository

import (
	"context"
	"errors"

	"gifts-api/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

var ErrPersonalizationTypeNotFound = errors.New("personalization type not found")
var ErrPersonalizationTemplateNotFound = errors.New("personalization template not found")
var ErrPersonalizationJobNotFound = errors.New("personalization job not found")

type PersonalizationRepository interface {
	// Types
	CreateType(ctx context.Context, pType *models.PersonalizationType) error
	GetTypeByID(ctx context.Context, id uuid.UUID) (*models.PersonalizationType, error)
	GetAllTypes(ctx context.Context, activeOnly bool) ([]models.PersonalizationType, error)
	UpdateType(ctx context.Context, pType *models.PersonalizationType) error
	DeleteType(ctx context.Context, id uuid.UUID) error

	// Templates
	CreateTemplate(ctx context.Context, tmpl *models.PersonalizationTemplate) error
	GetTemplateByID(ctx context.Context, id uuid.UUID) (*models.PersonalizationTemplate, error)
	GetTemplatesByTypeID(ctx context.Context, typeID uuid.UUID, activeOnly bool) ([]models.PersonalizationTemplate, error)
	UpdateTemplate(ctx context.Context, tmpl *models.PersonalizationTemplate) error
	DeleteTemplate(ctx context.Context, id uuid.UUID) error

	// Jobs
	CreateJob(ctx context.Context, job *models.PersonalizationJob) error
	GetJobByID(ctx context.Context, id uuid.UUID) (*models.PersonalizationJob, error)
	GetJobsByOrderItemID(ctx context.Context, itemID uuid.UUID) ([]models.PersonalizationJob, error)
	UpdateJobStatus(ctx context.Context, jobID uuid.UUID, status string) error
	UpdateJob(ctx context.Context, job *models.PersonalizationJob) error
}

type personalizationRepository struct {
	db *gorm.DB
}

func NewPersonalizationRepository(db *gorm.DB) PersonalizationRepository {
	return &personalizationRepository{db: db}
}

// --- Types ---

func (r *personalizationRepository) CreateType(ctx context.Context, pType *models.PersonalizationType) error {
	return r.db.WithContext(ctx).Create(pType).Error
}

func (r *personalizationRepository) GetTypeByID(ctx context.Context, id uuid.UUID) (*models.PersonalizationType, error) {
	var pType models.PersonalizationType
	err := r.db.WithContext(ctx).First(&pType, "id = ?", id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrPersonalizationTypeNotFound
	}
	return &pType, err
}

func (r *personalizationRepository) GetAllTypes(ctx context.Context, activeOnly bool) ([]models.PersonalizationType, error) {
	var types []models.PersonalizationType
	q := r.db.WithContext(ctx).Model(&models.PersonalizationType{})
	if activeOnly {
		q = q.Where("is_active = ?", true)
	}
	err := q.Preload("Templates").Find(&types).Error
	return types, err
}

func (r *personalizationRepository) UpdateType(ctx context.Context, pType *models.PersonalizationType) error {
	return r.db.WithContext(ctx).Save(pType).Error
}

func (r *personalizationRepository) DeleteType(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&models.PersonalizationType{}, "id = ?", id).Error
}

// --- Templates ---

func (r *personalizationRepository) CreateTemplate(ctx context.Context, tmpl *models.PersonalizationTemplate) error {
	return r.db.WithContext(ctx).Create(tmpl).Error
}

func (r *personalizationRepository) GetTemplateByID(ctx context.Context, id uuid.UUID) (*models.PersonalizationTemplate, error) {
	var tmpl models.PersonalizationTemplate
	err := r.db.WithContext(ctx).First(&tmpl, "id = ?", id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrPersonalizationTemplateNotFound
	}
	return &tmpl, err
}

func (r *personalizationRepository) GetTemplatesByTypeID(ctx context.Context, typeID uuid.UUID, activeOnly bool) ([]models.PersonalizationTemplate, error) {
	var tmpls []models.PersonalizationTemplate
	q := r.db.WithContext(ctx).Where("type_id = ?", typeID)
	if activeOnly {
		q = q.Where("is_active = ?", true)
	}
	err := q.Order("sort_order ASC").Find(&tmpls).Error
	return tmpls, err
}

func (r *personalizationRepository) UpdateTemplate(ctx context.Context, tmpl *models.PersonalizationTemplate) error {
	return r.db.WithContext(ctx).Save(tmpl).Error
}

func (r *personalizationRepository) DeleteTemplate(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&models.PersonalizationTemplate{}, "id = ?", id).Error
}

// --- Jobs ---

func (r *personalizationRepository) CreateJob(ctx context.Context, job *models.PersonalizationJob) error {
	return r.db.WithContext(ctx).Create(job).Error
}

func (r *personalizationRepository) GetJobByID(ctx context.Context, id uuid.UUID) (*models.PersonalizationJob, error) {
	var job models.PersonalizationJob
	err := r.db.WithContext(ctx).Preload("Type").Preload("Template").First(&job, "id = ?", id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrPersonalizationJobNotFound
	}
	return &job, err
}

func (r *personalizationRepository) GetJobsByOrderItemID(ctx context.Context, itemID uuid.UUID) ([]models.PersonalizationJob, error) {
	var jobs []models.PersonalizationJob
	err := r.db.WithContext(ctx).Preload("Type").Preload("Template").Where("order_item_id = ?", itemID).Find(&jobs).Error
	return jobs, err
}

func (r *personalizationRepository) UpdateJobStatus(ctx context.Context, jobID uuid.UUID, status string) error {
	updates := map[string]interface{}{"status": status}
	if status == "in_production" {
		updates["started_at"] = gorm.Expr("CURRENT_TIMESTAMP")
	} else if status == "completed" || status == "failed" {
		updates["completed_at"] = gorm.Expr("CURRENT_TIMESTAMP")
	}
	return r.db.WithContext(ctx).Model(&models.PersonalizationJob{}).Where("id = ?", jobID).Updates(updates).Error
}

func (r *personalizationRepository) UpdateJob(ctx context.Context, job *models.PersonalizationJob) error {
	return r.db.WithContext(ctx).Save(job).Error
}
