package services

import (
	"context"
	"time"

	"gifts-api/models"
	"gifts-api/repository"

	"github.com/google/uuid"
)

type PaymentService interface {
	CreatePayment(ctx context.Context, orderID uuid.UUID, method, currency string, amount float64) (*models.Payment, error)
	GetPayment(ctx context.Context, id uuid.UUID) (*models.Payment, error)

	// Admin / System
	UpdatePaymentStatus(ctx context.Context, paymentID uuid.UUID, status string, providerRef *string) error
	
	// Bank Transfer
	UploadBankProof(ctx context.Context, paymentID uuid.UUID, userID uuid.UUID, proofURL string) error
	ApproveBankProof(ctx context.Context, proofID uuid.UUID, adminID uuid.UUID) error
	RejectBankProof(ctx context.Context, proofID uuid.UUID, adminID uuid.UUID, reason string) error

	// Refunds
	RequestRefund(ctx context.Context, refund *models.Refund) error
	ProcessRefund(ctx context.Context, refundID uuid.UUID, adminID uuid.UUID, status string) error
	ListRefunds(ctx context.Context, status string, offset, limit int) ([]models.Refund, int64, error)
}

type paymentService struct {
	paymentRepo repository.PaymentRepository
	orderRepo   repository.OrderRepository // Might need this to update order payment status
}

func NewPaymentService(paymentRepo repository.PaymentRepository, orderRepo repository.OrderRepository) PaymentService {
	return &paymentService{paymentRepo: paymentRepo, orderRepo: orderRepo}
}

func (s *paymentService) CreatePayment(ctx context.Context, orderID uuid.UUID, method, currency string, amount float64) (*models.Payment, error) {
	payment := &models.Payment{
		OrderID:  orderID,
		Method:   method,
		Status:   "pending",
		Amount:   amount,
		Currency: currency,
	}

	if method == "cod" {
		// COD is effectively "pending" until delivered, but we can register it
	}

	err := s.paymentRepo.CreatePayment(ctx, payment)
	return payment, err
}

func (s *paymentService) GetPayment(ctx context.Context, id uuid.UUID) (*models.Payment, error) {
	return s.paymentRepo.GetByID(ctx, id)
}

func (s *paymentService) UpdatePaymentStatus(ctx context.Context, paymentID uuid.UUID, status string, providerRef *string) error {
	payment, err := s.paymentRepo.GetByID(ctx, paymentID)
	if err != nil {
		return err
	}

	payment.Status = status
	if providerRef != nil {
		payment.ReferenceCode = providerRef
		now := time.Now()
		payment.ConfirmedAt = &now
	}

	// Record transaction
	tx := &models.PaymentTransaction{
		PaymentID: payment.ID,
		Type:      "charge",
		Amount:    payment.Amount,
	}
	_ = s.paymentRepo.AddTransaction(ctx, tx)

	return s.paymentRepo.UpdatePayment(ctx, payment)
}

func (s *paymentService) UploadBankProof(ctx context.Context, paymentID uuid.UUID, userID uuid.UUID, proofURL string) error {
	_, err := s.paymentRepo.GetByID(ctx, paymentID)
	if err != nil {
		return err
	}

	proof := &models.BankTransferProof{
		PaymentID:  paymentID,
		ImageURL:   proofURL,
		UploadedBy: userID,
	}
	return s.paymentRepo.AddProof(ctx, proof)
}

func (s *paymentService) ApproveBankProof(ctx context.Context, proofID uuid.UUID, adminID uuid.UUID) error {
	proof, err := s.paymentRepo.GetProofByID(ctx, proofID)
	if err != nil {
		return err
	}

	now := time.Now()
	proof.VerifiedAt = &now
	proof.VerifiedBy = &adminID
	if err := s.paymentRepo.UpdateProof(ctx, proof); err != nil {
		return err
	}

	// Update payment status to confirmed
	payment, err := s.paymentRepo.GetByID(ctx, proof.PaymentID)
	if err != nil {
		return err
	}
	payment.Status = "confirmed"
	payment.ConfirmedAt = &now
	payment.ConfirmedBy = &adminID
	if err := s.paymentRepo.UpdatePayment(ctx, payment); err != nil {
		return err
	}

	// Record transaction
	tx := &models.PaymentTransaction{
		PaymentID:   payment.ID,
		Type:        "charge",
		Amount:      payment.Amount,
		PerformedBy: &adminID,
		Note:        "Bank transfer proof approved",
	}
	return s.paymentRepo.AddTransaction(ctx, tx)
}

func (s *paymentService) RejectBankProof(ctx context.Context, proofID uuid.UUID, adminID uuid.UUID, reason string) error {
	proof, err := s.paymentRepo.GetProofByID(ctx, proofID)
	if err != nil {
		return err
	}

	now := time.Now()
	proof.VerifiedAt = &now
	proof.VerifiedBy = &adminID
	if err := s.paymentRepo.UpdateProof(ctx, proof); err != nil {
		return err
	}

	// Update payment status to failed
	payment, err := s.paymentRepo.GetByID(ctx, proof.PaymentID)
	if err != nil {
		return err
	}
	payment.Status = "failed"
	payment.Notes = reason
	return s.paymentRepo.UpdatePayment(ctx, payment)
}

func (s *paymentService) RequestRefund(ctx context.Context, refund *models.Refund) error {
	refund.Status = "requested"
	return s.paymentRepo.CreateRefund(ctx, refund)
}

func (s *paymentService) ProcessRefund(ctx context.Context, refundID uuid.UUID, adminID uuid.UUID, status string) error {
	refund, err := s.paymentRepo.GetRefundByID(ctx, refundID)
	if err != nil {
		return err
	}
	refund.Status = status
	refund.ProcessedBy = &adminID
	if status == "completed" {
		now := time.Now()
		refund.CompletedAt = &now
	}
	return s.paymentRepo.UpdateRefund(ctx, refund)
}

func (s *paymentService) ListRefunds(ctx context.Context, status string, offset, limit int) ([]models.Refund, int64, error) {
	return s.paymentRepo.GetAllRefunds(ctx, status, offset, limit)
}
