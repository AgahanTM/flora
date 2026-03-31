-- =============================================================================
-- PostgreSQL DDL for "Flora" — Flowers & Gifts E-commerce Platform
-- Full 15-module schema
-- =============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For fuzzy text search

-- =============================================================================
-- ENUMS
-- =============================================================================
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('customer', 'seller', 'admin', 'courier');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE seller_status AS ENUM ('pending', 'approved', 'suspended', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE seller_doc_type AS ENUM ('id_card', 'business_license', 'tax_certificate');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE product_status AS ENUM ('draft', 'active', 'paused', 'deleted');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE addon_type AS ENUM ('flower_addon', 'gift_item', 'personalization');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE personalization_type_name AS ENUM ('laser_engraving', '3d_print', 'custom_card');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE personalization_job_status AS ENUM ('pending', 'in_production', 'completed', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled', 'failed', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('cash_on_delivery', 'bank_transfer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'confirmed', 'failed', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE cancelled_by_type AS ENUM ('customer', 'seller', 'admin', 'system');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE courier_vehicle AS ENUM ('bike', 'car', 'on_foot');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE courier_status AS ENUM ('available', 'busy', 'offline');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE delivery_status AS ENUM ('unassigned', 'assigned', 'picked_up', 'en_route', 'delivered', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_tx_type AS ENUM ('charge', 'refund', 'adjustment');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE refund_status AS ENUM ('pending', 'approved', 'rejected', 'completed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE notification_channel AS ENUM ('sms', 'email', 'push');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE notification_status AS ENUM ('queued', 'sent', 'failed', 'read');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE report_target AS ENUM ('order', 'product', 'seller', 'review');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE report_status AS ENUM ('open', 'investigating', 'resolved', 'dismissed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE promo_type AS ENUM ('percentage', 'fixed_amount', 'free_delivery');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE promo_scope AS ENUM ('all_orders', 'first_order', 'specific_sellers');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE subscription_frequency AS ENUM ('weekly', 'biweekly', 'monthly');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM ('active', 'paused', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE subscription_delivery_status AS ENUM ('scheduled', 'completed', 'skipped', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE banner_position AS ENUM ('home_top', 'home_mid', 'category_page');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =============================================================================
-- 1. AUTH & USER SYSTEM
-- =============================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'customer',
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    avatar_url VARCHAR(500),
    date_of_birth DATE,
    preferred_language VARCHAR(10) DEFAULT 'tk',
    UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS user_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label VARCHAR(100),
    city VARCHAR(100),
    district VARCHAR(100),
    street VARCHAR(255),
    building VARCHAR(100),
    apartment VARCHAR(100),
    lat DECIMAL(10, 7),
    lng DECIMAL(10, 7),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    access_token_hash VARCHAR(255) NOT NULL,
    refresh_token_hash VARCHAR(255) NOT NULL,
    device_info JSONB,
    ip_address VARCHAR(45),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS phone_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(20) NOT NULL,
    code VARCHAR(6) NOT NULL,
    attempts INT DEFAULT 0,
    expires_at TIMESTAMPTZ NOT NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS password_resets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 2. SELLER SYSTEM
-- =============================================================================
CREATE TABLE IF NOT EXISTS sellers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    shop_name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    logo_url VARCHAR(500),
    cover_url VARCHAR(500),
    status seller_status NOT NULL DEFAULT 'pending',
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES users(id),
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS seller_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
    type seller_doc_type NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS seller_bank_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
    bank_name VARCHAR(255) NOT NULL,
    account_number VARCHAR(100) NOT NULL,
    account_holder_name VARCHAR(255) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    UNIQUE (seller_id)
);

CREATE TABLE IF NOT EXISTS seller_working_hours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    open_time TIME NOT NULL,
    close_time TIME NOT NULL,
    is_closed BOOLEAN DEFAULT FALSE,
    UNIQUE (seller_id, day_of_week)
);

CREATE TABLE IF NOT EXISTS seller_stats (
    seller_id UUID PRIMARY KEY REFERENCES sellers(id) ON DELETE CASCADE,
    total_orders INT DEFAULT 0,
    completed_orders INT DEFAULT 0,
    cancelled_orders INT DEFAULT 0,
    failed_orders INT DEFAULT 0,
    avg_rating DECIMAL(3, 2) DEFAULT 0,
    total_revenue DECIMAL(12, 2) DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 3. PRODUCT SYSTEM
-- =============================================================================
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    parent_id UUID REFERENCES categories(id),
    icon_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    base_price DECIMAL(10, 2) NOT NULL,
    compare_price DECIMAL(10, 2),
    status product_status NOT NULL DEFAULT 'draft',
    shelf_life_hours INT,
    requires_cold_storage BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    search_vector TSVECTOR,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_products_search ON products USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);

CREATE TABLE IF NOT EXISTS product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    url VARCHAR(500) NOT NULL,
    sort_order INT DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    price_modifier DECIMAL(10, 2) DEFAULT 0,
    sku VARCHAR(100) UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_addons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    addon_type addon_type NOT NULL,
    max_quantity INT DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    quantity_total INT NOT NULL DEFAULT 0,
    quantity_reserved INT NOT NULL DEFAULT 0,
    low_stock_threshold INT DEFAULT 5,
    version INT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (product_id, variant_id)
);

CREATE TABLE IF NOT EXISTS product_tags (
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    tag VARCHAR(100) NOT NULL,
    PRIMARY KEY (product_id, tag)
);

-- =============================================================================
-- 4. PERSONALIZATION SYSTEM
-- =============================================================================
CREATE TABLE IF NOT EXISTS personalization_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name personalization_type_name NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    base_price DECIMAL(10, 2) NOT NULL,
    max_text_length INT,
    available_materials JSONB,
    available_colors JSONB,
    turnaround_minutes INT,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS personalization_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type_id UUID NOT NULL REFERENCES personalization_types(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    preview_image_url VARCHAR(500),
    description TEXT,
    example_text VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0
);

-- personalization_jobs references order_items, defined after orders

-- =============================================================================
-- 5. OCCASIONS & GIFT BUILDER
-- =============================================================================
CREATE TABLE IF NOT EXISTS occasions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    icon_url VARCHAR(500),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS product_occasions (
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    occasion_id UUID NOT NULL REFERENCES occasions(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, occasion_id)
);

CREATE TABLE IF NOT EXISTS occasion_suggestions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    occasion_id UUID NOT NULL REFERENCES occasions(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    min_budget DECIMAL(10, 2),
    max_budget DECIMAL(10, 2),
    product_ids JSONB,
    addon_ids JSONB,
    suggested_message TEXT,
    personalization_type_id UUID REFERENCES personalization_types(id),
    preview_image_url VARCHAR(500),
    is_featured BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0
);

-- =============================================================================
-- 6. DELIVERY SYSTEM
-- =============================================================================
CREATE TABLE IF NOT EXISTS delivery_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100),
    polygon JSONB,
    base_delivery_fee DECIMAL(10, 2) DEFAULT 0,
    estimated_minutes INT,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS seller_delivery_zones (
    seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
    zone_id UUID NOT NULL REFERENCES delivery_zones(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (seller_id, zone_id)
);

CREATE TABLE IF NOT EXISTS delivery_time_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID REFERENCES sellers(id) ON DELETE CASCADE,
    slot_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    max_orders INT NOT NULL,
    booked_orders INT DEFAULT 0,
    price_modifier DECIMAL(10, 2) DEFAULT 0,
    is_blocked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS couriers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    vehicle_type courier_vehicle NOT NULL DEFAULT 'car',
    status courier_status NOT NULL DEFAULT 'offline',
    current_lat DECIMAL(10, 7),
    current_lng DECIMAL(10, 7),
    last_seen_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS delivery_slas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    zone_id UUID NOT NULL REFERENCES delivery_zones(id) ON DELETE CASCADE,
    max_delivery_minutes INT NOT NULL,
    breach_compensation_amount DECIMAL(10, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

-- =============================================================================
-- 7. PROMOTION SYSTEM
-- =============================================================================
CREATE TABLE IF NOT EXISTS promotions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255),
    type promo_type NOT NULL,
    value DECIMAL(10, 2) NOT NULL,
    min_order_amount DECIMAL(10, 2) DEFAULT 0,
    max_discount_amount DECIMAL(10, 2),
    scope promo_scope NOT NULL DEFAULT 'all_orders',
    starts_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    max_uses INT,
    used_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS promotion_sellers (
    promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
    PRIMARY KEY (promotion_id, seller_id)
);

-- =============================================================================
-- 8. ORDER SYSTEM
-- =============================================================================
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES users(id),
    seller_id UUID NOT NULL REFERENCES sellers(id),
    status order_status NOT NULL DEFAULT 'pending',
    subtotal DECIMAL(10, 2) NOT NULL,
    delivery_fee DECIMAL(10, 2) DEFAULT 0,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    total_price DECIMAL(10, 2) NOT NULL,
    payment_method payment_method NOT NULL DEFAULT 'cash_on_delivery',
    payment_status payment_status NOT NULL DEFAULT 'pending',
    delivery_address_id UUID REFERENCES user_addresses(id),
    delivery_date DATE,
    time_slot_id UUID REFERENCES delivery_time_slots(id),
    special_instructions TEXT,
    cancellation_reason TEXT,
    cancelled_by cancelled_by_type,
    promotion_id UUID REFERENCES promotions(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller ON orders(seller_id);

CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    variant_id UUID REFERENCES product_variants(id),
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    addons JSONB,
    personalization_price DECIMAL(10, 2) DEFAULT 0,
    line_total DECIMAL(10, 2) NOT NULL,
    product_snapshot JSONB,
    personalization_job_id UUID
);

CREATE TABLE IF NOT EXISTS order_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    message_text VARCHAR(200),
    font_style VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    from_status VARCHAR(50),
    to_status VARCHAR(50) NOT NULL,
    changed_by UUID REFERENCES users(id),
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Personalization jobs (references order_items)
CREATE TABLE IF NOT EXISTS personalization_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    type_id UUID NOT NULL REFERENCES personalization_types(id),
    template_id UUID REFERENCES personalization_templates(id),
    input_text VARCHAR(500),
    input_file_url VARCHAR(500),
    material VARCHAR(100),
    color VARCHAR(100),
    status personalization_job_status NOT NULL DEFAULT 'pending',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Add FK on order_items for personalization_job_id
ALTER TABLE order_items
    DROP CONSTRAINT IF EXISTS fk_order_items_personalization_job;
ALTER TABLE order_items
    ADD CONSTRAINT fk_order_items_personalization_job
    FOREIGN KEY (personalization_job_id) REFERENCES personalization_jobs(id);

-- =============================================================================
-- 9. DELIVERY TRACKING
-- =============================================================================
CREATE TABLE IF NOT EXISTS deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
    courier_id UUID REFERENCES couriers(id),
    zone_id UUID REFERENCES delivery_zones(id),
    status delivery_status NOT NULL DEFAULT 'unassigned',
    pickup_notes TEXT,
    dropoff_notes TEXT,
    delivery_fee DECIMAL(10, 2) DEFAULT 0,
    assigned_at TIMESTAMPTZ,
    picked_up_at TIMESTAMPTZ,
    en_route_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    failure_reason TEXT,
    eta TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS delivery_breaches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    delivery_id UUID NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
    sla_id UUID NOT NULL REFERENCES delivery_slas(id),
    breach_detected_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    compensation_issued BOOLEAN DEFAULT FALSE,
    compensation_amount DECIMAL(10, 2) DEFAULT 0
);

-- =============================================================================
-- 10. PAYMENT SYSTEM
-- =============================================================================
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
    method payment_method NOT NULL,
    status payment_status NOT NULL DEFAULT 'pending',
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'TMT',
    reference_code VARCHAR(100) UNIQUE,
    confirmed_at TIMESTAMPTZ,
    confirmed_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    type payment_tx_type NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    performed_by UUID REFERENCES users(id),
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bank_transfer_proofs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES users(id),
    uploaded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS refunds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id),
    amount DECIMAL(10, 2) NOT NULL,
    reason TEXT,
    status refund_status NOT NULL DEFAULT 'pending',
    requested_by UUID NOT NULL REFERENCES users(id),
    processed_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ
);

-- =============================================================================
-- 11. NOTIFICATION SYSTEM
-- =============================================================================
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) NOT NULL,
    channel notification_channel NOT NULL,
    language VARCHAR(10) DEFAULT 'tk',
    subject VARCHAR(255),
    body_template TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE (event_type, channel, language)
);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    channel notification_channel NOT NULL,
    title VARCHAR(255),
    body TEXT,
    data JSONB,
    status notification_status NOT NULL DEFAULT 'queued',
    sent_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    error_message TEXT,
    retry_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    sms_enabled BOOLEAN DEFAULT TRUE,
    email_enabled BOOLEAN DEFAULT TRUE,
    push_enabled BOOLEAN DEFAULT TRUE,
    marketing_enabled BOOLEAN DEFAULT FALSE
);

-- =============================================================================
-- 12. REVIEWS & TRUST SYSTEM
-- =============================================================================
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID UNIQUE REFERENCES orders(id),
    customer_id UUID NOT NULL REFERENCES users(id),
    seller_id UUID NOT NULL REFERENCES sellers(id),
    product_id UUID REFERENCES products(id),
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    images JSONB,
    is_verified_purchase BOOLEAN DEFAULT TRUE,
    is_visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS review_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID NOT NULL UNIQUE REFERENCES reviews(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES sellers(id),
    response_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS seller_ratings (
    seller_id UUID PRIMARY KEY REFERENCES sellers(id) ON DELETE CASCADE,
    avg_rating DECIMAL(3, 2) DEFAULT 0,
    total_reviews INT DEFAULT 0,
    five_star INT DEFAULT 0,
    four_star INT DEFAULT 0,
    three_star INT DEFAULT 0,
    two_star INT DEFAULT 0,
    one_star INT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS issue_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL REFERENCES users(id),
    target_type report_target NOT NULL,
    target_id UUID NOT NULL,
    reason TEXT NOT NULL,
    status report_status NOT NULL DEFAULT 'open',
    admin_note TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES users(id)
);

-- =============================================================================
-- 13. GIFT BUILDER
-- =============================================================================
CREATE TABLE IF NOT EXISTS gift_builder_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES users(id),
    occasion_id UUID NOT NULL REFERENCES occasions(id),
    budget DECIMAL(10, 2),
    selected_suggestion_id UUID REFERENCES occasion_suggestions(id),
    custom_message TEXT,
    recipient_name VARCHAR(255),
    personalization_input TEXT,
    session_data JSONB,
    converted_to_order_id UUID REFERENCES orders(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS saved_occasions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    occasion_name VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    occasion_date DATE NOT NULL,
    reminder_days_before INT DEFAULT 3,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_reminded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 14. SUBSCRIPTION SYSTEM
-- =============================================================================
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    frequency subscription_frequency NOT NULL,
    base_price DECIMAL(10, 2) NOT NULL,
    includes_description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES sellers(id),
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    status subscription_status NOT NULL DEFAULT 'active',
    delivery_address_id UUID REFERENCES user_addresses(id),
    next_delivery_date DATE,
    last_delivery_date DATE,
    started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    cancelled_at TIMESTAMPTZ,
    pause_until DATE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subscription_deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id),
    scheduled_date DATE NOT NULL,
    status subscription_delivery_status NOT NULL DEFAULT 'scheduled',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 15. ADMIN SYSTEM
-- =============================================================================
CREATE TABLE IF NOT EXISTS admin_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES users(id),
    action VARCHAR(255) NOT NULL,
    target_type VARCHAR(100),
    target_id VARCHAR(255),
    previous_value JSONB,
    new_value JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(255) PRIMARY KEY,
    value JSONB,
    description TEXT,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS featured_products (
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    position INT NOT NULL,
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    added_by UUID REFERENCES users(id),
    PRIMARY KEY (product_id)
);

CREATE TABLE IF NOT EXISTS banners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255),
    image_url VARCHAR(500) NOT NULL,
    link_url VARCHAR(500),
    position banner_position NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    sort_order INT DEFAULT 0,
    created_by UUID REFERENCES users(id)
);

-- =============================================================================
-- 16. ANALYTICS SYSTEM
-- =============================================================================
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) NOT NULL,
    user_id UUID REFERENCES users(id),
    session_id VARCHAR(255),
    data JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_date ON analytics_events(created_at);

CREATE TABLE IF NOT EXISTS daily_stats (
    stat_date DATE PRIMARY KEY,
    total_orders INT DEFAULT 0,
    completed_orders INT DEFAULT 0,
    cancelled_orders INT DEFAULT 0,
    total_revenue DECIMAL(12, 2) DEFAULT 0,
    new_customers INT DEFAULT 0,
    returning_customers INT DEFAULT 0,
    avg_order_value DECIMAL(10, 2) DEFAULT 0,
    top_products JSONB,
    top_sellers JSONB,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS seller_daily_stats (
    seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
    stat_date DATE NOT NULL,
    orders INT DEFAULT 0,
    revenue DECIMAL(12, 2) DEFAULT 0,
    avg_rating DECIMAL(3, 2) DEFAULT 0,
    PRIMARY KEY (seller_id, stat_date)
);

-- =============================================================================
-- 17. SEARCH & MISC
-- =============================================================================
CREATE TABLE IF NOT EXISTS search_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query VARCHAR(255) NOT NULL,
    user_id UUID REFERENCES users(id),
    results_count INT DEFAULT 0,
    clicked_product_id UUID REFERENCES products(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Cart (kept from existing)
CREATE TABLE IF NOT EXISTS carts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    session_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    variant_id UUID REFERENCES product_variants(id),
    quantity INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(cart_id, product_id, variant_id)
);

-- Wishlists (kept from existing)
CREATE TABLE IF NOT EXISTS wishlists (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, product_id)
);

-- Promotion usages
CREATE TABLE IF NOT EXISTS promotion_usages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    order_id UUID NOT NULL REFERENCES orders(id),
    discount_applied DECIMAL(10, 2) NOT NULL,
    used_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(promotion_id, user_id)
);

-- =============================================================================
-- TRIGGERS: Auto-update updated_at
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN
        SELECT table_name FROM information_schema.columns
        WHERE column_name = 'updated_at'
        AND table_schema = 'public'
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS update_%I_updated_at ON %I;
            CREATE TRIGGER update_%I_updated_at
            BEFORE UPDATE ON %I
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        ', t, t, t, t);
    END LOOP;
END $$;

-- =============================================================================
-- TRIGGER: Auto-update search_vector on products
-- =============================================================================
CREATE OR REPLACE FUNCTION update_product_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector = to_tsvector('simple', COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.description, ''));
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_products_search_vector ON products;
CREATE TRIGGER update_products_search_vector
BEFORE INSERT OR UPDATE OF title, description ON products
FOR EACH ROW EXECUTE FUNCTION update_product_search_vector();

-- =============================================================================
-- PERFORMANCE INDEXES
-- =============================================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_delivery_date ON orders(delivery_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_active_next_del ON subscriptions(next_delivery_date) WHERE status = 'active';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_saved_occasions_active_date ON saved_occasions(occasion_date) WHERE is_active = TRUE;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_personalization_jobs_status ON personalization_jobs(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_phone_verifications_phone ON phone_verifications(phone);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_acc_token ON user_sessions(access_token_hash);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_status ON notifications(user_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_couriers_status ON couriers(status);

-- =============================================================================
-- CRON SCHEDULES (ANALYTICS CLEANUP)
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION cleanup_old_analytics_events()
RETURNS void AS $$
BEGIN
    DELETE FROM analytics_events WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Schedule nightly at 02:00 Ashgabat time (UTC+5) => 21:00 UTC
SELECT cron.schedule('cleanup_analytics_events', '0 21 * * *', 'SELECT cleanup_old_analytics_events()');
