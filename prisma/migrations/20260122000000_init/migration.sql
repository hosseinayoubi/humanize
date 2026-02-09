CREATE TABLE IF NOT EXISTS "users" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "tier" TEXT NOT NULL DEFAULT 'free',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "usage" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "wordsProcessed" INTEGER NOT NULL,
  "cost" DECIMAL(10,4) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "usage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "texts" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "originalText" TEXT NOT NULL,
  "humanizedText" TEXT NOT NULL,
  "wordCount" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "texts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
CREATE INDEX IF NOT EXISTS "usage_userId_idx" ON "usage"("userId");
CREATE INDEX IF NOT EXISTS "texts_userId_idx" ON "texts"("userId");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'usage_userId_fkey') THEN
    ALTER TABLE "usage"
    ADD CONSTRAINT "usage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'texts_userId_fkey') THEN
    ALTER TABLE "texts"
    ADD CONSTRAINT "texts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
