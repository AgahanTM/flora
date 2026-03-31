package services

import (
	"context"
	"time"

	"gifts-api/models"
	"gifts-api/repository"

	"github.com/google/uuid"
)

type SubscriptionService interface {
	// Plans
	CreatePlan(ctx context.Context, plan *models.SubscriptionPlan) error
	GetActivePlans(ctx context.Context) ([]models.SubscriptionPlan, error)

	// User Subscriptions
	Subscribe(ctx context.Context, sub *models.Subscription) error
	GetSubscriptions(ctx context.Context, customerID uuid.UUID) ([]models.Subscription, error)
	PauseSubscription(ctx context.Context, subID uuid.UUID) error
	CancelSubscription(ctx context.Context, subID uuid.UUID) error
	ResumeSubscription(ctx context.Context, subID uuid.UUID) error

	// Deliveries
	ScheduleDeliveries(ctx context.Context, subID uuid.UUID, dates []string) error
	ProcessDelivery(ctx context.Context, deliveryID uuid.UUID, status string) error
}

type subscriptionService struct {
	repo repository.SubscriptionRepository
}

func NewSubscriptionService(repo repository.SubscriptionRepository) SubscriptionService {
	return &subscriptionService{repo: repo}
}

// --- Plans ---
func (s *subscriptionService) CreatePlan(ctx context.Context, plan *models.SubscriptionPlan) error {
	return s.repo.CreatePlan(ctx, plan)
}

func (s *subscriptionService) GetActivePlans(ctx context.Context) ([]models.SubscriptionPlan, error) {
	return s.repo.GetAllPlans(ctx, true)
}

// --- Subscriptions ---
func (s *subscriptionService) Subscribe(ctx context.Context, sub *models.Subscription) error {
	sub.Status = "active"
	return s.repo.CreateSubscription(ctx, sub)
}

func (s *subscriptionService) GetSubscriptions(ctx context.Context, customerID uuid.UUID) ([]models.Subscription, error) {
	return s.repo.GetSubscriptionsByCustomerID(ctx, customerID)
}

func (s *subscriptionService) PauseSubscription(ctx context.Context, subID uuid.UUID) error {
	sub, err := s.repo.GetSubscriptionByID(ctx, subID)
	if err != nil {
		return err
	}
	sub.Status = "paused"
	return s.repo.UpdateSubscription(ctx, sub)
}

func (s *subscriptionService) CancelSubscription(ctx context.Context, subID uuid.UUID) error {
	sub, err := s.repo.GetSubscriptionByID(ctx, subID)
	if err != nil {
		return err
	}
	sub.Status = "cancelled"
	return s.repo.UpdateSubscription(ctx, sub)
}

func (s *subscriptionService) ResumeSubscription(ctx context.Context, subID uuid.UUID) error {
	sub, err := s.repo.GetSubscriptionByID(ctx, subID)
	if err != nil {
		return err
	}
	sub.Status = "active"
	return s.repo.UpdateSubscription(ctx, sub)
}

func (s *subscriptionService) ScheduleDeliveries(ctx context.Context, subID uuid.UUID, dates []string) error {
	for _, date := range dates {
		delivery := &models.SubscriptionDelivery{
			SubscriptionID: subID,
			ScheduledDate:  date,
			Status:         "scheduled",
		}
		if err := s.repo.AddDelivery(ctx, delivery); err != nil {
			return err
		}
	}
	return nil
}

func (s *subscriptionService) ProcessDelivery(ctx context.Context, deliveryID uuid.UUID, status string) error {
	if err := s.repo.UpdateDeliveryStatus(ctx, deliveryID, status); err != nil {
		return err
	}

	if status == "completed" {
		delivery, err := s.repo.GetDeliveryByID(ctx, deliveryID)
		if err != nil {
			return err
		}

		sub, err := s.repo.GetSubscriptionByID(ctx, delivery.SubscriptionID)
		if err != nil {
			return err
		}

		nowDate := time.Now().Format("2006-01-02")
		sub.LastDeliveryDate = &nowDate

		// Calculate next delivery date based on frequency
		var nextDate time.Time
		if sub.NextDeliveryDate != nil {
			parsed, _ := time.Parse("2006-01-02", *sub.NextDeliveryDate)
			nextDate = parsed
		} else {
			nextDate = time.Now()
		}

		switch sub.Plan.Frequency {
		case "weekly":
			nextDate = nextDate.AddDate(0, 0, 7)
		case "biweekly":
			nextDate = nextDate.AddDate(0, 0, 14)
		case "monthly":
			nextDate = nextDate.AddDate(0, 1, 0)
		}

		nextStr := nextDate.Format("2006-01-02")
		sub.NextDeliveryDate = &nextStr

		return s.repo.UpdateSubscription(ctx, sub)
	}

	return nil
}
