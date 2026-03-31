-- =============================================================================
-- Seed Script: Test Customer User for Flora Platform
-- Password: Test123!
-- =============================================================================
-- NOTE: The password hash below is a bcrypt hash of 'Test123!'
-- If your Go backend uses a different hashing algorithm, regenerate accordingly.
-- This hash was generated with bcrypt cost 10.

-- 1. Insert the user
INSERT INTO users (id, email, phone, password_hash, role, is_verified, is_active)
VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'test@flora.tm',
    '+99361000001',
    '$2a$10$LQv3c1yqBo9SkvXS7QTJPeJH0vFPhHsuPnNmAGV7FzIFtO3/eUq6C',
    'customer',
    TRUE,
    TRUE
)
ON CONFLICT (email) DO NOTHING;

-- 2. Insert the user profile
INSERT INTO user_profiles (id, user_id, full_name, preferred_language)
VALUES (
    'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Test Customer',
    'tk'
)
ON CONFLICT (user_id) DO NOTHING;

-- 3. Insert a default address in Ashgabat
INSERT INTO user_addresses (id, user_id, label, city, district, street, building, apartment, lat, lng, is_default)
VALUES (
    'c3d4e5f6-a7b8-9012-cdef-123456789012',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Home',
    'Ashgabat',
    'Berkararlyk',
    'Magtymguly Avenue',
    '42',
    '15',
    37.9500700,
    58.3799900,
    TRUE
)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- Login credentials:
--   Email:    test@flora.tm
--   Phone:    +99361000001
--   Password: Test123!
-- =============================================================================
