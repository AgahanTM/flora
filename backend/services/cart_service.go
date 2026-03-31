package services

import (
	"context"
	"errors"

	"gifts-api/models"
	"gifts-api/repository"

	"github.com/google/uuid"
)

type CartService interface {
	GetCart(ctx context.Context, userID uuid.UUID) (*models.Cart, error)
	AddToCart(ctx context.Context, userID, productID uuid.UUID, variantID *uuid.UUID, quantity int) error
	UpdateCartItemQuantity(ctx context.Context, userID, productID uuid.UUID, variantID *uuid.UUID, quantity int) error
	RemoveFromCart(ctx context.Context, userID, productID uuid.UUID, variantID *uuid.UUID) error
	ClearCart(ctx context.Context, userID uuid.UUID) error
	ApplyPromoCode(ctx context.Context, userID uuid.UUID, code string) error
	RemovePromoCode(ctx context.Context, userID uuid.UUID) error
}

type cartService struct {
	cartRepo    repository.CartRepository
	productRepo repository.ProductRepository
	promoSvc    PromotionService
}

func NewCartService(cartRepo repository.CartRepository, productRepo repository.ProductRepository, promoSvc PromotionService) CartService {
	return &cartService{cartRepo: cartRepo, productRepo: productRepo, promoSvc: promoSvc}
}

func (s *cartService) getOrCreateCart(ctx context.Context, userID uuid.UUID) (*models.Cart, error) {
	cart, err := s.cartRepo.GetByUserID(ctx, userID)
	if err != nil {
		if errors.Is(err, repository.ErrCartNotFound) {
			return s.cartRepo.CreateForUser(ctx, userID)
		}
		return nil, err
	}
	return cart, nil
}

func (s *cartService) GetCart(ctx context.Context, userID uuid.UUID) (*models.Cart, error) {
	return s.getOrCreateCart(ctx, userID)
}

func (s *cartService) AddToCart(ctx context.Context, userID, productID uuid.UUID, variantID *uuid.UUID, quantity int) error {
	// 1. Validate Product exists
	_, err := s.productRepo.GetByID(ctx, productID)
	if err != nil {
		return err
	}

	// 2. Validate inventory
	inv, err := s.productRepo.GetInventory(ctx, productID, variantID)
	if err != nil {
		return err
	}
	available := inv.QuantityTotal - inv.QuantityReserved
	if available < quantity {
		return errors.New("insufficient stock")
	}

	// 3. Ensure Cart exists
	cart, err := s.getOrCreateCart(ctx, userID)
	if err != nil {
		return err
	}

	// 4. Add item
	return s.cartRepo.AddItem(ctx, cart.ID, productID, variantID, quantity)
}

func (s *cartService) UpdateCartItemQuantity(ctx context.Context, userID, productID uuid.UUID, variantID *uuid.UUID, quantity int) error {
	cart, err := s.cartRepo.GetByUserID(ctx, userID)
	if err != nil {
		return err
	}

	inv, err := s.productRepo.GetInventory(ctx, productID, variantID)
	if err != nil {
		return errors.New("inventory not found")
	}

	available := inv.QuantityTotal - inv.QuantityReserved
	if available < quantity {
		return errors.New("not enough stock available")
	}

	if quantity <= 0 {
		return s.cartRepo.RemoveItem(ctx, cart.ID, productID, variantID)
	}

	return s.cartRepo.UpdateItemQuantity(ctx, cart.ID, productID, variantID, quantity)
}

func (s *cartService) RemoveFromCart(ctx context.Context, userID, productID uuid.UUID, variantID *uuid.UUID) error {
	cart, err := s.cartRepo.GetByUserID(ctx, userID)
	if err != nil {
		if errors.Is(err, repository.ErrCartNotFound) {
			return nil // Nothing to remove
		}
		return err
	}
	return s.cartRepo.RemoveItem(ctx, cart.ID, productID, variantID)
}

func (s *cartService) ClearCart(ctx context.Context, userID uuid.UUID) error {
	cart, err := s.cartRepo.GetByUserID(ctx, userID)
	if err != nil {
		if errors.Is(err, repository.ErrCartNotFound) {
			return nil // Already clear
		}
		return err
	}
	return s.cartRepo.ClearCart(ctx, cart.ID)
}

func (s *cartService) ApplyPromoCode(ctx context.Context, userID uuid.UUID, code string) error {
	cart, err := s.getOrCreateCart(ctx, userID)
	if err != nil {
		return err
	}

	// Calculate subtotal from line items (handling variants in future)
	var subtotal float64
	for _, item := range cart.Items {
		subtotal += item.Product.BasePrice * float64(item.Quantity)
	}

	// Validate via service
	promo, err := s.promoSvc.ValidatePromotion(ctx, code, userID, subtotal)
	if err != nil {
		return err
	}

	return s.cartRepo.ApplyPromo(ctx, cart.ID, promo.ID)
}

func (s *cartService) RemovePromoCode(ctx context.Context, userID uuid.UUID) error {
	cart, err := s.getOrCreateCart(ctx, userID)
	if err != nil {
		return err
	}

	return s.cartRepo.RemovePromo(ctx, cart.ID)
}
