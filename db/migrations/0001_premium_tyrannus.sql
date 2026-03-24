-- headers_json changes from jsonb to text to store AES-256-GCM encrypted blobs.
-- The USING clause casts any existing plaintext jsonb rows to their text representation.
-- IMPORTANT: After applying this migration, any existing rows will contain unencrypted
-- JSON text. Run the data re-encryption script (see README) before going live, or
-- truncate the events table if no production data needs preserving.
ALTER TABLE "events" ALTER COLUMN "headers_json" SET DATA TYPE text USING "headers_json"::text;