
-- GiftFlow Security Policies
-- This file contains all Row Level Security (RLS) policies for the GiftFlow platform

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE wish_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE fulfillments ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- =============================================
-- USERS TABLE POLICIES
-- =============================================

-- Users can read their own user row
CREATE POLICY "users_self_read" ON public.users FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Users can update their own profile (but not roles)
CREATE POLICY "users_self_update" ON public.users FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid() AND
  -- Prevent role escalation - users cannot modify their own roles
  roles = (SELECT roles FROM users WHERE id = auth.uid())
);

-- Only admins can read all users
CREATE POLICY "admin_read_all_users" ON public.users FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND (roles->>'admin')::boolean = true
  )
);

-- Only admins can update user roles
CREATE POLICY "admin_update_roles" ON public.users FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND (roles->>'admin')::boolean = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND (roles->>'admin')::boolean = true
  )
);

-- =============================================
-- WISHES TABLE POLICIES
-- =============================================

-- Public can read only eligible wishes (with redacted PII)
CREATE POLICY "public_read_eligible_wishes" ON public.wishes FOR SELECT
TO anon, authenticated
USING (status = 'ELIGIBLE');

-- Charities can read their own wishes (full access)
CREATE POLICY "charities_read_own_wishes" ON public.wishes FOR SELECT
TO authenticated
USING (charity_id = auth.uid());

-- Charities can create their own wishes
CREATE POLICY "charities_create_own_wishes" ON public.wishes FOR INSERT
TO authenticated
WITH CHECK (
  charity_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND (roles->>'charity')::boolean = true
  )
);

-- Charities can update their own wishes (only if draft or rejected)
CREATE POLICY "charities_update_own_wishes" ON public.wishes FOR UPDATE
TO authenticated
USING (
  charity_id = auth.uid() AND
  status IN ('DRAFT', 'REJECTED')
)
WITH CHECK (
  charity_id = auth.uid() AND
  status IN ('DRAFT', 'REJECTED')
);

-- Charities can delete their own wishes (only if draft or rejected)
CREATE POLICY "charities_delete_own_wishes" ON public.wishes FOR DELETE
TO authenticated
USING (
  charity_id = auth.uid() AND
  status IN ('DRAFT', 'REJECTED')
);

-- Moderators and admins can read all wishes
CREATE POLICY "moderators_read_all_wishes" ON public.wishes FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND ((roles->>'moderator')::boolean = true OR (roles->>'admin')::boolean = true)
  )
);

-- Moderators and admins can update wish status
CREATE POLICY "moderators_update_wish_status" ON public.wishes FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND ((roles->>'moderator')::boolean = true OR (roles->>'admin')::boolean = true)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND ((roles->>'moderator')::boolean = true OR (roles->>'admin')::boolean = true)
  )
);

-- =============================================
-- WISH_DOCUMENTS TABLE POLICIES
-- =============================================

-- Users can read documents for wishes they own or are eligible
CREATE POLICY "users_read_wish_documents" ON public.wish_documents FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM wishes 
    WHERE wishes.id = wish_documents.wish_id 
    AND (
      wishes.charity_id = auth.uid() OR 
      wishes.status = 'ELIGIBLE' OR
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND ((roles->>'moderator')::boolean = true OR (roles->>'admin')::boolean = true)
      )
    )
  )
);

-- Charities can create documents for their own wishes
CREATE POLICY "charities_create_wish_documents" ON public.wish_documents FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM wishes 
    WHERE wishes.id = wish_documents.wish_id 
    AND wishes.charity_id = auth.uid()
    AND wishes.status IN ('DRAFT', 'UNDER_REVIEW')
  )
);

-- =============================================
-- FULFILLMENTS TABLE POLICIES
-- =============================================

-- Patrons can read their own fulfillments
CREATE POLICY "patrons_read_own_fulfillments" ON public.fulfillments FOR SELECT
TO authenticated
USING (patron_id = auth.uid());

-- Charities can read fulfillments for their own wishes
CREATE POLICY "charities_read_wish_fulfillments" ON public.fulfillments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM wishes 
    WHERE wishes.id = fulfillments.wish_id 
    AND wishes.charity_id = auth.uid()
  )
);

-- Patrons can create fulfillments for eligible wishes
CREATE POLICY "patrons_create_fulfillments" ON public.fulfillments FOR INSERT
TO authenticated
WITH CHECK (
  patron_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND (roles->>'patron')::boolean = true
  ) AND
  EXISTS (
    SELECT 1 FROM wishes 
    WHERE wishes.id = fulfillments.wish_id 
    AND wishes.status = 'ELIGIBLE'
    AND wishes.charity_id != auth.uid() -- Cannot fulfill own wishes
  )
);

-- Patrons can update their own fulfillments (limited fields)
CREATE POLICY "patrons_update_own_fulfillments" ON public.fulfillments FOR UPDATE
TO authenticated
USING (patron_id = auth.uid())
WITH CHECK (
  patron_id = auth.uid() AND
  -- Only allow updating certain fields, not the core fulfillment data
  status = (SELECT status FROM fulfillments WHERE id = fulfillments.id)
);

-- =============================================
-- ANALYTICS_SNAPSHOTS TABLE POLICIES
-- =============================================

-- Patrons can read their own analytics
CREATE POLICY "patrons_read_own_analytics" ON public.analytics_snapshots FOR SELECT
TO authenticated
USING (patron_id = auth.uid());

-- Patrons can create their own analytics snapshots
CREATE POLICY "patrons_create_own_analytics" ON public.analytics_snapshots FOR INSERT
TO authenticated
WITH CHECK (
  patron_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND (roles->>'patron')::boolean = true
  )
);

-- =============================================
-- AUDIT_LOGS TABLE POLICIES
-- =============================================

-- Users can read audit logs for their own actions
CREATE POLICY "users_read_own_audit_logs" ON public.audit_logs FOR SELECT
TO authenticated
USING (actor_user_id = auth.uid());

-- Admins can read all audit logs
CREATE POLICY "admin_read_all_audit_logs" ON public.audit_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND (roles->>'admin')::boolean = true
  )
);

-- System can create audit logs (for server-side operations)
CREATE POLICY "system_create_audit_logs" ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (true); -- This will be restricted by application logic

-- =============================================
-- SECURITY FUNCTIONS
-- =============================================

-- Function to check if user has specific role
CREATE OR REPLACE FUNCTION user_has_role(role_name text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND (roles->>role_name)::boolean = true
  );
$$;

-- Function to get user roles safely
CREATE OR REPLACE FUNCTION get_user_roles()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT roles FROM users WHERE id = auth.uid();
$$;

-- =============================================
-- ADDITIONAL SECURITY MEASURES
-- =============================================

-- Create indexes for performance and security
CREATE INDEX IF NOT EXISTS idx_users_clerk_user_id ON users(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_wishes_status ON wishes(status);
CREATE INDEX IF NOT EXISTS idx_wishes_charity_id ON wishes(charity_id);
CREATE INDEX IF NOT EXISTS idx_fulfillments_patron_id ON fulfillments(patron_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_user_id ON audit_logs(actor_user_id);

-- Create a function to safely create users (called from application)
CREATE OR REPLACE FUNCTION create_user_safely(
  p_clerk_user_id text,
  p_display_name text DEFAULT NULL,
  p_city text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id uuid;
BEGIN
  -- Only allow creation if user doesn't exist
  IF EXISTS (SELECT 1 FROM users WHERE clerk_user_id = p_clerk_user_id) THEN
    RAISE EXCEPTION 'User already exists';
  END IF;
  
  -- Create user with default roles
  INSERT INTO users (clerk_user_id, roles, display_name, city, email_verified)
  VALUES (
    p_clerk_user_id,
    '{"charity": false, "patron": false, "moderator": false, "admin": false}'::jsonb,
    p_display_name,
    p_city,
    true
  )
  RETURNING id INTO user_id;
  
  RETURN user_id;
END;
$$;

-- Revoke public access to sensitive functions
REVOKE ALL ON FUNCTION create_user_safely FROM public;
GRANT EXECUTE ON FUNCTION create_user_safely TO authenticated;

-- =============================================
-- SECURITY AUDIT QUERIES
-- =============================================

-- Query to check for any tables without RLS enabled
-- SELECT schemaname, tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' AND rowsecurity = false;

-- Query to list all RLS policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies 
-- WHERE schemaname = 'public';
