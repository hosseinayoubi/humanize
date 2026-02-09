-- prisma/migrations/20260203000000_make_email_nullable/migration.sql

ALTER TABLE "users"
  ALTER COLUMN "email" DROP NOT NULL;

-- اگر constraint unique هست، همون می‌مونه و NULL های متعدد مشکلی ندارن.
-- ولی اگر جایی unique خراب شده بود، این‌ها کمک می‌کنن:
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'users_email_key') THEN
    CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
  END IF;
END $$;
