package repository

import (
	"context"
	"errors"
	"fmt"

	"gifts-api/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

var ErrProductNotFound = errors.New("product not found")

type ProductRepository interface {
	// Products
	Create(ctx context.Context, product *models.Product) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.Product, error)
	Update(ctx context.Context, product *models.Product) error
	SoftDelete(ctx context.Context, id uuid.UUID) error
	GetAll(ctx context.Context, query string, categoryID *uuid.UUID, sellerID *uuid.UUID, status string, offset, limit int) ([]models.Product, int64, error)
	GetBySellerID(ctx context.Context, sellerID uuid.UUID, offset, limit int) ([]models.Product, int64, error)
	PauseAllBySellerID(ctx context.Context, sellerID uuid.UUID) error

	// Search
	FullTextSearch(ctx context.Context, query string, categoryID *uuid.UUID, sellerID *uuid.UUID, status string, offset, limit int) ([]models.Product, int64, error)
	GetSearchSuggestions(ctx context.Context, query string, limit int) ([]string, error)

	// Categories
	CreateCategory(ctx context.Context, cat *models.Category) error
	GetAllCategories(ctx context.Context) ([]models.Category, error)
	GetCategoryByID(ctx context.Context, id uuid.UUID) (*models.Category, error)
	UpdateCategory(ctx context.Context, cat *models.Category) error
	DeleteCategory(ctx context.Context, id uuid.UUID) error

	// Images
	CreateImage(ctx context.Context, img *models.ProductImage) error
	GetImagesByProductID(ctx context.Context, productID uuid.UUID) ([]models.ProductImage, error)
	DeleteImage(ctx context.Context, id uuid.UUID) error

	GetFeaturedProducts(ctx context.Context, limit int) ([]models.Product, error)
	ToggleProductFeatured(ctx context.Context, productID uuid.UUID, isFeatured bool) error
	Autocomplete(ctx context.Context, query string, limit int) ([]models.Product, error)

	// Variants
	CreateVariant(ctx context.Context, variant *models.ProductVariant) error
	GetVariantsByProductID(ctx context.Context, productID uuid.UUID) ([]models.ProductVariant, error)
	GetVariantByID(ctx context.Context, id uuid.UUID) (*models.ProductVariant, error)
	UpdateVariant(ctx context.Context, variant *models.ProductVariant) error
	DeleteVariant(ctx context.Context, id uuid.UUID) error

	// Addons
	CreateAddon(ctx context.Context, addon *models.ProductAddon) error
	GetAddonsByProductID(ctx context.Context, productID *uuid.UUID) ([]models.ProductAddon, error)
	UpdateAddon(ctx context.Context, addon *models.ProductAddon) error
	DeleteAddon(ctx context.Context, id uuid.UUID) error

	// Inventory
	CreateInventory(ctx context.Context, inv *models.Inventory) error
	GetInventory(ctx context.Context, productID uuid.UUID, variantID *uuid.UUID) (*models.Inventory, error)
	UpdateInventory(ctx context.Context, inv *models.Inventory) error
	ReserveStock(ctx context.Context, productID uuid.UUID, variantID *uuid.UUID, quantity int) error
	ReleaseStock(ctx context.Context, productID uuid.UUID, variantID *uuid.UUID, quantity int) error
	GetLowStockProducts(ctx context.Context, sellerID uuid.UUID) ([]models.Inventory, error)

	// Tags
	SetTags(ctx context.Context, productID uuid.UUID, tags []string) error
	GetTags(ctx context.Context, productID uuid.UUID) ([]models.ProductTag, error)

	// Occasions
	SetProductOccasions(ctx context.Context, productID uuid.UUID, occasionIDs []uuid.UUID) error

	// DB accessor for transactions
	GetDB() *gorm.DB
}

type productRepository struct {
	db *gorm.DB
}

func NewProductRepository(db *gorm.DB) ProductRepository {
	return &productRepository{db: db}
}

func (r *productRepository) GetDB() *gorm.DB {
	return r.db
}

func (r *productRepository) Create(ctx context.Context, product *models.Product) error {
	return r.db.WithContext(ctx).Create(product).Error
}

func (r *productRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Product, error) {
	var product models.Product
	err := r.db.WithContext(ctx).
		Preload("Images", func(db *gorm.DB) *gorm.DB { return db.Order("sort_order") }).
		Preload("Variants").
		Preload("Addons").
		Preload("Tags").
		Preload("Category").
		Preload("Seller").
		First(&product, "id = ?", id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrProductNotFound
	}
	return &product, err
}

func (r *productRepository) Update(ctx context.Context, product *models.Product) error {
	return r.db.WithContext(ctx).Save(product).Error
}

func (r *productRepository) SoftDelete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&models.Product{}, "id = ?", id).Error
}

func (r *productRepository) GetAll(ctx context.Context, query string, categoryID *uuid.UUID, sellerID *uuid.UUID, status string, offset, limit int) ([]models.Product, int64, error) {
	var products []models.Product
	var total int64
	q := r.db.WithContext(ctx).Model(&models.Product{})

	if query != "" {
		q = q.Where("title ILIKE ? OR description ILIKE ?", "%"+query+"%", "%"+query+"%")
	}
	if categoryID != nil {
		q = q.Where("category_id = ?", *categoryID)
	}
	if sellerID != nil {
		q = q.Where("seller_id = ?", *sellerID)
	}
	if status != "" {
		q = q.Where("status = ?", status)
	} else {
		q = q.Where("status = ?", "active")
	}
	q.Count(&total)
	err := q.Preload("Images").Preload("Category").Preload("Seller").
		Offset(offset).Limit(limit).Order("created_at DESC").Find(&products).Error
	return products, total, err
}

func (r *productRepository) GetBySellerID(ctx context.Context, sellerID uuid.UUID, offset, limit int) ([]models.Product, int64, error) {
	var products []models.Product
	var total int64
	q := r.db.WithContext(ctx).Model(&models.Product{}).Where("seller_id = ?", sellerID)
	q.Count(&total)
	err := q.Preload("Images").Preload("Variants").
		Offset(offset).Limit(limit).Order("created_at DESC").Find(&products).Error
	return products, total, err
}

func (r *productRepository) FullTextSearch(ctx context.Context, query string, categoryID *uuid.UUID, sellerID *uuid.UUID, status string, offset, limit int) ([]models.Product, int64, error) {
	var products []models.Product
	var total int64
	q := r.db.WithContext(ctx).Model(&models.Product{}).
		Where("search_vector @@ plainto_tsquery('simple', ?)", query)

	if categoryID != nil {
		q = q.Where("category_id = ?", *categoryID)
	}
	if sellerID != nil {
		q = q.Where("seller_id = ?", *sellerID)
	}
	if status != "" {
		q = q.Where("status = ?", status)
	} else {
		q = q.Where("status = ?", "active")
	}

	q.Count(&total)
	err := q.Preload("Images").Preload("Category").
		Offset(offset).Limit(limit).Find(&products).Error
	return products, total, err
}

func (r *productRepository) GetSearchSuggestions(ctx context.Context, query string, limit int) ([]string, error) {
	// Simple implementation
	var titles []string
	err := r.db.WithContext(ctx).Model(&models.Product{}).
		Where("title ILIKE ?", "%"+query+"%").
		Limit(limit).
		Pluck("title", &titles).Error
	return titles, err
}

func (r *productRepository) PauseAllBySellerID(ctx context.Context, sellerID uuid.UUID) error {
	return r.db.WithContext(ctx).Model(&models.Product{}).
		Where("seller_id = ? AND status = ?", sellerID, "active").
		Update("status", "paused").Error
}

// --- Categories ---

func (r *productRepository) CreateCategory(ctx context.Context, cat *models.Category) error {
	return r.db.WithContext(ctx).Create(cat).Error
}

func (r *productRepository) GetAllCategories(ctx context.Context) ([]models.Category, error) {
	var categories []models.Category
	err := r.db.WithContext(ctx).Where("is_active = ?", true).Order("sort_order").Find(&categories).Error
	return categories, err
}

func (r *productRepository) GetCategoryByID(ctx context.Context, id uuid.UUID) (*models.Category, error) {
	var cat models.Category
	err := r.db.WithContext(ctx).First(&cat, "id = ?", id).Error
	return &cat, err
}

func (r *productRepository) UpdateCategory(ctx context.Context, cat *models.Category) error {
	return r.db.WithContext(ctx).Save(cat).Error
}

func (r *productRepository) DeleteCategory(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&models.Category{}, "id = ?", id).Error
}

// --- Images ---

func (r *productRepository) CreateImage(ctx context.Context, img *models.ProductImage) error {
	return r.db.WithContext(ctx).Create(img).Error
}

func (r *productRepository) GetImagesByProductID(ctx context.Context, productID uuid.UUID) ([]models.ProductImage, error) {
	var images []models.ProductImage
	err := r.db.WithContext(ctx).Where("product_id = ?", productID).Order("sort_order").Find(&images).Error
	return images, err
}

func (r *productRepository) DeleteImage(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&models.ProductImage{}, "id = ?", id).Error
}

func (r *productRepository) GetFeaturedProducts(ctx context.Context, limit int) ([]models.Product, error) {
	var products []models.Product
	err := r.db.WithContext(ctx).
		Where("is_active = ? AND status = ? AND is_featured = ?", true, "approved", true).
		Preload("Variants").Preload("Addons").
		Order("created_at DESC").Limit(limit).Find(&products).Error
	return products, err
}

func (r *productRepository) ToggleProductFeatured(ctx context.Context, productID uuid.UUID, isFeatured bool) error {
	return r.db.WithContext(ctx).Model(&models.Product{}).
		Where("id = ?", productID).
		Update("is_featured", isFeatured).Error
}

func (r *productRepository) Autocomplete(ctx context.Context, query string, limit int) ([]models.Product, error) {
	var products []models.Product
	err := r.db.WithContext(ctx).
		Where("is_active = ? AND status = ? AND name ILIKE ?", true, "approved", "%"+query+"%").
		Preload("Images").
		Limit(limit).Find(&products).Error
	return products, err
}

// --- Variants ---

func (r *productRepository) CreateVariant(ctx context.Context, variant *models.ProductVariant) error {
	return r.db.WithContext(ctx).Create(variant).Error
}

func (r *productRepository) GetVariantsByProductID(ctx context.Context, productID uuid.UUID) ([]models.ProductVariant, error) {
	var variants []models.ProductVariant
	err := r.db.WithContext(ctx).Where("product_id = ?", productID).Find(&variants).Error
	return variants, err
}

func (r *productRepository) GetVariantByID(ctx context.Context, id uuid.UUID) (*models.ProductVariant, error) {
	var variant models.ProductVariant
	err := r.db.WithContext(ctx).First(&variant, "id = ?", id).Error
	return &variant, err
}

func (r *productRepository) UpdateVariant(ctx context.Context, variant *models.ProductVariant) error {
	return r.db.WithContext(ctx).Save(variant).Error
}

func (r *productRepository) DeleteVariant(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&models.ProductVariant{}, "id = ?", id).Error
}

// --- Addons ---

func (r *productRepository) CreateAddon(ctx context.Context, addon *models.ProductAddon) error {
	return r.db.WithContext(ctx).Create(addon).Error
}

func (r *productRepository) GetAddonsByProductID(ctx context.Context, productID *uuid.UUID) ([]models.ProductAddon, error) {
	var addons []models.ProductAddon
	q := r.db.WithContext(ctx)
	if productID != nil {
		q = q.Where("product_id = ? OR product_id IS NULL", *productID)
	} else {
		q = q.Where("product_id IS NULL")
	}
	err := q.Where("is_active = ?", true).Find(&addons).Error
	return addons, err
}

func (r *productRepository) UpdateAddon(ctx context.Context, addon *models.ProductAddon) error {
	return r.db.WithContext(ctx).Save(addon).Error
}

func (r *productRepository) DeleteAddon(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&models.ProductAddon{}, "id = ?", id).Error
}

// --- Inventory ---

func (r *productRepository) CreateInventory(ctx context.Context, inv *models.Inventory) error {
	return r.db.WithContext(ctx).Create(inv).Error
}

func (r *productRepository) GetInventory(ctx context.Context, productID uuid.UUID, variantID *uuid.UUID) (*models.Inventory, error) {
	var inv models.Inventory
	q := r.db.WithContext(ctx).Where("product_id = ?", productID)
	if variantID != nil {
		q = q.Where("variant_id = ?", *variantID)
	} else {
		q = q.Where("variant_id IS NULL")
	}
	err := q.First(&inv).Error
	return &inv, err
}

func (r *productRepository) UpdateInventory(ctx context.Context, inv *models.Inventory) error {
	return r.db.WithContext(ctx).Save(inv).Error
}

func (r *productRepository) ReserveStock(ctx context.Context, productID uuid.UUID, variantID *uuid.UUID, quantity int) error {
	q := r.db.WithContext(ctx).Model(&models.Inventory{}).Where("product_id = ?", productID)
	if variantID != nil {
		q = q.Where("variant_id = ?", *variantID)
	} else {
		q = q.Where("variant_id IS NULL")
	}
	// Optimistic locking: only update if quantity_total - quantity_reserved >= quantity
	result := q.Where("quantity_total - quantity_reserved >= ?", quantity).
		Updates(map[string]interface{}{
			"quantity_reserved": gorm.Expr("quantity_reserved + ?", quantity),
			"version":          gorm.Expr("version + 1"),
		})
	if result.RowsAffected == 0 {
		return fmt.Errorf("insufficient stock or concurrent modification for product %s", productID)
	}
	return result.Error
}

func (r *productRepository) ReleaseStock(ctx context.Context, productID uuid.UUID, variantID *uuid.UUID, quantity int) error {
	q := r.db.WithContext(ctx).Model(&models.Inventory{}).Where("product_id = ?", productID)
	if variantID != nil {
		q = q.Where("variant_id = ?", *variantID)
	} else {
		q = q.Where("variant_id IS NULL")
	}
	return q.Updates(map[string]interface{}{
		"quantity_reserved": gorm.Expr("GREATEST(quantity_reserved - ?, 0)", quantity),
		"version":           gorm.Expr("version + 1"),
	}).Error
}

func (r *productRepository) GetLowStockProducts(ctx context.Context, sellerID uuid.UUID) ([]models.Inventory, error) {
	var inventories []models.Inventory
	err := r.db.WithContext(ctx).
		Joins("JOIN products ON products.id = inventory.product_id").
		Where("products.seller_id = ?", sellerID).
		Where("inventory.quantity_total - inventory.quantity_reserved <= inventory.low_stock_threshold").
		Find(&inventories).Error
	return inventories, err
}

// --- Tags ---

func (r *productRepository) SetTags(ctx context.Context, productID uuid.UUID, tags []string) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("product_id = ?", productID).Delete(&models.ProductTag{}).Error; err != nil {
			return err
		}
		for _, tag := range tags {
			pt := models.ProductTag{ProductID: productID, Tag: tag}
			if err := tx.Create(&pt).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *productRepository) GetTags(ctx context.Context, productID uuid.UUID) ([]models.ProductTag, error) {
	var tags []models.ProductTag
	err := r.db.WithContext(ctx).Where("product_id = ?", productID).Find(&tags).Error
	return tags, err
}

// --- Occasions ---

func (r *productRepository) SetProductOccasions(ctx context.Context, productID uuid.UUID, occasionIDs []uuid.UUID) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("product_id = ?", productID).Delete(&models.ProductOccasion{}).Error; err != nil {
			return err
		}
		for _, oid := range occasionIDs {
			po := models.ProductOccasion{ProductID: productID, OccasionID: oid}
			if err := tx.Create(&po).Error; err != nil {
				return err
			}
		}
		return nil
	})
}
