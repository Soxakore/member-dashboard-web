-- CreateTable
CREATE TABLE "AllianceEventConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventName" TEXT NOT NULL,
    "selectedTime" TEXT NOT NULL,
    "customDays" TEXT,
    "updatedAt" DATETIME NOT NULL,
    "updatedById" TEXT NOT NULL,
    CONSTRAINT "AllianceEventConfig_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "AllianceEventConfig_eventName_key" ON "AllianceEventConfig"("eventName");
