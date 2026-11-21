import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { maxUploadBytes, photoSchema, revision, seriesSchema, slugSchema } from '../shared/content';
import { prisma } from './database';
import { contentId, HttpError, limitRequests, validate } from './http';
import { preparePhoto } from './images';

const photoMeta = {
  id: true, slug: true, title: true, alt: true, location: true, type: true, credit: true, source: true, width: true, height: true,
} as const;
const seriesOrder = [{ position: 'asc' }, { id: 'asc' }] as const;
const positionOrder = { position: 'asc' } as const;
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: maxUploadBytes, files: 1, fields: 7, fieldSize: 4096, parts: 10 } });

function positions(photoIds: number[]) {
  return photoIds.map((photoId, position) => ({ photoId, position }));
}

function checkSeries(published: boolean, photoIds: number[]) {
  if (published && !photoIds.length) throw new HttpError(400, 'Tambahkan minimal satu foto sebelum menampilkan seri.');
}

async function sendImage(req: Request, res: Response, publicOnly: boolean) {
  const id = contentId(req.params.id);
  const photo = await prisma.photo.findFirst({
    where: { id, ...(publicOnly ? { series: { some: { series: { published: true } } } } : {}) },
    select: req.query.size === 'full' ? { full: true } : { thumbnail: true },
  });
  const bytes = photo?.full ?? photo?.thumbnail;
  if (!bytes) throw new HttpError(404, 'Foto tidak tersedia.');
  res.type('image/webp').send(Buffer.from(bytes));
}

export const publicRoutes = Router();
publicRoutes.get('/series', async (_req, res) => {
  const rows = await prisma.series.findMany({
    where: { published: true },
    orderBy: [...seriesOrder],
    include: { photos: { orderBy: positionOrder, select: { photo: { select: photoMeta } } } },
  });
  res.json(rows.map((series) => ({ ...series, photos: series.photos.map(({ photo }) => photo) })));
});
publicRoutes.get('/photos/:id/image', (req, res) => sendImage(req, res, true));

export const adminRoutes = Router();
adminRoutes.get('/content', async (_req, res) => {
  const [photos, rows] = await Promise.all([
    prisma.photo.findMany({ orderBy: { id: 'desc' }, select: photoMeta }),
    prisma.series.findMany({ orderBy: [...seriesOrder], include: { photos: { orderBy: positionOrder, select: { photoId: true } } } }),
  ]);
  res.json({ photos, series: rows.map((series) => ({ ...series, photos: series.photos.map(({ photoId }) => photoId) })) });
});
adminRoutes.get('/photos/:id/image', (req, res) => sendImage(req, res, false));

let processing = 0;
adminRoutes.post('/photos', limitRequests(32, 10 * 60 * 1000, 'Terlalu banyak unggahan. Coba lagi nanti.'), upload.single('image'), async (req, res) => {
  const metadata = validate(photoSchema.extend({ slug: slugSchema }), req.body);
  if (!req.file?.buffer.length) throw new HttpError(400, 'Pilih satu file foto.');
  if (processing >= 2) throw new HttpError(429, 'Dua foto sedang diproses. Coba lagi sebentar.');
  processing++;
  try {
    const image = await preparePhoto(req.file.buffer).catch(() => {
      throw new HttpError(415, 'Unggah foto JPEG, PNG, atau WebP yang valid, maksimal 30 megapiksel.');
    });
    res.status(201).json(await prisma.photo.create({ data: { ...metadata, ...image }, select: photoMeta }));
  } finally {
    processing--;
  }
});

adminRoutes.put('/photos/:id', async (req, res) => {
  res.json(await prisma.photo.update({
    where: { id: contentId(req.params.id) }, data: validate(photoSchema, req.body), select: photoMeta,
  }));
});
adminRoutes.delete('/photos/:id', async (req, res) => {
  await prisma.photo.delete({ where: { id: contentId(req.params.id) } });
  res.sendStatus(204);
});

adminRoutes.post('/series', async (req, res) => {
  const { photoIds, ...details } = validate(seriesSchema.extend({ slug: slugSchema }), req.body);
  checkSeries(details.published, photoIds);
  const created = await prisma.series.create({ data: { ...details, photos: { createMany: { data: positions(photoIds) } } } });
  res.status(201).json({ ...created, photos: photoIds });
});
adminRoutes.put('/series/:id', async (req, res) => {
  const id = contentId(req.params.id);
  const { photoIds, revision: version, ...details } = validate(seriesSchema.extend({ revision }), req.body);
  checkSeries(details.published, photoIds);
  const updated = await prisma.$transaction(async (db) => {
    const rows = await db.series.updateManyAndReturn({ where: { id, revision: version }, data: { ...details, revision: { increment: 1 } } });
    if (!rows.length) throw new HttpError(409, 'Seri sudah diubah. Muat ulang studio untuk melanjutkan.');
    await db.seriesPhoto.deleteMany({ where: { seriesId: id } });
    if (photoIds.length) await db.seriesPhoto.createMany({ data: positions(photoIds).map((row) => ({ ...row, seriesId: id })) });
    return rows[0];
  });
  res.json({ ...updated, photos: photoIds });
});
adminRoutes.delete('/series/:id', async (req, res) => {
  const id = contentId(req.params.id);
  const { revision: version } = validate(z.strictObject({ revision }), req.body);
  const result = await prisma.series.deleteMany({ where: { id, revision: version } });
  if (!result.count) throw new HttpError(409, 'Seri sudah diubah. Muat ulang studio untuk melanjutkan.');
  res.sendStatus(204);
});
