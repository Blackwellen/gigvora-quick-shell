-- Domain — File Storage (S3/R2 abstraction)
CREATE TABLE IF NOT EXISTS storage_buckets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE CHECK (length(name) BETWEEN 3 AND 63),
  provider text NOT NULL DEFAULT 's3' CHECK (provider IN ('s3','r2','gcs','azure','local')),
  region text,
  public_read boolean NOT NULL DEFAULT false,
  cdn_url text,
  retention_days integer CHECK (retention_days IS NULL OR retention_days BETWEEN 1 AND 36500),
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS storage_objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id uuid NOT NULL REFERENCES storage_buckets(id) ON DELETE CASCADE,
  key text NOT NULL CHECK (length(key) BETWEEN 1 AND 1024),
  owner_identity_id uuid NOT NULL,
  filename text NOT NULL,
  mime_type text NOT NULL,
  size_bytes bigint NOT NULL CHECK (size_bytes >= 0),
  checksum_sha256 text,
  visibility text NOT NULL DEFAULT 'private' CHECK (visibility IN ('private','public','signed')),
  upload_status text NOT NULL DEFAULT 'pending' CHECK (upload_status IN ('pending','uploading','complete','failed')),
  scan_status text NOT NULL DEFAULT 'pending' CHECK (scan_status IN ('pending','clean','infected','skipped')),
  scan_result jsonb NOT NULL DEFAULT '{}'::jsonb,
  variants jsonb NOT NULL DEFAULT '[]'::jsonb,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (bucket_id, key)
);
CREATE INDEX IF NOT EXISTS storage_obj_owner_idx ON storage_objects(owner_identity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS storage_obj_scan_idx ON storage_objects(scan_status) WHERE scan_status = 'pending';

CREATE TABLE IF NOT EXISTS storage_multipart_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  object_id uuid NOT NULL REFERENCES storage_objects(id) ON DELETE CASCADE,
  upload_id text NOT NULL,
  total_parts integer NOT NULL CHECK (total_parts BETWEEN 1 AND 10000),
  completed_parts integer NOT NULL DEFAULT 0 CHECK (completed_parts >= 0),
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','completed','aborted')),
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  CHECK (completed_parts <= total_parts)
);
CREATE INDEX IF NOT EXISTS storage_mp_object_idx ON storage_multipart_uploads(object_id);

CREATE TABLE IF NOT EXISTS storage_signed_urls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  object_id uuid NOT NULL REFERENCES storage_objects(id) ON DELETE CASCADE,
  url text NOT NULL,
  mode text NOT NULL CHECK (mode IN ('read','write')),
  issued_to uuid,
  expires_at timestamptz NOT NULL,
  consumed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS storage_signed_object_idx ON storage_signed_urls(object_id, expires_at);

CREATE TABLE IF NOT EXISTS storage_quotas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_identity_id uuid NOT NULL UNIQUE,
  max_bytes bigint NOT NULL CHECK (max_bytes >= 0),
  used_bytes bigint NOT NULL DEFAULT 0 CHECK (used_bytes >= 0),
  max_objects integer NOT NULL DEFAULT 100000 CHECK (max_objects >= 0),
  used_objects integer NOT NULL DEFAULT 0 CHECK (used_objects >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);
