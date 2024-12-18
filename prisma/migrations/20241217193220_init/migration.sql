/*
  Warnings:

  - Added the required column `updatedAt` to the `Alert` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Alert" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "symbol" TEXT NOT NULL,
    "thresholdPercent" REAL NOT NULL,
    "timeframeMinutes" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "triggeredAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Alert" ("active", "createdAt", "id", "symbol", "thresholdPercent", "timeframeMinutes") SELECT "active", "createdAt", "id", "symbol", "thresholdPercent", "timeframeMinutes" FROM "Alert";
DROP TABLE "Alert";
ALTER TABLE "new_Alert" RENAME TO "Alert";
CREATE INDEX "Alert_symbol_status_idx" ON "Alert"("symbol", "status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
