-- Dev seed (idempotent-ish): demo user + sample org.
INSERT INTO users (id, email, password_hash)
VALUES ('00000000-0000-0000-0000-000000000001', 'demo@gigvora.dev', '$2b$12$placeholderplaceholderplaceholderplaceholderplaceholder')
ON CONFLICT (email) DO NOTHING;

INSERT INTO profiles (id, display_name, headline)
VALUES ('00000000-0000-0000-0000-000000000001', 'Demo User', 'Platform Demo Account')
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_roles (user_id, role)
VALUES ('00000000-0000-0000-0000-000000000001', 'professional')
ON CONFLICT DO NOTHING;
