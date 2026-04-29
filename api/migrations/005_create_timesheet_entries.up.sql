CREATE TABLE timesheet_entries (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id  UUID         NOT NULL REFERENCES user_projects(id) ON DELETE CASCADE,
  date        DATE         NOT NULL,
  hours       NUMERIC(5,2) NOT NULL CHECK (hours >= 0),
  UNIQUE (user_id, project_id, date)
);
