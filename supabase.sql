-- Supabase Schema for Fahrdienst SaaS (Multi-Tenant with Auth)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. TENANTS & USERS (AUTH)
-- ==========================================

-- Companies (Tenants) Table
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles (Links Supabase auth.users to companies)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  role TEXT DEFAULT 'user', -- e.g., 'admin', 'dispatcher', 'driver'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 2. CORE TABLES (Multi-Tenant)
-- ==========================================

-- Vehicles Table
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT,
  brand TEXT,
  model TEXT,
  license_plate TEXT,
  equipment JSONB DEFAULT '[]'::jsonb,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  pickup_address TEXT NOT NULL,
  dropoff_address TEXT NOT NULL,
  scheduled_start_time TIME NOT NULL,
  patient_label TEXT NOT NULL,
  notes TEXT,
  trip_duration_min INTEGER NOT NULL,
  trip_distance_km DECIMAL NOT NULL,
  planned_arrival_time TIME NOT NULL,
  last_calculated_at BIGINT,
  status TEXT NOT NULL,
  requirements JSONB DEFAULT '[]'::jsonb,
  insurance TEXT,
  billing_type TEXT,
  care_level INTEGER,
  phone TEXT,
  has_companion BOOLEAN DEFAULT false,
  is_recurring BOOLEAN DEFAULT false,
  trip_type TEXT NOT NULL,
  return_time TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assignments Table
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  sequence_index INTEGER NOT NULL,
  buffer_min INTEGER DEFAULT 10,
  transition_duration_min INTEGER DEFAULT 0,
  transition_distance_km DECIMAL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transport Sheets Table
CREATE TABLE IF NOT EXISTS transport_sheets (
  order_id UUID PRIMARY KEY REFERENCES orders(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  missing_reason TEXT,
  note TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pricing Config Table (Single Row per Company)
CREATE TABLE IF NOT EXISTS pricing_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  pkv JSONB NOT NULL,
  privat JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id)
);

-- GKV Pricing Table
CREATE TABLE IF NOT EXISTS gkv_pricing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  insurance_name TEXT NOT NULL,
  prices JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 3. AUTO-INJECT COMPANY_ID TRIGGER
-- ==========================================
-- This ensures that when a user creates a record, it automatically gets assigned to their company.

CREATE OR REPLACE FUNCTION set_company_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.company_id IS NULL THEN
    NEW.company_id := (SELECT company_id FROM public.profiles WHERE id = auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER set_company_id_vehicles BEFORE INSERT ON vehicles FOR EACH ROW EXECUTE FUNCTION set_company_id();
CREATE TRIGGER set_company_id_orders BEFORE INSERT ON orders FOR EACH ROW EXECUTE FUNCTION set_company_id();
CREATE TRIGGER set_company_id_assignments BEFORE INSERT ON assignments FOR EACH ROW EXECUTE FUNCTION set_company_id();
CREATE TRIGGER set_company_id_transport_sheets BEFORE INSERT ON transport_sheets FOR EACH ROW EXECUTE FUNCTION set_company_id();
CREATE TRIGGER set_company_id_pricing_config BEFORE INSERT ON pricing_config FOR EACH ROW EXECUTE FUNCTION set_company_id();
CREATE TRIGGER set_company_id_gkv_pricing BEFORE INSERT ON gkv_pricing FOR EACH ROW EXECUTE FUNCTION set_company_id();

-- ==========================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ==========================================
-- This ensures users can ONLY see and edit data belonging to their own company.

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE gkv_pricing ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's company_id
CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Profiles Policies
CREATE POLICY "Users can view users in their company" ON profiles FOR SELECT USING (company_id = get_user_company_id() OR id = auth.uid());
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (id = auth.uid());

-- Companies Policies
CREATE POLICY "Users can view their own company" ON companies FOR SELECT USING (id = get_user_company_id());

-- Vehicles Policies
CREATE POLICY "View company vehicles" ON vehicles FOR SELECT USING (company_id = get_user_company_id());
CREATE POLICY "Insert company vehicles" ON vehicles FOR INSERT WITH CHECK (company_id = get_user_company_id());
CREATE POLICY "Update company vehicles" ON vehicles FOR UPDATE USING (company_id = get_user_company_id());
CREATE POLICY "Delete company vehicles" ON vehicles FOR DELETE USING (company_id = get_user_company_id());

-- Orders Policies
CREATE POLICY "View company orders" ON orders FOR SELECT USING (company_id = get_user_company_id());
CREATE POLICY "Insert company orders" ON orders FOR INSERT WITH CHECK (company_id = get_user_company_id());
CREATE POLICY "Update company orders" ON orders FOR UPDATE USING (company_id = get_user_company_id());
CREATE POLICY "Delete company orders" ON orders FOR DELETE USING (company_id = get_user_company_id());

-- Assignments Policies
CREATE POLICY "View company assignments" ON assignments FOR SELECT USING (company_id = get_user_company_id());
CREATE POLICY "Insert company assignments" ON assignments FOR INSERT WITH CHECK (company_id = get_user_company_id());
CREATE POLICY "Update company assignments" ON assignments FOR UPDATE USING (company_id = get_user_company_id());
CREATE POLICY "Delete company assignments" ON assignments FOR DELETE USING (company_id = get_user_company_id());

-- Transport Sheets Policies
CREATE POLICY "View company transport sheets" ON transport_sheets FOR SELECT USING (company_id = get_user_company_id());
CREATE POLICY "Insert company transport sheets" ON transport_sheets FOR INSERT WITH CHECK (company_id = get_user_company_id());
CREATE POLICY "Update company transport sheets" ON transport_sheets FOR UPDATE USING (company_id = get_user_company_id());
CREATE POLICY "Delete company transport sheets" ON transport_sheets FOR DELETE USING (company_id = get_user_company_id());

-- Pricing Config Policies
CREATE POLICY "View company pricing config" ON pricing_config FOR SELECT USING (company_id = get_user_company_id());
CREATE POLICY "Insert company pricing config" ON pricing_config FOR INSERT WITH CHECK (company_id = get_user_company_id());
CREATE POLICY "Update company pricing config" ON pricing_config FOR UPDATE USING (company_id = get_user_company_id());
CREATE POLICY "Delete company pricing config" ON pricing_config FOR DELETE USING (company_id = get_user_company_id());

-- GKV Pricing Policies
CREATE POLICY "View company gkv pricing" ON gkv_pricing FOR SELECT USING (company_id = get_user_company_id());
CREATE POLICY "Insert company gkv pricing" ON gkv_pricing FOR INSERT WITH CHECK (company_id = get_user_company_id());
CREATE POLICY "Update company gkv pricing" ON gkv_pricing FOR UPDATE USING (company_id = get_user_company_id());
CREATE POLICY "Delete company gkv pricing" ON gkv_pricing FOR DELETE USING (company_id = get_user_company_id());

-- ==========================================
-- 5. AUTH TRIGGERS (Auto-create Company & Profile)
-- ==========================================

-- Trigger function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  new_company_id UUID;
  extracted_first_name TEXT;
  extracted_last_name TEXT;
  extracted_company_name TEXT;
  full_name TEXT;
BEGIN
  -- Extract names from metadata (handle both email/password and Google OAuth)
  extracted_first_name := NEW.raw_user_meta_data->>'first_name';
  extracted_last_name := NEW.raw_user_meta_data->>'last_name';
  full_name := NEW.raw_user_meta_data->>'full_name';
  
  -- If Google OAuth was used, first_name might be null but full_name exists
  IF extracted_first_name IS NULL AND full_name IS NOT NULL THEN
    extracted_first_name := split_part(full_name, ' ', 1);
    extracted_last_name := substring(full_name from length(extracted_first_name) + 2);
  END IF;

  -- Default company name if not provided
  extracted_company_name := NEW.raw_user_meta_data->>'company_name';
  IF extracted_company_name IS NULL THEN
    extracted_company_name := COALESCE(extracted_first_name || 's Firma', 'Meine Firma');
  END IF;

  -- Create a new company based on user metadata
  INSERT INTO public.companies (name)
  VALUES (extracted_company_name)
  RETURNING id INTO new_company_id;

  -- Create the profile and link to the new company
  INSERT INTO public.profiles (id, company_id, first_name, last_name, role)
  VALUES (
    NEW.id,
    new_company_id,
    extracted_first_name,
    extracted_last_name,
    'admin' -- First user of the company is admin
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
