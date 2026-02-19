-- CreateTable
CREATE TABLE "PlayerFID" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fid" TEXT NOT NULL,
    "nickname" TEXT,
    "furnaceLv" INTEGER,
    "kid" TEXT,
    "avatarUrl" TEXT,
    "lastChecked" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "PlayerFID_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GiftCode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "source" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "discoveredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME
);

-- CreateTable
CREATE TABLE "GiftCodeRedemption" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "redeemedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "giftCodeId" TEXT NOT NULL,
    "playerFidId" TEXT NOT NULL,
    CONSTRAINT "GiftCodeRedemption_giftCodeId_fkey" FOREIGN KEY ("giftCodeId") REFERENCES "GiftCode" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "GiftCodeRedemption_playerFidId_fkey" FOREIGN KEY ("playerFidId") REFERENCES "PlayerFID" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MinisterSlot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "position" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "timeSlot" TEXT NOT NULL,
    "weekStart" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "playerFidId" TEXT,
    "assignedById" TEXT,
    CONSTRAINT "MinisterSlot_playerFidId_fkey" FOREIGN KEY ("playerFidId") REFERENCES "PlayerFID" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MinisterSlot_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AttendanceSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventName" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "legion" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" DATETIME,
    "createdById" TEXT NOT NULL,
    CONSTRAINT "AttendanceSession_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AttendanceRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "points" BIGINT NOT NULL DEFAULT 0,
    "note" TEXT,
    "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT NOT NULL,
    "playerFidId" TEXT NOT NULL,
    CONSTRAINT "AttendanceRecord_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AttendanceSession" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AttendanceRecord_playerFidId_fkey" FOREIGN KEY ("playerFidId") REFERENCES "PlayerFID" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlayerChangeLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "changeType" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "detectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "playerFidId" TEXT NOT NULL,
    CONSTRAINT "PlayerChangeLog_playerFidId_fkey" FOREIGN KEY ("playerFidId") REFERENCES "PlayerFID" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "PlayerFID_fid_key" ON "PlayerFID"("fid");

-- CreateIndex
CREATE UNIQUE INDEX "GiftCode_code_key" ON "GiftCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "GiftCodeRedemption_giftCodeId_playerFidId_key" ON "GiftCodeRedemption"("giftCodeId", "playerFidId");

-- CreateIndex
CREATE UNIQUE INDEX "MinisterSlot_position_dayOfWeek_timeSlot_weekStart_key" ON "MinisterSlot"("position", "dayOfWeek", "timeSlot", "weekStart");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceRecord_sessionId_playerFidId_key" ON "AttendanceRecord"("sessionId", "playerFidId");
