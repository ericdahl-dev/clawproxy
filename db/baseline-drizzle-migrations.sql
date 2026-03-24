-- One-time fixes for drizzle-kit migrate + Neon branching:
-- 1) Empty __drizzle_migrations while tables already exist (e.g. after db:push).
-- 2) A row for 0002 with created_at lower than 0001’s (breaks Drizzle’s “max(created_at)” check).
--
-- Hashes are SHA-256 of each db/migrations/<tag>.sql file. created_at must match
-- db/migrations/meta/_journal.json "when" and increase with migration index.

UPDATE drizzle.__drizzle_migrations
SET created_at = 1774322729407::bigint
WHERE hash = 'e7e0da21bd642dd224ef85b89f8d4f29b349525901fdcad9cde454792ae26f8d'
  AND created_at < 1774322729406::bigint;

INSERT INTO drizzle.__drizzle_migrations ("hash", "created_at")
SELECT 'd15f8da1594d56975cb8c0cac5d8d944f546ffe38fdedaa9d15a75e48826b348', 1774123011028::bigint
WHERE NOT EXISTS (
  SELECT 1 FROM drizzle.__drizzle_migrations WHERE hash = 'd15f8da1594d56975cb8c0cac5d8d944f546ffe38fdedaa9d15a75e48826b348'
);

INSERT INTO drizzle.__drizzle_migrations ("hash", "created_at")
SELECT 'c2fbf77da07e7b8d5d0f53b8b2687a14f5d6d61fd300118f8eceb416d4d55973', 1774322729406::bigint
WHERE NOT EXISTS (
  SELECT 1 FROM drizzle.__drizzle_migrations WHERE hash = 'c2fbf77da07e7b8d5d0f53b8b2687a14f5d6d61fd300118f8eceb416d4d55973'
);

INSERT INTO drizzle.__drizzle_migrations ("hash", "created_at")
SELECT 'e7e0da21bd642dd224ef85b89f8d4f29b349525901fdcad9cde454792ae26f8d', 1774322729407::bigint
WHERE NOT EXISTS (
  SELECT 1 FROM drizzle.__drizzle_migrations WHERE hash = 'e7e0da21bd642dd224ef85b89f8d4f29b349525901fdcad9cde454792ae26f8d'
);
