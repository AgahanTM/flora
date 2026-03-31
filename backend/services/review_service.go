package services

import (
	"context"
	"errors"

	"gifts-api/models"
	"gifts-api/repository"

	"github.com/google/uuid"
)

type ReviewService interface {
	CreateReview(ctx context.Context, review *models.Review) error
	GetProductReviews(ctx context.Context, productID uuid.UUID, offset, limit int) ([]models.Review, int64, error)
	GetSellerReviews(ctx context.Context, sellerID uuid.UUID, offset, limit int) ([]models.Review, int64, error)
	UpdateReview(ctx context.Context, reviewID, customerID uuid.UUID, rating int, comment string) error
	DeleteReview(ctx context.Context, reviewID, customerID uuid.UUID) error
	RespondToReview(ctx context.Context, response *models.ReviewResponse) error
	
	// Issue Reports
	ReportIssue(ctx context.Context, report *models.IssueReport) error
	GetIssueReports(ctx context.Context, status string, limit, offset int) ([]models.IssueReport, int64, error)
	UpdateIssueStatus(ctx context.Context, reportID uuid.UUID, status string) error
}

type reviewService struct {
	repo repository.ReviewRepository
}

func NewReviewService(repo repository.ReviewRepository) ReviewService {
	return &reviewService{repo: repo}
}

func (s *reviewService) CreateReview(ctx context.Context, review *models.Review) error {
	// Check if already reviewed
	if review.OrderID != nil {
		existing, _ := s.repo.GetReviewByOrderID(ctx, *review.OrderID)
		if existing != nil {
			return errors.New("order already reviewed")
		}
	}
	review.IsVisible = true
	return s.repo.CreateReview(ctx, review)
}

func (s *reviewService) GetProductReviews(ctx context.Context, productID uuid.UUID, offset, limit int) ([]models.Review, int64, error) {
	return s.repo.GetReviewsByProductID(ctx, productID, limit, offset)
}

func (s *reviewService) GetSellerReviews(ctx context.Context, sellerID uuid.UUID, offset, limit int) ([]models.Review, int64, error) {
	return s.repo.GetReviewsBySellerID(ctx, sellerID, limit, offset)
}

func (s *reviewService) UpdateReview(ctx context.Context, reviewID, customerID uuid.UUID, rating int, comment string) error {
	review, err := s.repo.GetReviewByID(ctx, reviewID)
	if err != nil {
		return err
	}
	if review.CustomerID != customerID {
		return errors.New("unauthorized to update this review")
	}
	review.Rating = rating
	review.Comment = comment
	return s.repo.UpdateReview(ctx, review)
}

func (s *reviewService) DeleteReview(ctx context.Context, reviewID, customerID uuid.UUID) error {
	review, err := s.repo.GetReviewByID(ctx, reviewID)
	if err != nil {
		return err
	}
	if review.CustomerID != customerID {
		return errors.New("unauthorized to delete this review")
	}
	return s.repo.DeleteReview(ctx, reviewID)
}

func (s *reviewService) RespondToReview(ctx context.Context, response *models.ReviewResponse) error {
	return s.repo.CreateResponse(ctx, response)
}

func (s *reviewService) ReportIssue(ctx context.Context, report *models.IssueReport) error {
	report.Status = "open"
	return s.repo.CreateIssueReport(ctx, report)
}

func (s *reviewService) GetIssueReports(ctx context.Context, status string, limit, offset int) ([]models.IssueReport, int64, error) {
	return s.repo.GetIssueReports(ctx, status, limit, offset)
}

func (s *reviewService) UpdateIssueStatus(ctx context.Context, reportID uuid.UUID, status string) error {
	report, err := s.repo.GetIssueReportByID(ctx, reportID)
	if err != nil {
		return err
	}
	report.Status = status
	return s.repo.UpdateIssueReport(ctx, report)
}
