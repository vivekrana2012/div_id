CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    username      VARCHAR(50)  NOT NULL UNIQUE,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(72)  NOT NULL,
    display_name  VARCHAR(100),
    failed_attempts INTEGER NOT NULL DEFAULT 0,
    lockout_until TIMESTAMP,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS posts (
    id         TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title      VARCHAR(500) NOT NULL,
    body       TEXT NOT NULL DEFAULT '',
    notes      TEXT NOT NULL DEFAULT '',
    status     VARCHAR(20) NOT NULL DEFAULT 'draft',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id         TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id  VARCHAR(100) NOT NULL,
    token_hash VARCHAR(500) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, device_id)
);

CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_status  ON posts(status);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

CREATE TABLE IF NOT EXISTS link_metadata (
    url         TEXT PRIMARY KEY,
    title       TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    image_url   TEXT NOT NULL DEFAULT '',
    site_name   TEXT NOT NULL DEFAULT '',
    fetched_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
