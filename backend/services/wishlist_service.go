package services

import (
	"context"

	"gifts-api/models"
	"gifts-api/repository"

	"github.com/google/uuid"
)

type WishlistService interface {
	AddToWishlist(ctx context.Context, userID, productID uuid.UUID) error
	RemoveFromWishlist(ctx context.Context, userID, productID uuid.UUID) error
	GetWishlist(ctx context.Context, userID uuid.UUID) ([]models.Wishlist, error)
	IsInWishlist(ctx context.Context, userID, productID uuid.UUID) (bool, error)
}

type wishlistService struct {
	repo repository.WishlistRepository
}

func NewWishlistService(repo repository.WishlistRepository) WishlistService {
	return &wishlistService{repo: repo}
}

func (s *wishlistService) AddToWishlist(ctx context.Context, userID, productID uuid.UUID) error {
	return s.repo.Add(ctx, userID, productID)
}

func (s *wishlistService) RemoveFromWishlist(ctx context.Context, userID, productID uuid.UUID) error {
	return s.repo.Remove(ctx, userID, productID)
}

func (s *wishlistService) GetWishlist(ctx context.Context, userID uuid.UUID) ([]models.Wishlist, error) {
	return s.repo.GetByUserID(ctx, userID)
}

func (s *wishlistService) IsInWishlist(ctx context.Context, userID, productID uuid.UUID) (bool, error) {
	return s.repo.IsInWishlist(ctx, userID, productID)
}
