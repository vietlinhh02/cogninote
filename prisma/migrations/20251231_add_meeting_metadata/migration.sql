-- Add metadata JSON column to meetings table
ALTER TABLE "meetings" ADD COLUMN "metadata" JSONB;
