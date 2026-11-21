import { z } from 'zod';

export const maxUploadBytes = 12 * 1024 * 1024;
const line = (max: number) => z.string().trim().min(1).max(max);
export const slugSchema = z.string().min(2).max(90).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Gunakan huruf kecil, angka, dan tanda hubung.');
const id = z.number().int().min(1).max(2147483647);
export const photoSchema = z.strictObject({
  title: line(100), alt: line(220), location: z.string().trim().max(100),
  type: z.string().trim().max(60), credit: line(200), source: z.string().trim().max(160),
});
export const seriesSchema = z.strictObject({
  title: line(100), description: z.string().trim().max(600), position: z.number().int().min(0).max(9999),
  published: z.boolean(),
  photoIds: z.array(id).max(100).refine((photos) => new Set(photos).size === photos.length, 'Satu foto hanya boleh masuk sekali per seri.'),
});
export const loginSchema = z.strictObject({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
  password: z.string().min(1).max(256),
});
export const revision = z.number().int().min(1).max(2147483646);

export type PhotoInput = z.infer<typeof photoSchema>;
export type Photo = PhotoInput & { id: number; slug: string; width: number; height: number };
export type SeriesInput = z.infer<typeof seriesSchema>;
export type Series<T> = Omit<SeriesInput, 'photoIds'> & { id: number; slug: string; revision: number; photos: T[] };
export type AdminContent = { photos: Photo[]; series: Series<number>[] };

export function slugFromTitle(title: string) {
  return title.toLowerCase().normalize('NFKD').replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 90).replace(/-$/, '');
}

export function photoUrl(id: number, options: { admin?: boolean; full?: boolean } = {}) {
  return '/api/' + (options.admin ? 'admin/' : '') + 'photos/' + id + '/image' + (options.full ? '?size=full' : '');
}
