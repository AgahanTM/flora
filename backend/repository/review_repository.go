package repository

import (
	"context"
	"errors"

	"gifts-api/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

var ErrReviewNotFound = errors.New("review not found")
var ErrIssueReportNotFound = errors.New("issue report not found")

type ReviewRepository interface {
	// Reviews
	CreateReview(ctx context.Context, review *models.Review) error
	GetReviewByID(ctx context.Context, id uuid.UUID) (*models.Review, error)
	GetReviewByOrderID(ctx context.Context, orderID uuid.UUID) (*models.Review, error)
	GetReviewsBySellerID(ctx context.Context, sellerID uuid.UUID, limit, offset int) ([]models.Review, int64, error)
	GetReviewsByProductID(ctx context.Context, productID uuid.UUID, limit, offset int) ([]models.Review, int64, error)
	UpdateReview(ctx context.Context, review *models.Review) error
	DeleteReview(ctx context.Context, id uuid.UUID) error

	// Responses
	CreateResponse(ctx context.Context, response *models.ReviewResponse) error
	GetResponseByReviewID(ctx context.Context, reviewID uuid.UUID) (*models.ReviewResponse, error)

	// Issue Reports
	CreateIssueReport(ctx context.Context, report *models.IssueReport) error
	GetIssueReportByID(ctx context.Context, id uuid.UUID) (*models.IssueReport, error)
	GetIssueReports(ctx context.Context, status string, limit, offset int) ([]models.IssueReport, int64, error)
	UpdateIssueReport(ctx context.Context, report *models.IssueReport) error
}

type reviewRepository struct {
	db *gorm.DB
}

func NewReviewRepository(db *gorm.DB) ReviewRepository {
	return &reviewRepository{db: db}
}

// --- Reviews ---

func (r *reviewRepository) CreateReview(ctx context.Context, review *models.Review) error {
	return r.db.WithContext(ctx).Create(review).Error
}

func (r *reviewRepository) GetReviewByID(ctx context.Context, id uuid.UUID) (*models.Review, error) {
	var review models.Review
	err := r.db.WithContext(ctx).Preload("Response").First(&review, "id = ?", id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrReviewNotFound
	}
	return &review, err
}

func (r *reviewRepository) GetReviewByOrderID(ctx context.Context, orderID uuid.UUID) (*models.Review, error) {
	var review models.Review
	err := r.db.WithContext(ctx).Preload("Response").Where("order_id = ?", orderID).First(&review).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrReviewNotFound
	}
	return &review, err
}

func (r *reviewRepository) GetReviewsBySellerID(ctx context.Context, sellerID uuid.UUID, limit, offset int) ([]models.Review, int64, error) {
	var reviews []models.Review
	var total int64
	q := r.db.WithContext(ctx).Model(&models.Review{}).Where("seller_id = ? AND is_visible = ?", sellerID, true)
	q.Count(&total)
	err := q.Preload("Response").Order("created_at DESC").Limit(limit).Offset(offset).Find(&reviews).Error
	return reviews, total, err
}

func (r *reviewRepository) GetReviewsByProductID(ctx context.Context, productID uuid.UUID, limit, offset int) ([]models.Review, int64, error) {
	var reviews []models.Review
	var total int64
	q := r.db.WithContext(ctx).Model(&models.Review{}).Where("product_id = ? AND is_visible = ?", productID, true)
	q.Count(&total)
	err := q.Preload("Response").Preload("Customer.Profile").Order("created_at DESC").Limit(limit).Offset(offset).Find(&reviews).Error
	return reviews, total, err
}

func (r *reviewRepository) UpdateReview(ctx context.Context, review *models.Review) error {
	return r.db.WithContext(ctx).Save(review).Error
}

func (r *reviewRepository) DeleteReview(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&models.Review{}, "id = ?", id).Error
}

// --- Responses ---

func (r *reviewRepository) CreateResponse(ctx context.Context, response *models.ReviewResponse) error {
	return r.db.WithContext(ctx).Create(response).Error
}

func (r *reviewRepository) GetResponseByReviewID(ctx context.Context, reviewID uuid.UUID) (*models.ReviewResponse, error) {
	var response models.ReviewResponse
	err := r.db.WithContext(ctx).Where("review_id = ?", reviewID).First(&response).Error
	return &response, err
}

// --- Issue Reports ---

func (r *reviewRepository) CreateIssueReport(ctx context.Context, report *models.IssueReport) error {
	return r.db.WithContext(ctx).Create(report).Error
}

func (r *reviewRepository) GetIssueReportByID(ctx context.Context, id uuid.UUID) (*models.IssueReport, error) {
	var report models.IssueReport
	err := r.db.WithContext(ctx).First(&report, "id = ?", id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrIssueReportNotFound
	}
	return &report, err
}

func (r *reviewRepository) GetIssueReports(ctx context.Context, status string, limit, offset int) ([]models.IssueReport, int64, error) {
	var reports []models.IssueReport
	var total int64
	q := r.db.WithContext(ctx).Model(&models.IssueReport{})
	if status != "" {
		q = q.Where("status = ?", status)
	}
	q.Count(&total)
	err := q.Order("created_at DESC").Limit(limit).Offset(offset).Find(&reports).Error
	return reports, total, err
}

func (r *reviewRepository) UpdateIssueReport(ctx context.Context, report *models.IssueReport) error {
	return r.db.WithContext(ctx).Save(report).Error
}
