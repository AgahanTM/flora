package repository

import (
	"context"
	"errors"

	"gifts-api/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

var ErrPaymentNotFound = errors.New("payment not found")

type PaymentRepository interface {
	// Payments
	CreatePayment(ctx context.Context, payment *models.Payment) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.Payment, error)
	GetByOrderID(ctx context.Context, orderID uuid.UUID) (*models.Payment, error)
	UpdatePayment(ctx context.Context, payment *models.Payment) error

	// Transactions
	AddTransaction(ctx context.Context, tx *models.PaymentTransaction) error
	GetTransactionsByPaymentID(ctx context.Context, paymentID uuid.UUID) ([]models.PaymentTransaction, error)

	// Bank Transfer Proofs
	AddProof(ctx context.Context, proof *models.BankTransferProof) error
	GetProofsByPaymentID(ctx context.Context, paymentID uuid.UUID) ([]models.BankTransferProof, error)
	GetProofByID(ctx context.Context, id uuid.UUID) (*models.BankTransferProof, error)
	UpdateProof(ctx context.Context, proof *models.BankTransferProof) error

	// Refunds
	CreateRefund(ctx context.Context, refund *models.Refund) error
	GetRefundByID(ctx context.Context, id uuid.UUID) (*models.Refund, error)
	GetRefundsByOrderID(ctx context.Context, orderID uuid.UUID) ([]models.Refund, error)
	GetAllRefunds(ctx context.Context, status string, offset, limit int) ([]models.Refund, int64, error)
	UpdateRefund(ctx context.Context, refund *models.Refund) error
}

type paymentRepository struct {
	db *gorm.DB
}

func NewPaymentRepository(db *gorm.DB) PaymentRepository {
	return &paymentRepository{db: db}
}

// --- Payments ---

func (r *paymentRepository) CreatePayment(ctx context.Context, payment *models.Payment) error {
	return r.db.WithContext(ctx).Create(payment).Error
}

func (r *paymentRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Payment, error) {
	var payment models.Payment
	err := r.db.WithContext(ctx).Preload("Transactions").Preload("Proofs").First(&payment, "id = ?", id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrPaymentNotFound
	}
	return &payment, err
}

func (r *paymentRepository) GetByOrderID(ctx context.Context, orderID uuid.UUID) (*models.Payment, error) {
	var payment models.Payment
	err := r.db.WithContext(ctx).Preload("Transactions").Preload("Proofs").Where("order_id = ?", orderID).First(&payment).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrPaymentNotFound
	}
	return &payment, err
}

func (r *paymentRepository) UpdatePayment(ctx context.Context, payment *models.Payment) error {
	return r.db.WithContext(ctx).Save(payment).Error
}

// --- Transactions ---

func (r *paymentRepository) AddTransaction(ctx context.Context, tx *models.PaymentTransaction) error {
	return r.db.WithContext(ctx).Create(tx).Error
}

func (r *paymentRepository) GetTransactionsByPaymentID(ctx context.Context, paymentID uuid.UUID) ([]models.PaymentTransaction, error) {
	var txs []models.PaymentTransaction
	err := r.db.WithContext(ctx).Where("payment_id = ?", paymentID).Order("created_at ASC").Find(&txs).Error
	return txs, err
}

// --- Bank Transfer Proofs ---

func (r *paymentRepository) AddProof(ctx context.Context, proof *models.BankTransferProof) error {
	return r.db.WithContext(ctx).Create(proof).Error
}

func (r *paymentRepository) GetProofsByPaymentID(ctx context.Context, paymentID uuid.UUID) ([]models.BankTransferProof, error) {
	var proofs []models.BankTransferProof
	err := r.db.WithContext(ctx).Where("payment_id = ?", paymentID).Order("uploaded_at DESC").Find(&proofs).Error
	return proofs, err
}

func (r *paymentRepository) UpdateProof(ctx context.Context, proof *models.BankTransferProof) error {
	return r.db.WithContext(ctx).Save(proof).Error
}

// --- Refunds ---

func (r *paymentRepository) CreateRefund(ctx context.Context, refund *models.Refund) error {
	return r.db.WithContext(ctx).Create(refund).Error
}

func (r *paymentRepository) GetRefundByID(ctx context.Context, id uuid.UUID) (*models.Refund, error) {
	var refund models.Refund
	err := r.db.WithContext(ctx).Preload("Payment").Preload("Order").First(&refund, "id = ?", id).Error
	return &refund, err
}

func (r *paymentRepository) GetRefundsByOrderID(ctx context.Context, orderID uuid.UUID) ([]models.Refund, error) {
	var refunds []models.Refund
	err := r.db.WithContext(ctx).Where("order_id = ?", orderID).Order("created_at DESC").Find(&refunds).Error
	return refunds, err
}

func (r *paymentRepository) UpdateRefund(ctx context.Context, refund *models.Refund) error {
	return r.db.WithContext(ctx).Save(refund).Error
}

func (r *paymentRepository) GetProofByID(ctx context.Context, id uuid.UUID) (*models.BankTransferProof, error) {
	var proof models.BankTransferProof
	err := r.db.WithContext(ctx).First(&proof, "id = ?", id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrPaymentNotFound
	}
	return &proof, err
}

func (r *paymentRepository) GetAllRefunds(ctx context.Context, status string, offset, limit int) ([]models.Refund, int64, error) {
	var refunds []models.Refund
	var total int64
	q := r.db.WithContext(ctx).Model(&models.Refund{})
	if status != "" {
		q = q.Where("status = ?", status)
	}
	q.Count(&total)
	err := q.Preload("Payment").Preload("Order").Order("created_at DESC").Offset(offset).Limit(limit).Find(&refunds).Error
	return refunds, total, err
}
