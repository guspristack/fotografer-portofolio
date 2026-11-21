-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Photo" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "alt" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "credit" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "full" BYTEA NOT NULL,
    "thumbnail" BYTEA NOT NULL,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Series" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "revision" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeriesPhoto" (
    "seriesId" INTEGER NOT NULL,
    "photoId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "SeriesPhoto_pkey" PRIMARY KEY ("seriesId","photoId")
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "sid" VARCHAR NOT NULL,
    "sess" JSON NOT NULL,
    "expire" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
);

-- CreateIndex
CREATE UNIQUE INDEX "Photo_slug_key" ON "Photo"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Series_slug_key" ON "Series"("slug");

-- CreateIndex
CREATE INDEX "Series_published_position_idx" ON "Series"("published", "position");

-- CreateIndex
CREATE INDEX "SeriesPhoto_photoId_idx" ON "SeriesPhoto"("photoId");

-- CreateIndex
CREATE UNIQUE INDEX "SeriesPhoto_seriesId_position_key" ON "SeriesPhoto"("seriesId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE INDEX "session_expire_idx" ON "session"("expire");

-- AddForeignKey
ALTER TABLE "SeriesPhoto" ADD CONSTRAINT "SeriesPhoto_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeriesPhoto" ADD CONSTRAINT "SeriesPhoto_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "Photo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
