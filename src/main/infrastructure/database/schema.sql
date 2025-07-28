-- OpenCook Database Schema
-- Clean Architecture - Infrastructure Layer

-- Profiles table for storing user checkout profiles
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  phone_number TEXT,
  
  -- Shipping address (required)
  shipping_first_name TEXT NOT NULL,
  shipping_last_name TEXT NOT NULL,
  shipping_address_line1 TEXT NOT NULL,
  shipping_address_line2 TEXT,
  shipping_city TEXT NOT NULL,
  shipping_state TEXT NOT NULL,
  shipping_postal_code TEXT NOT NULL,
  shipping_country TEXT NOT NULL,
  
  -- Billing address (optional)
  billing_first_name TEXT,
  billing_last_name TEXT,
  billing_address_line1 TEXT,
  billing_address_line2 TEXT,
  billing_city TEXT,
  billing_state TEXT,
  billing_postal_code TEXT,
  billing_country TEXT,
  
  -- Payment method (encrypted sensitive data)
  payment_method_type TEXT NOT NULL,
  payment_method_encrypted_data TEXT NOT NULL, -- JSON blob with encrypted sensitive data
  payment_holder_name TEXT NOT NULL,
  
  -- Profile metadata
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_used_at DATETIME,
  purchase_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Anti-scalping tracking
  daily_purchases TEXT NOT NULL DEFAULT '{}' -- JSON blob: {"2024-01-15": 2, "2024-01-16": 1}
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_name ON profiles(name);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_active ON profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);

-- Trigger to update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_profiles_updated_at
  AFTER UPDATE ON profiles
  FOR EACH ROW
  BEGIN
    UPDATE profiles SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

-- Add constraints for data integrity
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_name_case_insensitive 
  ON profiles(LOWER(name));