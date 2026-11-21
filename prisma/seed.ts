import { readFile } from 'node:fs/promises';
import { disconnectDatabase, prisma } from '../server/database';
import { preparePhoto } from '../server/images';
import { bromoSeries, photographs } from './fixtures';

try {
  const artwork = [...new Map([...photographs, ...bromoSeries].map((item) => [item.slug, item])).values()];
  const ids = new Map<string, number>();
  for (const { file, role, ...details } of artwork) {
    const existing = await prisma.photo.findUnique({ where: { slug: details.slug }, select: { id: true } });
    const photo = existing ?? await prisma.photo.create({
      data: {
        ...details, credit: 'Arka Wijaya · ' + role, source: 'Gambar generatif · ImageGen',
        ...await preparePhoto(await readFile(new URL('../src/images/' + file + '.webp', import.meta.url))),
      },
      select: { id: true },
    });
    ids.set(details.slug, photo.id);
  }
  const galleries = [
    { slug: 'jejak', title: 'Jejak Nusantara', description: 'Tiga perjalanan di antara gunung, pesisir, dan kota.', position: 10, photos: photographs },
    { slug: 'bromo', title: 'Bromo saat fajar', description: 'Empat gambar generatif menyusun satu perjalanan visual, dari kabut sebelum terbit hingga cahaya menyentuh lereng. Seri ini memperlihatkan arah visual untuk cerita perjalanan.', position: 20, photos: bromoSeries },
  ];
  for (const { photos, ...series } of galleries) {
    await prisma.series.upsert({
      where: { slug: series.slug }, update: {},
      create: { ...series, published: true, photos: { createMany: { data: photos.map(({ slug }, position) => ({ photoId: ids.get(slug)!, position })) } } },
    });
  }
  console.log('Foto dan seri contoh tersedia.');
} finally {
  await disconnectDatabase();
}
