import { portfolioMedia, type PortfolioMedia } from './portfolioMedia';

export type PortfolioProfile = {
  id: string;
  name: string;
  profession: string;
  location: string;
  bio: string;
  specialty: string;
  contactFor: string;
  media: PortfolioMedia;
  experience: ReadonlyArray<{ period: string; title: string; description: string }>;
};

export const profiles = {
  arka: {
    id: 'arka',
    media: portfolioMedia.arka,
    name: 'Arka Wijaya',
    profession: 'Fotografer lanskap & perjalanan',
    location: 'Surabaya, Indonesia',
    bio: 'Saya menyusun cerita visual tentang lanskap dan perjalanan. Saya memperhatikan perubahan cahaya dan mengurutkan gambar agar satu seri punya ritme yang jelas.',
    specialty: 'Lanskap, editorial perjalanan, dan dokumentasi lokasi',
    contactFor: 'Untuk kolaborasi editorial perjalanan dan penugasan dokumentasi lokasi.',
    experience: [
      { period: 'Feb–Sep 2026', title: 'Jejak Nusantara · Eksplorasi visual', description: 'Menyusun arah visual dan kurasi seri konsep gunung, pesisir, dan kota.' },
      { period: 'Mei–Nov 2025', title: 'Latihan penyuntingan foto perjalanan', description: 'Mengembangkan referensi komposisi, menguji pilihan warna, dan mengurutkan gambar untuk cerita singkat.' },
    ],
  },
} satisfies Record<string, PortfolioProfile>;
