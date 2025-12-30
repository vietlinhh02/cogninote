-- CreateTable
CREATE TABLE "analysis_results" (
    "id" TEXT NOT NULL,
    "meeting_id" TEXT NOT NULL,
    "analysis_type" TEXT NOT NULL,
    "summary" TEXT,
    "key_points" JSONB,
    "action_items" JSONB,
    "sentiment" TEXT,
    "topics" JSONB,
    "participants" JSONB,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analysis_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "analysis_results_meeting_id_idx" ON "analysis_results"("meeting_id");

-- CreateIndex
CREATE INDEX "analysis_results_analysis_type_idx" ON "analysis_results"("analysis_type");

-- AddForeignKey
ALTER TABLE "analysis_results" ADD CONSTRAINT "analysis_results_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
