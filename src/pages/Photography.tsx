import { ChevronLeft, ChevronRight, Expand, X } from 'lucide-react';
import { photoUrl, type Photo, type Series } from '../../shared/content';
import { useResource } from '../api';
import { CopyWorkLink, Overlay, ProjectCredit, ResourceState } from '../components';
import { PortfolioDetails, PortfolioHeader, PortfolioTop, WorkCredits } from '../PortfolioProfile';
import { profiles } from '../portfolioProfiles';
import { useWorkDialog } from '../useWorkDialog';
import styles from './Photography.module.css';

export function Photography() {
  const { params, openWork, changeWork, closeWork } = useWorkDialog('seri', 'foto');
  const { data, error, retry } = useResource<Series<Photo>[]>('/series');
  if (!data) return <ResourceState loading="Memuat galeri Arka…" error={error} retry={retry} />;
  const requested = params.get('foto');
  const current = data.find(({ slug }) => slug === params.get('seri'));
  const index = current?.photos.findIndex(({ slug }) => slug === requested) ?? -1;
  const photo = current?.photos[index];
  const featured = data.find(({ slug }) => slug === 'bromo') ?? data[0];
  const hero = featured?.photos[0];

  function openPhoto(series: Series<Photo>, item: Photo) {
    openWork({ seri: series.slug, foto: item.slug });
  }

  function turn(step: number) {
    if (!current || current.photos.length < 2) return;
    const count = current.photos.length;
    changeWork({ seri: current.slug, foto: current.photos[(index + step + count) % count].slug });
  }

  return (
    <div className={styles.page}>
      <PortfolioHeader profile={profiles.arka} work={{ title: 'Karya', target: 'seri-foto' }} className={styles.header} shell={styles.shell} galleryClass={styles.back} leadingGallery>
        <span className={styles.brand}>Arka Wijaya</span>
      </PortfolioHeader>
      <main tabIndex={-1}>
        <section className={styles.hero} aria-label="Foto unggulan">
          {hero && <img src={photoUrl(hero.id, { full: true })} alt={hero.alt} fetchPriority="high" />}
          <div className={styles.shade} />
          <div className={styles.heroContent + ' ' + styles.shell}>
            <div>
              <p className={styles.kicker}>Arka Wijaya · Fotografi lanskap &amp; perjalanan</p>
              <h1>{hero?.title === 'Di antara kabut' ? <>Di antara<br />kabut.</> : hero?.title ?? 'Jejak perjalanan.'}</h1>
              {hero && featured && <button type="button" className={styles.heroCta} onClick={() => openPhoto(featured, hero)}>
                <Expand size={16} aria-hidden="true" /> {featured.slug === 'bromo' ? 'Buka seri Bromo' : 'Buka seri ' + featured.title}
              </button>}
            </div>
            {hero?.location && <p className={styles.location}>{hero.location}</p>}
          </div>
        </section>
        {!data.length && <p id="seri-foto" tabIndex={-1} className={styles.collection + ' ' + styles.shell}>Belum ada seri yang ditampilkan.</p>}
        {data.map((series, order) => {
          const heading = order === 0 ? 'seri-foto' : 'arka-' + series.slug;
          return (
            <section key={series.id} className={styles.collection + ' ' + styles.shell} aria-labelledby={heading}>
              <div className={styles.collectionHeading}>
                <div><p className={styles.kicker}>{series.slug === 'bromo' ? 'Seri editorial · Studi visual' : 'Karya pilihan'}</p><h2 id={heading} tabIndex={-1}>{series.title}</h2></div>
                {series.description && <p>{series.description}</p>}
              </div>
              <div className={styles.grid + (series.slug === 'bromo' ? ' ' + styles.bromoGrid : '')}>
                {series.photos.map((item) => (
                  <button key={item.id} type="button" className={styles.card} onClick={() => openPhoto(series, item)} aria-label={'Buka ' + item.title + ' dalam seri ' + series.title}>
                    <span className={styles.thumbnail}><img src={photoUrl(item.id)} alt={item.alt} loading="lazy" /><span><Expand size={19} aria-hidden="true" /></span></span>
                    <span className={styles.cardTitle}>{item.title}</span>
                    {series.slug !== 'bromo' && <span className={styles.cardMeta}>{[item.location, item.type].filter(Boolean).join(' · ')}</span>}
                  </button>
                ))}
              </div>
            </section>
          );
        })}
        <PortfolioDetails profile={profiles.arka} className={styles.shell} />
      </main>
      <footer className={styles.footer + ' ' + styles.shell}>
        <div><span>Portofolio fotografer fiktif</span><ProjectCredit /></div><PortfolioTop profile={profiles.arka} />
      </footer>
      {requested && (
        <Overlay className={styles.dialog} label={current ? current.title + ', galeri foto' : 'Galeri foto'} onClose={closeWork}>
          <section className={styles.viewer} onKeyDown={(event) => {
            if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
              event.preventDefault();
              turn(event.key === 'ArrowLeft' ? -1 : 1);
            }
          }}>
            <button className={styles.close} type="button" aria-label="Tutup galeri foto" onClick={closeWork} autoFocus><X size={23} aria-hidden="true" /></button>
            {photo && current ? (
              <>
                <img src={photoUrl(photo.id, { full: true })} alt={photo.alt} />
                <div className={styles.viewerControls}>
                  <div aria-live="polite"><strong>{photo.title}</strong><p>{[photo.location, (index + 1) + ' / ' + current.photos.length].filter(Boolean).join(' · ')}</p></div>
                  <button type="button" aria-label="Foto sebelumnya" onClick={() => turn(-1)} disabled={current.photos.length < 2}><ChevronLeft size={24} aria-hidden="true" /></button>
                  <button type="button" aria-label="Foto berikutnya" onClick={() => turn(1)} disabled={current.photos.length < 2}><ChevronRight size={24} aria-hidden="true" /></button>
                </div>
                <div className={styles.viewerCredits}>
                  <WorkCredits entries={photo.source ? [['Kredit foto', photo.credit], ['Sumber visual', photo.source]] : [['Kredit foto', photo.credit]]} />
                  <CopyWorkLink key={photo.id} label="Salin tautan foto" />
                </div>
              </>
            ) : <p className={styles.missing} role="alert">Foto tidak tersedia dalam seri ini.</p>}
          </section>
        </Overlay>
      )}
    </div>
  );
}
