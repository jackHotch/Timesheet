CREATE TABLE configuration (
  id                        UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  hourly_rate               NUMERIC(10, 2) NOT NULL,
);

INSERT INTO configuration (hourly_rate) VALUES (50.00);
