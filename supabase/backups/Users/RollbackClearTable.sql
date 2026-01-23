TRUNCATE TABLE auth_logs,
email_verification_tokens,
password_reset_tokens,
permissions,
role_permissions,
roles,
user_roles,
users
RESTART IDENTITY CASCADE;