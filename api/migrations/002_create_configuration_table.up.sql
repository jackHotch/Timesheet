CREATE TABLE configuration (
  id                        UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  item                      TEXT NOT NULL,
  item_value                TEXT
);

INSERT INTO configuration (item, item_value) VALUES ('hourly_rate', '50.00');
