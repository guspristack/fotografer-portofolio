const photographs = [
  {
    slug: 'di-antara-kabut',
    file: "photo-volcano",
    title: 'Di antara kabut',
    location: 'Gunung Bromo, Jawa Timur',
    type: 'Lanskap',
    alt: 'Gunung Bromo dan pegunungan berlapis di balik kabut dini hari.',
    role: 'Konsep lanskap pegunungan, arah cahaya, dan kurasi gambar',
  },
  {
    slug: 'garis-terakhir-daratan',
    file: "photo-coast",
    title: 'Garis terakhir daratan',
    location: 'Pesisir selatan Jawa',
    type: 'Lanskap',
    alt: 'Ombak putih menyentuh garis pantai gelap di bawah tebing.',
    role: 'Konsep lanskap pesisir, arah komposisi, dan kurasi gambar',
  },
  {
    slug: 'setelah-hujan',
    file: "photo-city",
    title: 'Setelah hujan',
    location: 'Jakarta',
    type: 'Street',
    alt: 'Seorang pejalan kaki berpayung di jalan Jakarta dengan pantulan cahaya malam.',
    role: 'Konsep suasana kota, arah warna, dan kurasi gambar',
  },
];

const bromoSeries = [
  photographs[0],
  { slug: 'skala-di-punggung-gunung', file: "arka-bromo-ridge", title: 'Skala di punggung gunung', location: 'Punggung Bromo', type: 'Lanskap', alt: 'Sosok kecil berdiri di titik pandang ketika pegunungan masih berkabut.', role: 'Menempatkan sosok kecil sebagai pembanding skala lanskap' },
  { slug: 'jalur-di-lautan-pasir', file: "arka-bromo-path", title: 'Jalur di lautan pasir', location: 'Lautan Pasir Bromo', type: 'Lanskap', alt: 'Jalur berkelok di pasir vulkanik dengan pegunungan kelabu di kejauhan.', role: 'Menggunakan garis jalur untuk mengarahkan pandangan menuju lereng' },
  { slug: 'cahaya-pertama', file: "arka-bromo-light", title: 'Cahaya pertama', location: 'Gunung Bromo', type: 'Lanskap', alt: 'Cahaya keemasan menyapu lereng vulkanik pada pagi hari.', role: 'Menutup seri dengan warna yang lebih hangat dan tekstur lereng' },
];

export { photographs, bromoSeries };
