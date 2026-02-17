/*
  Warnings:

  - You are about to drop the column `creatorId` on the `Event` table. All the data in the column will be lost.
  - The primary key for the `EventAttendee` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `status` on the `EventAttendee` table. All the data in the column will be lost.
  - You are about to drop the column `minRole` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Post` table. All the data in the column will be lost.
  - You are about to alter the column `power` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Int` to `BigInt`.
  - Added the required column `userId` to the `Event` table without a default value. This is not possible if the table is not empty.
  - The required column `id` was added to the `EventAttendee` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- CreateTable
CREATE TABLE "MapLocation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "x" REAL NOT NULL,
    "y" REAL NOT NULL,
    "label" TEXT,
    "type" TEXT NOT NULL DEFAULT 'RESOURCE',
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,
    CONSTRAINT "MapLocation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startTime" DATETIME NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'GATHERING',
    "location" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Event_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Event" ("createdAt", "description", "id", "location", "startTime", "title", "type", "updatedAt") SELECT "createdAt", "description", "id", "location", "startTime", "title", "type", "updatedAt" FROM "Event";
DROP TABLE "Event";
ALTER TABLE "new_Event" RENAME TO "Event";
CREATE TABLE "new_EventAttendee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    CONSTRAINT "EventAttendee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EventAttendee_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_EventAttendee" ("eventId", "userId") SELECT "eventId", "userId" FROM "EventAttendee";
DROP TABLE "EventAttendee";
ALTER TABLE "new_EventAttendee" RENAME TO "EventAttendee";
CREATE UNIQUE INDEX "EventAttendee_userId_eventId_key" ON "EventAttendee"("userId", "eventId");
CREATE TABLE "new_Post" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "authorId" TEXT NOT NULL,
    CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Post" ("authorId", "content", "createdAt", "id", "title") SELECT "authorId", "content", "createdAt", "id", "title" FROM "Post";
DROP TABLE "Post";
ALTER TABLE "new_Post" RENAME TO "Post";
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "loginId" TEXT NOT NULL,
    "pinHash" TEXT NOT NULL,
    "username" TEXT,
    "avatarUrl" TEXT,
    "role" TEXT NOT NULL DEFAULT 'R1',
    "furnaceLevel" INTEGER,
    "power" BIGINT DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("avatarUrl", "createdAt", "furnaceLevel", "id", "loginId", "pinHash", "power", "role", "updatedAt", "username") SELECT "avatarUrl", "createdAt", "furnaceLevel", "id", "loginId", "pinHash", "power", "role", "updatedAt", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_loginId_key" ON "User"("loginId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
