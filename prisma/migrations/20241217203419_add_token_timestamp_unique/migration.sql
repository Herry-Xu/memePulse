/*
  Warnings:

  - A unique constraint covering the columns `[token,timestamp]` on the table `PriceHistory` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "PriceHistory_token_timestamp_key" ON "PriceHistory"("token", "timestamp");
