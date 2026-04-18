CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name      TEXT NOT NULL,
  last_name       TEXT NOT NULL,
  email           TEXT NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO users (first_name, last_name, email, password_hash)
VALUES ('Jack', 'Hotchkiss', 'jhotchkiss@dev.com', '$2a$12$9mnd.YW9ru4sSW08a.nUke4sqFkVtN/0Vs6cfHcPBMXdtoDNPF7qa');