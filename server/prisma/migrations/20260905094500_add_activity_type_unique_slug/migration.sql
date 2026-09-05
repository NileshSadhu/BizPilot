-- AddUniqueConstraint
CREATE UNIQUE INDEX "activity_types_sportId_slug_key" ON "activity_types"("sportId", "slug");
