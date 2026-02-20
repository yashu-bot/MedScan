/*
  Warnings:

  - Added the required column `updatedAt` to the `MedicalNote` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MedicalNote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content" TEXT NOT NULL,
    "doctorName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "patientId" TEXT NOT NULL,
    CONSTRAINT "MedicalNote_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_MedicalNote" ("content", "date", "id", "patientId") SELECT "content", "date", "id", "patientId" FROM "MedicalNote";
DROP TABLE "MedicalNote";
ALTER TABLE "new_MedicalNote" RENAME TO "MedicalNote";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
