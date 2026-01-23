-- =============================================
-- Seed Database : Auth Login, Register, Role Management, Reset Password & Email Verification
-- =============================================

-- @roles
INSERT INTO public.roles (role_name, short_desc, record_status)
VALUES
    ('Super Admin', 'Full access', 'published'),
    ('Admin',       'Manage users & content', 'published'),
    ('Marketing',   'Campaigns & analytics', 'published'),
    ('Finance',     'Payments & invoices', 'published'),
    ('Crew',        'Operational team', 'published')
ON CONFLICT (role_name) DO NOTHING;

-- @permissions
INSERT INTO public.permissions (permission_name, short_desc, permissions_status, record_status)
VALUES
    ('dashboard.view','View dashboard','active','published'),
    ('dashboard.analytics','View analytics','active','published'),
    ('users.view','View users','active','published'),
    ('users.create','Create user','active','published'),
    ('users.edit','Edit user','active','published'),
    ('users.delete','Delete user','active','published'),
    ('users.manage_roles','Manage roles','active','published'),
    ('roles.view','View roles','active','published'),
    ('roles.create','Create role','active','published'),
    ('roles.edit','Edit role','active','published'),
    ('roles.delete','Delete role','active','published'),
    ('permissions.view','View permissions','active','published'),
    ('auth.sessions.view','View sessions','active','published'),
    ('auth.sessions.revoke','Revoke sessions','active','published'),
    ('auth.logs.view','View auth logs','active','published'),
    ('campaigns.manage','Manage campaigns','active','published'),
    ('finance.transactions.view','View transactions','active','published'),
    ('finance.payments.approve','Approve payments','active','published'),
    ('system.settings.edit','Edit system settings','active','published')
ON CONFLICT (permission_name) DO NOTHING;

-- @super-admin
DO $$
DECLARE
    superadmin_uuid UUID;
    superadmin_role_uuid UUID;
BEGIN
    INSERT INTO public.users (username, full_name, email, password_hash, is_email_verified, users_status, record_status)
    VALUES (
        'superadmin', 'Super Administrator', 'superadmin@yourapp.com',
        '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- PASSWORD: SuperAdmin123!
        true, 'active', 'published'
    )
    ON CONFLICT (username) DO UPDATE SET email = EXCLUDED.email
    RETURNING id_users INTO superadmin_uuid;

    IF superadmin_uuid IS NULL THEN
        SELECT id_users INTO superadmin_uuid FROM public.users WHERE username = 'superadmin';
    END IF;

    SELECT id_roles INTO superadmin_role_uuid FROM public.roles WHERE role_name = 'Super Admin';

    INSERT INTO public.user_roles (id_users, id_roles, record_status)
    VALUES (superadmin_uuid, superadmin_role_uuid, 'published')
    ON CONFLICT (id_users, id_roles) WHERE record_status = 'published' DO NOTHING;

    INSERT INTO public.role_permissions (id_roles, id_permissions, record_status)
    SELECT superadmin_role_uuid, id_permissions, 'published'
    FROM public.permissions
    ON CONFLICT (id_roles, id_permissions) WHERE record_status = 'published' DO NOTHING;
END $$;

-- @user
INSERT INTO public.users (username, full_name, email, password_hash, users_status, record_status, is_email_verified)
VALUES
    ('admin',       'Admin User',       'admin@yourapp.com',       '$2y$10$adminhash1234567890', 'active','published',true),
    ('marketing01', 'Budi Marketing',  'budi@yourapp.com',        '$2y$10$markhash123', 'active','published',true),
    ('finance01',   'Siti Finance',     'siti@yourapp.com',        '$2y$10$finhash123', 'active','published',true),
    ('crew01',      'Andi Crew',        'andi@yourapp.com',        '$2y$10$crewhash123', 'active','published',false)
ON CONFLICT (username) DO NOTHING;

-- @assign-role(user)
INSERT INTO public.user_roles (id_users, id_roles, record_status)
SELECT u.id_users, r.id_roles, 'published'
FROM public.users u
JOIN public.roles r ON (
    (u.username = 'admin'       AND r.role_name = 'Admin') OR
    (u.username = 'marketing01' AND r.role_name = 'Marketing') OR
    (u.username = 'finance01'   AND r.role_name = 'Finance') OR
    (u.username = 'crew01'      AND r.role_name = 'Crew')
)
ON CONFLICT (id_users, id_roles) WHERE record_status = 'published' DO NOTHING;

-- @permission
-- @admin: semua kecuali revoke session & system settings
INSERT INTO public.role_permissions (id_roles, id_permissions, record_status)
SELECT r.id_roles, p.id_permissions, 'published'
FROM public.roles r, public.permissions p
WHERE r.role_name = 'Admin'
  AND p.permission_name NOT IN ('auth.sessions.revoke', 'system.settings.edit')
ON CONFLICT DO NOTHING;

-- @marketing: hanya campaign & dashboard
INSERT INTO public.role_permissions (id_roles, id_permissions, record_status)
SELECT r.id_roles, p.id_permissions, 'published'
FROM public.roles r, public.permissions p
WHERE r.role_name = 'Marketing'
  AND p.permission_name IN ('dashboard.view', 'dashboard.analytics', 'campaigns.manage')
ON CONFLICT DO NOTHING;

-- @finance: finance + view users
INSERT INTO public.role_permissions (id_roles, id_permissions, record_status)
SELECT r.id_roles, p.id_permissions, 'published'
FROM public.roles r, public.permissions p
WHERE r.role_name = 'Finance'
  AND p.permission_name LIKE 'finance.%' OR p.permission_name = 'users.view'
ON CONFLICT DO NOTHING;

-- @crew: hanya dashboard
INSERT INTO public.role_permissions (id_roles, id_permissions, record_status)
SELECT r.id_roles, p.id_permissions, 'published'
FROM public.roles r, public.permissions p
WHERE r.role_name = 'Crew'
  AND p.permission_name = 'dashboard.view'
ON CONFLICT DO NOTHING;

-- @auth-logs
INSERT INTO public.auth_logs (id_users, ip_address, user_agent, token_hash, is_active)
SELECT id_users, '127.0.0.1'::inet, 'Chrome/130', encode(sha256(random()::text::bytea), 'hex'), true
FROM public.users WHERE username IN ('superadmin', 'admin')
ON CONFLICT DO NOTHING;

-- =============================================
-- Seed Finished!
-- Total:
--   1 Super Admin (full access)
--   4 User contoh (Admin, Marketing, Finance, Crew)
--   20 Permission
--   Semua role-permission mapping logis
--   2 Session aktif untuk testing
-- =============================================

-- Perview
SELECT 'Users count' AS info, COUNT(*) FROM public.users
UNION ALL
SELECT 'Roles count', COUNT(*) FROM public.roles
UNION ALL
SELECT 'Permissions count', COUNT(*) FROM public.permissions
UNION ALL
SELECT 'User Roles count', COUNT(*) FROM public.user_roles
UNION ALL
SELECT 'Role Permissions count', COUNT(*) FROM public.role_permissions;