package services

import (
	"context"
	"errors"
	"time"

	"gifts-api/models"
	"gifts-api/repository"

	"github.com/google/uuid"
)

type SellerService interface {
	RegisterSeller(ctx context.Context, userID uuid.UUID, seller *models.Seller) (*models.Seller, error)
	GetSeller(ctx context.Context, id uuid.UUID) (*models.Seller, error)
	GetSellerBySlug(ctx context.Context, slug string) (*models.Seller, error)
	GetSellerByUserID(ctx context.Context, userID uuid.UUID) (*models.Seller, error)
	UpdateSellerProfile(ctx context.Context, sellerID uuid.UUID, updates *models.Seller) error
	ListSellers(ctx context.Context, status string, offset, limit int) ([]models.Seller, int64, error)

	// Admin Actions
	ApproveSeller(ctx context.Context, sellerID, adminID uuid.UUID) error
	RejectSeller(ctx context.Context, sellerID, adminID uuid.UUID, reason string) error
	SuspendSeller(ctx context.Context, sellerID, adminID uuid.UUID, reason string) error

	// Documents & Bank
	UploadDocument(ctx context.Context, doc *models.SellerDocument) error
	UpdateBankDetails(ctx context.Context, bd *models.SellerBankDetail) error

	// Operations
	UpdateWorkingHours(ctx context.Context, sellerID uuid.UUID, hours []models.SellerWorkingHour) error
	UpdateDeliveryZones(ctx context.Context, sellerID uuid.UUID, zoneIDs []uuid.UUID) error
}

type sellerService struct {
	sellerRepo  repository.SellerRepository
	userRepo    repository.UserRepository
	productRepo repository.ProductRepository // Needed for suspending products
}

func NewSellerService(
	sellerRepo repository.SellerRepository,
	userRepo repository.UserRepository,
	productRepo repository.ProductRepository,
) SellerService {
	return &sellerService{
		sellerRepo:  sellerRepo,
		userRepo:    userRepo,
		productRepo: productRepo,
	}
}

func (s *sellerService) RegisterSeller(ctx context.Context, userID uuid.UUID, seller *models.Seller) (*models.Seller, error) {
	_, err := s.sellerRepo.GetByUserID(ctx, userID)
	if err == nil {
		return nil, errors.New("user is already a seller")
	}

	seller.UserID = userID
	seller.Status = "pending"
	if err := s.sellerRepo.Create(ctx, seller); err != nil {
		return nil, err
	}

	// Also update user role to seller
	user, _ := s.userRepo.GetByID(ctx, userID)
	if user != nil {
		user.Role = "seller"
		_ = s.userRepo.Update(ctx, user)
	}

	return seller, nil
}

func (s *sellerService) GetSeller(ctx context.Context, id uuid.UUID) (*models.Seller, error) {
	return s.sellerRepo.GetByID(ctx, id)
}

func (s *sellerService) GetSellerBySlug(ctx context.Context, slug string) (*models.Seller, error) {
	return s.sellerRepo.GetBySlug(ctx, slug)
}

func (s *sellerService) GetSellerByUserID(ctx context.Context, userID uuid.UUID) (*models.Seller, error) {
	return s.sellerRepo.GetByUserID(ctx, userID)
}

func (s *sellerService) UpdateSellerProfile(ctx context.Context, sellerID uuid.UUID, updates *models.Seller) error {
	seller, err := s.sellerRepo.GetByID(ctx, sellerID)
	if err != nil {
		return err
	}

	if updates.ShopName != "" {
		seller.ShopName = updates.ShopName
	}
	if updates.Description != "" {
		seller.Description = updates.Description
	}
	if updates.LogoURL != "" {
		seller.LogoURL = updates.LogoURL
	}
	if updates.CoverURL != "" {
		seller.CoverURL = updates.CoverURL
	}
	// Slug update logic could be added here safely

	return s.sellerRepo.Update(ctx, seller)
}

func (s *sellerService) ApproveSeller(ctx context.Context, sellerID, adminID uuid.UUID) error {
	seller, err := s.sellerRepo.GetByID(ctx, sellerID)
	if err != nil {
		return err
	}

	now := time.Now()
	seller.Status = "approved"
	seller.ApprovedAt = &now
	seller.ApprovedBy = &adminID

	return s.sellerRepo.Update(ctx, seller)
}

func (s *sellerService) RejectSeller(ctx context.Context, sellerID, adminID uuid.UUID, reason string) error {
	seller, err := s.sellerRepo.GetByID(ctx, sellerID)
	if err != nil {
		return err
	}

	seller.Status = "rejected"
	seller.RejectionReason = reason

	return s.sellerRepo.Update(ctx, seller)
}

func (s *sellerService) SuspendSeller(ctx context.Context, sellerID, adminID uuid.UUID, reason string) error {
	seller, err := s.sellerRepo.GetByID(ctx, sellerID)
	if err != nil {
		return err
	}

	seller.Status = "suspended"
	seller.RejectionReason = reason // Reuse or add suspension reason

	if err := s.sellerRepo.Update(ctx, seller); err != nil {
		return err
	}

	// Suspend all active products
	return s.productRepo.PauseAllBySellerID(ctx, sellerID)
}

func (s *sellerService) UploadDocument(ctx context.Context, doc *models.SellerDocument) error {
	return s.sellerRepo.CreateDocument(ctx, doc)
}

func (s *sellerService) UpdateBankDetails(ctx context.Context, bd *models.SellerBankDetail) error {
	existing, _ := s.sellerRepo.GetBankDetailsBySellerID(ctx, bd.SellerID)
	if len(existing) > 0 {
		bd.ID = existing[0].ID // Update existing
		return s.sellerRepo.UpdateBankDetail(ctx, bd)
	}
	return s.sellerRepo.CreateBankDetail(ctx, bd)
}

func (s *sellerService) UpdateWorkingHours(ctx context.Context, sellerID uuid.UUID, hours []models.SellerWorkingHour) error {
	for i := range hours {
		hours[i].SellerID = sellerID
	}
	return s.sellerRepo.UpsertWorkingHours(ctx, hours)
}

func (s *sellerService) UpdateDeliveryZones(ctx context.Context, sellerID uuid.UUID, zoneIDs []uuid.UUID) error {
	var zones []models.SellerDeliveryZone
	for _, zid := range zoneIDs {
		zones = append(zones, models.SellerDeliveryZone{
			SellerID: sellerID,
			ZoneID:   zid,
			IsActive: true,
		})
	}
	return s.sellerRepo.SetDeliveryZones(ctx, sellerID, zones)
}

func (s *sellerService) ListSellers(ctx context.Context, status string, offset, limit int) ([]models.Seller, int64, error) {
	return s.sellerRepo.GetAll(ctx, status, offset, limit)
}
