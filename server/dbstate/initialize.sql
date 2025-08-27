CREATE TABLE IF NOT EXISTS users (
    identifier      TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    is_admin        INTEGER DEFAULT 0,
    completion_code TEXT UNIQUE
);

CREATE TABLE IF NOT EXISTS scans (
    user_id     TEXT NOT NULL,
    tag_id      TEXT NOT NULL,
    for_date    DATE NOT NULL DEFAULT (date('now', '-4 hours')),
    timestamp   DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, tag_id, for_date),
    FOREIGN KEY (user_id) REFERENCES users(identifier)
);

CREATE INDEX IF NOT EXISTS idx_user_scans ON scans (user_id);

CREATE TABLE IF NOT EXISTS tags (
    tag_id  TEXT PRIMARY KEY,
    label   TEXT
);