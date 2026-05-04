CREATE TYPE invoice_file_type AS ENUM ('invoice', 'summary');

CREATE TABLE invoice_files (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id  UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  file_type   invoice_file_type NOT NULL,  
  s3_key      TEXT NOT NULL,               
  file_name   TEXT NOT NULL,               
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (invoice_id, file_type)           
);