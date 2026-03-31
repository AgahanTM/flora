package repository

import (
	"context"

	"gifts-api/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type SubscriptionRepository interface {
	// Plans
	CreatePlan(ctx context.Context, plan *models.SubscriptionPlan) error
	GetPlanByID(ctx context.Context, id uuid.UUID) (*models.SubscriptionPlan, error)
	GetAllPlans(ctx context.Context, activeOnly bool) ([]models.SubscriptionPlan, error)
	UpdatePlan(ctx context.Context, plan *models.SubscriptionPlan) error

	// Subscriptions
	CreateSubscription(ctx context.Context, sub *models.Subscription) error
	GetSubscriptionByID(ctx context.Context, id uuid.UUID) (*models.Subscription, error)
	GetSubscriptionsByCustomerID(ctx context.Context, customerID uuid.UUID) ([]models.Subscription, error)
	GetSubscriptionsBySellerID(ctx context.Context, sellerID uuid.UUID, status string) ([]models.Subscription, error)
	UpdateSubscription(ctx context.Context, sub *models.Subscription) error

	// Deliveries
	AddDelivery(ctx context.Context, delivery *models.SubscriptionDelivery) error
	GetDeliveryByID(ctx context.Context, id uuid.UUID) (*models.SubscriptionDelivery, error)
	GetDeliveriesBySubscriptionID(ctx context.Context, subID uuid.UUID) ([]models.SubscriptionDelivery, error)
	UpdateDeliveryStatus(ctx context.Context, deliveryID uuid.UUID, status string) error
	GetDueDeliveries(ctx context.Context, date string) ([]models.SubscriptionDelivery, error)
}

type subscriptionRepository struct {
	db *gorm.DB
}

func NewSubscriptionRepository(db *gorm.DB) SubscriptionRepository {
	return &subscriptionRepository{db: db}
}

// --- Plans ---
func (r *subscriptionRepository) CreatePlan(ctx context.Context, plan *models.SubscriptionPlan) error {
	return r.db.WithContext(ctx).Create(plan).Error
}

func (r *subscriptionRepository) GetPlanByID(ctx context.Context, id uuid.UUID) (*models.SubscriptionPlan, error) {
	var plan models.SubscriptionPlan
	err := r.db.WithContext(ctx).First(&plan, "id = ?", id).Error
	return &plan, err
}

func (r *subscriptionRepository) GetAllPlans(ctx context.Context, activeOnly bool) ([]models.SubscriptionPlan, error) {
	var plans []models.SubscriptionPlan
	q := r.db.WithContext(ctx).Model(&models.SubscriptionPlan{})
	if activeOnly {
		q = q.Where("is_active = ?", true)
	}
	err := q.Order("sort_order ASC").Find(&plans).Error
	return plans, err
}

func (r *subscriptionRepository) UpdatePlan(ctx context.Context, plan *models.SubscriptionPlan) error {
	return r.db.WithContext(ctx).Save(plan).Error
}

// --- Subscriptions ---
func (r *subscriptionRepository) CreateSubscription(ctx context.Context, sub *models.Subscription) error {
	return r.db.WithContext(ctx).Create(sub).Error
}

func (r *subscriptionRepository) GetSubscriptionByID(ctx context.Context, id uuid.UUID) (*models.Subscription, error) {
	var sub models.Subscription
	err := r.db.WithContext(ctx).Preload("Plan").Preload("DeliveryAddress").First(&sub, "id = ?", id).Error
	return &sub, err
}

func (r *subscriptionRepository) GetSubscriptionsByCustomerID(ctx context.Context, customerID uuid.UUID) ([]models.Subscription, error) {
	var subs []models.Subscription
	err := r.db.WithContext(ctx).Preload("Plan").Where("customer_id = ?", customerID).Order("created_at DESC").Find(&subs).Error
	return subs, err
}

func (r *subscriptionRepository) GetSubscriptionsBySellerID(ctx context.Context, sellerID uuid.UUID, status string) ([]models.Subscription, error) {
	var subs []models.Subscription
	q := r.db.WithContext(ctx).Preload("Plan").Preload("Customer").Where("seller_id = ?", sellerID)
	if status != "" {
		q = q.Where("status = ?", status)
	}
	err := q.Order("created_at DESC").Find(&subs).Error
	return subs, err
}

func (r *subscriptionRepository) UpdateSubscription(ctx context.Context, sub *models.Subscription) error {
	return r.db.WithContext(ctx).Save(sub).Error
}

// --- Deliveries ---
func (r *subscriptionRepository) AddDelivery(ctx context.Context, delivery *models.SubscriptionDelivery) error {
	return r.db.WithContext(ctx).Create(delivery).Error
}

func (r *subscriptionRepository) GetDeliveryByID(ctx context.Context, id uuid.UUID) (*models.SubscriptionDelivery, error) {
	var delivery models.SubscriptionDelivery
	err := r.db.WithContext(ctx).First(&delivery, "id = ?", id).Error
	return &delivery, err
}

func (r *subscriptionRepository) GetDeliveriesBySubscriptionID(ctx context.Context, subID uuid.UUID) ([]models.SubscriptionDelivery, error) {
	var deliveries []models.SubscriptionDelivery
	err := r.db.WithContext(ctx).Where("subscription_id = ?", subID).Order("scheduled_date DESC").Find(&deliveries).Error
	return deliveries, err
}

func (r *subscriptionRepository) UpdateDeliveryStatus(ctx context.Context, deliveryID uuid.UUID, status string) error {
	return r.db.WithContext(ctx).Model(&models.SubscriptionDelivery{}).Where("id = ?", deliveryID).Update("status", status).Error
}

func (r *subscriptionRepository) GetDueDeliveries(ctx context.Context, date string) ([]models.SubscriptionDelivery, error) {
	var deliveries []models.SubscriptionDelivery
	err := r.db.WithContext(ctx).Preload("Subscription").Where("scheduled_date <= ? AND status = ?", date, "scheduled").Find(&deliveries).Error
	return deliveries, err
}
