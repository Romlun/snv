-- Create custom types
CREATE TYPE relationship_status AS ENUM ('Engaged', 'Steady', 'Cooling', 'At risk', 'Inactive');
CREATE TYPE donor_stage AS ENUM ('New contact', 'First conversation', 'Interested', 'Active donor', 'Monthly supporter', 'Major donor', 'Needs re-engagement', 'Inactive');
CREATE TYPE contact_type AS ENUM ('call', 'email', 'text', 'meeting', 'church visit', 'event');
CREATE TYPE project_status AS ENUM ('Idea', 'Planning', 'Active', 'Waiting', 'Completed', 'Cancelled');
CREATE TYPE task_status AS ENUM ('Not started', 'In progress', 'Waiting', 'Completed', 'Cancelled');
CREATE TYPE task_priority AS ENUM ('Low', 'Medium', 'High');
CREATE TYPE user_role AS ENUM ('Admin', 'Director', 'Donor Relations', 'Church Relations', 'Staff');

-- Define Default Organization ID
-- We use a fixed UUID for "Light in the East"
CREATE OR REPLACE FUNCTION get_default_org_id() RETURNS UUID AS $$
BEGIN
    RETURN '018f3a3a-3c3c-7000-a5a5-4e4e4e4e4e4e'::UUID;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 1. Organizations
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Default Organization
INSERT INTO organizations (id, name) VALUES (get_default_org_id(), 'Light in the East');

-- 2. Profiles (Extends Auth.Users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    org_id UUID REFERENCES organizations(id) DEFAULT get_default_org_id(),
    full_name TEXT,
    email TEXT UNIQUE NOT NULL,
    role user_role DEFAULT 'Staff',
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Staff (Detailed staff info if different from profiles)
CREATE TABLE staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE DEFAULT get_default_org_id(),
    title TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Churches
CREATE TABLE churches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE DEFAULT get_default_org_id(),
    name TEXT NOT NULL,
    pastor TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    denomination TEXT,
    relationship_status relationship_status DEFAULT 'Steady',
    engagement_score INTEGER DEFAULT 50,
    assigned_staff_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    next_visit_date DATE,
    total_giving DECIMAL(12,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Donors
CREATE TABLE donors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE DEFAULT get_default_org_id(),
    church_id UUID REFERENCES churches(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    relationship_status relationship_status DEFAULT 'Steady',
    stage donor_stage DEFAULT 'New contact',
    assigned_staff_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    last_contact_date DATE,
    next_follow_up_date DATE,
    interests TEXT[],
    preferred_contact_method TEXT,
    tags TEXT[],
    engagement_score INTEGER DEFAULT 50,
    notes TEXT,
    lifetime_giving DECIMAL(12,2) DEFAULT 0,
    years_supported INTEGER DEFAULT 0,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_amount DECIMAL(10,2),
    recurring_cadence TEXT,
    card_expiry TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Projects
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE DEFAULT get_default_org_id(),
    name TEXT NOT NULL,
    description TEXT,
    goal_description TEXT,
    budget_needed DECIMAL(12,2) DEFAULT 0,
    current_funding DECIMAL(12,2) DEFAULT 0,
    start_date DATE,
    end_date DATE,
    status project_status DEFAULT 'Planning',
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project Assignments (Many-to-Many)
CREATE TABLE project_staff (
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    PRIMARY KEY (project_id, staff_id)
);

-- 7. Tasks
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE DEFAULT get_default_org_id(),
    title TEXT NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    related_to_id UUID, -- Polymorphic relation (Donor, Church, Project)
    related_to_type TEXT, -- 'donor', 'church', 'project'
    due_date TIMESTAMPTZ,
    priority task_priority DEFAULT 'Medium',
    status task_status DEFAULT 'Not started',
    completed_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Contact Logs
CREATE TABLE contact_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE DEFAULT get_default_org_id(),
    donor_id UUID REFERENCES donors(id) ON DELETE SET NULL,
    church_id UUID REFERENCES churches(id) ON DELETE SET NULL,
    staff_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    contact_date TIMESTAMPTZ DEFAULT NOW(),
    type contact_type NOT NULL,
    notes TEXT,
    outcome TEXT,
    next_step TEXT,
    next_follow_up_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Resources / Inventory
CREATE TABLE resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE DEFAULT get_default_org_id(),
    title TEXT NOT NULL,
    category TEXT,
    quantity_available INTEGER DEFAULT 0,
    quantity_sold INTEGER DEFAULT 0,
    quantity_given INTEGER DEFAULT 0,
    price DECIMAL(10,2),
    location TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Resource Transactions
CREATE TABLE resource_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE DEFAULT get_default_org_id(),
    resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
    donor_id UUID REFERENCES donors(id) ON DELETE SET NULL,
    church_id UUID REFERENCES churches(id) ON DELETE SET NULL,
    staff_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    type TEXT NOT NULL, -- 'sale', 'donation', 'restock', 'correction'
    amount DECIMAL(10,2), -- if sale
    transaction_date TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT
);

-- 10. Budget Entries
CREATE TABLE budget_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE DEFAULT get_default_org_id(),
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    category TEXT NOT NULL, -- 'General', 'Projects', 'Events', 'Travel', 'Resources', 'Staff', 'Media'
    name TEXT NOT NULL,
    needed DECIMAL(12,2) DEFAULT 0,
    raised DECIMAL(12,2) DEFAULT 0,
    is_project_based BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE churches ENABLE ROW LEVEL SECURITY;
ALTER TABLE donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_entries ENABLE ROW LEVEL SECURITY;

-- Multi-tenant policies (users can only see their organization's data)
CREATE POLICY "Users can view their own organization" ON organizations FOR SELECT USING (id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert profiles" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view donors in their org" ON donors FOR SELECT USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users can insert donors in their org" ON donors FOR INSERT WITH CHECK (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users can update donors in their org" ON donors FOR UPDATE USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can view churches in their org" ON churches FOR SELECT USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users can view projects in their org" ON projects FOR SELECT USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users can view tasks in their org" ON tasks FOR SELECT USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users can view contact logs in their org" ON contact_logs FOR SELECT USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- Function to handle new user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    first_user_role user_role := 'Staff';
    default_org_id UUID := get_default_org_id();
BEGIN
    -- Check if this is the first user
    IF (SELECT count(*) FROM public.profiles) = 0 THEN
        first_user_role := 'Admin';
    END IF;

    INSERT INTO public.profiles (id, email, full_name, role, org_id)
    VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', first_user_role, default_org_id);
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
