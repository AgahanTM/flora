package services

import (
	"context"

	"gifts-api/models"
	"gifts-api/repository"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ProductService interface {
	// Products
	CreateProduct(ctx context.Context, product *models.Product, inventory *models.Inventory, images []string, tags []string) (*models.Product, error)
	GetProduct(ctx context.Context, id uuid.UUID) (*models.Product, error)
	UpdateProduct(ctx context.Context, product *models.Product) error
	DeleteProduct(ctx context.Context, id uuid.UUID) error
	GetProducts(ctx context.Context, query string, categoryID *uuid.UUID, sellerID *uuid.UUID, status string, offset, limit int) ([]models.Product, int64, error)
	GetSellerProducts(ctx context.Context, sellerID uuid.UUID, offset, limit int) ([]models.Product, int64, error)

	// Categories
	CreateCategory(ctx context.Context, category *models.Category) error
	GetCategories(ctx context.Context) ([]models.Category, error)
	
	GetFeaturedProducts(ctx context.Context, limit int) ([]models.Product, error)
	ToggleProductFeatured(ctx context.Context, productID uuid.UUID, isFeatured bool) error
	Autocomplete(ctx context.Context, query string, limit int) ([]models.Product, error)

	// Variants & Addons
	AddVariant(ctx context.Context, variant *models.ProductVariant) error
	AddAddon(ctx context.Context, addon *models.ProductAddon) error

	// Inventory
	UpdateInventory(ctx context.Context, productID uuid.UUID, variantID *uuid.UUID, total, reserved int) error
	ReserveStock(ctx context.Context, productID uuid.UUID, variantID *uuid.UUID, quantity int) error
	ReleaseStock(ctx context.Context, productID uuid.UUID, variantID *uuid.UUID, quantity int) error
	GetLowStockAlerts(ctx context.Context, sellerID uuid.UUID) ([]models.Inventory, error)
}

type productService struct {
	repo repository.ProductRepository
}

func NewProductService(repo repository.ProductRepository) ProductService {
	return &productService{repo: repo}
}

func (s *productService) CreateProduct(ctx context.Context, product *models.Product, inventory *models.Inventory, images []string, tags []string) (*models.Product, error) {
	// Transactions should typically happen at the repo layer, or via UnitOfWork. 
	// Here we use the repository's DB handle to perform a transaction.
	
	db := s.repo.GetDB().WithContext(ctx)
	err := db.Transaction(func(tx *gorm.DB) error {
		// Create product
		if err := tx.Create(product).Error; err != nil {
			return err
		}

		// Create images
		for i, url := range images {
			img := &models.ProductImage{
				ProductID: product.ID,
				URL:       url,
				SortOrder: i,
				IsPrimary: i == 0,
			}
			if err := tx.Create(img).Error; err != nil {
				return err
			}
		}

		// Create tags
		for _, tag := range tags {
			pt := &models.ProductTag{ProductID: product.ID, Tag: tag}
			if err := tx.Create(pt).Error; err != nil {
				return err
			}
		}

		// Create Inventory
		if inventory != nil {
			inventory.ProductID = product.ID
			if err := tx.Create(inventory).Error; err != nil {
				return err
			}
		} else {
			// Auto create 0-inventory
			inv := &models.Inventory{
				ProductID:     product.ID,
				QuantityTotal: 0,
			}
			if err := tx.Create(inv).Error; err != nil {
				return err
			}
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	return s.GetProduct(ctx, product.ID)
}

func (s *productService) GetProduct(ctx context.Context, id uuid.UUID) (*models.Product, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *productService) UpdateProduct(ctx context.Context, product *models.Product) error {
	return s.repo.Update(ctx, product)
}

func (s *productService) DeleteProduct(ctx context.Context, id uuid.UUID) error {
	return s.repo.SoftDelete(ctx, id)
}

func (s *productService) GetProducts(ctx context.Context, query string, categoryID *uuid.UUID, sellerID *uuid.UUID, status string, offset, limit int) ([]models.Product, int64, error) {
	// Let's just use the standard GetAll with ILIKE which the repo handles unless tsearch is explicitly called.
	return s.repo.GetAll(ctx, query, categoryID, sellerID, status, offset, limit)
}

func (s *productService) GetSellerProducts(ctx context.Context, sellerID uuid.UUID, offset, limit int) ([]models.Product, int64, error) {
	return s.repo.GetBySellerID(ctx, sellerID, offset, limit)
}

// --- Categories ---

func (s *productService) CreateCategory(ctx context.Context, category *models.Category) error {
	return s.repo.CreateCategory(ctx, category)
}

func (s *productService) GetCategories(ctx context.Context) ([]models.Category, error) {
	return s.repo.GetAllCategories(ctx)
}

func (s *productService) GetFeaturedProducts(ctx context.Context, limit int) ([]models.Product, error) {
	return s.repo.GetFeaturedProducts(ctx, limit)
}

func (s *productService) ToggleProductFeatured(ctx context.Context, productID uuid.UUID, isFeatured bool) error {
	return s.repo.ToggleProductFeatured(ctx, productID, isFeatured)
}

func (s *productService) Autocomplete(ctx context.Context, query string, limit int) ([]models.Product, error) {
	if query == "" {
		return []models.Product{}, nil
	}
	return s.repo.Autocomplete(ctx, query, limit)
}

// --- Variants & Addons ---

func (s *productService) AddVariant(ctx context.Context, variant *models.ProductVariant) error {
	return s.repo.CreateVariant(ctx, variant)
}

func (s *productService) AddAddon(ctx context.Context, addon *models.ProductAddon) error {
	return s.repo.CreateAddon(ctx, addon)
}

// --- Inventory ---

func (s *productService) UpdateInventory(ctx context.Context, productID uuid.UUID, variantID *uuid.UUID, total, reserved int) error {
	inv, err := s.repo.GetInventory(ctx, productID, variantID)
	if err != nil {
		// Create new
		inv = &models.Inventory{
			ProductID:        productID,
			VariantID:        variantID,
			QuantityTotal:    total,
			QuantityReserved: reserved,
		}
		return s.repo.CreateInventory(ctx, inv)
	}
	
	inv.QuantityTotal = total
	inv.QuantityReserved = reserved
	return s.repo.UpdateInventory(ctx, inv)
}

func (s *productService) ReserveStock(ctx context.Context, productID uuid.UUID, variantID *uuid.UUID, quantity int) error {
	return s.repo.ReserveStock(ctx, productID, variantID, quantity)
}

func (s *productService) ReleaseStock(ctx context.Context, productID uuid.UUID, variantID *uuid.UUID, quantity int) error {
	return s.repo.ReleaseStock(ctx, productID, variantID, quantity)
}

func (s *productService) GetLowStockAlerts(ctx context.Context, sellerID uuid.UUID) ([]models.Inventory, error) {
	return s.repo.GetLowStockProducts(ctx, sellerID)
}


