import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { ArrowUpRight, Camera, FolderPlus, ImagePlus, LockKeyhole, LogOut, Pencil } from 'lucide-react';
import { Link } from 'react-router';
import { photoUrl, type AdminContent, type Photo, type Series } from '../../shared/content';
import { api, ApiError, errorText } from '../api';
import { ProjectCredit, ResourceState } from '../components';
import { PhotoEditor, SeriesEditor, type AdminRequest } from './Editors';
import styles from './Admin.module.css';

type View = { step: 'loading' | 'login' } | { step: 'error'; message: string } | { step: 'ready'; content: AdminContent };
type Selection = { kind: 'photo'; item?: Photo } | { kind: 'series'; item?: Series<number> };

function Login({ onLogin }: { onLogin: (data: AdminContent) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true);
    setError('');
    try {
      await api('/admin/login', { method: 'POST', data });
      onLogin(await api<AdminContent>('/admin/content'));
    } catch (cause) {
      setError(errorText(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.page}>
      <main className={styles.loginShell}>
        <Link className={styles.back} to="/">Portofolio Arka <ArrowUpRight size={15} aria-hidden="true" /></Link>
        <section className={styles.login} aria-labelledby="login-heading">
          <span className={styles.loginIcon}><LockKeyhole size={21} aria-hidden="true" /></span>
          <h1 id="login-heading">Masuk ke studio</h1>
          <p>Kelola foto, seri, dan kredit dalam galeri Arka.</p>
          <form onSubmit={submit}>
            <fieldset className={styles.fields} disabled={busy}>
              <label>Email admin<input type="email" name="email" maxLength={254} autoComplete="username" required /></label>
              <label>Kata sandi<input type="password" name="password" maxLength={256} autoComplete="current-password" required /></label>
              <button type="submit" className={styles.primary}>{busy ? 'Memeriksa…' : 'Masuk'}</button>
            </fieldset>
            {error && <p className={styles.error} role="alert">{error}</p>}
          </form>
        </section>
        <footer className={styles.footer}><ProjectCredit /></footer>
      </main>
    </div>
  );
}

export default function Admin() {
  const [view, setView] = useState<View>({ step: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [tab, setTab] = useState<'Pustaka foto' | 'Seri'>('Pustaka foto');
  const [selected, setSelected] = useState<Selection | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    api<AdminContent>('/admin/content', { signal: controller.signal }).then((content) => {
      if (!controller.signal.aborted) setView({ step: 'ready', content });
    }, (cause) => {
      if (!controller.signal.aborted) setView(cause instanceof ApiError && cause.status === 401 ? { step: 'login' } : { step: 'error', message: errorText(cause) });
    });
    return () => controller.abort();
  }, [attempt]);

  const request: AdminRequest = useCallback(async <T,>(path: string, options?: { method?: string; data?: unknown }) => {
    try {
      return await api<T>(path, options);
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        setSelected(null);
        setView({ step: 'login' });
      }
      throw cause;
    }
  }, []);

  function change(update: (content: AdminContent) => AdminContent, message: string) {
    setView((previous) => previous.step === 'ready' ? { step: 'ready', content: update(previous.content) } : previous);
    setSelected(null);
    setNotice(message);
  }

  function open(selection: Selection) {
    setSelected(selection);
    setNotice('');
    setError('');
  }

  async function logout() {
    setBusy(true);
    setError('');
    try {
      await request('/admin/logout', { method: 'POST' });
      setView({ step: 'login' });
    } catch (cause) {
      setError(errorText(cause));
    } finally {
      setBusy(false);
    }
  }

  if (view.step === 'login') return <Login onLogin={(content) => {
    setTab('Pustaka foto');
    setNotice('');
    setError('');
    setView({ step: 'ready', content });
  }} />;
  if (view.step !== 'ready') return <ResourceState loading="Memuat studio…" error={view.step === 'error' ? view.message : undefined}
    retry={() => { setView({ step: 'loading' }); setAttempt((value) => value + 1); }} />;
  const { photos, series } = view.content;

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <div className={styles.shell}>
          <span className={styles.wordmark}><Camera size={21} aria-hidden="true" /> Studio Arka</span>
          <div className={styles.actions}>
            <Link className={styles.back} to="/" target={selected ? '_blank' : undefined} rel={selected ? 'noopener' : undefined}>Portofolio <ArrowUpRight size={15} aria-hidden="true" /></Link>
            {!selected && <button className={styles.secondary} type="button" onClick={logout} disabled={busy}><LogOut size={16} aria-hidden="true" /> Keluar</button>}
          </div>
        </div>
      </header>
      <main className={styles.shell + ' ' + styles.dashboard}>
        {selected?.kind === 'photo' ? (
          <PhotoEditor photo={selected.item} request={request} onClose={() => setSelected(null)}
            onSaved={(photo) => change((content) => ({ ...content, photos: [photo, ...content.photos.filter(({ id }) => id !== photo.id)] }), selected.item ? 'Detail foto disimpan.' : 'Foto ditambahkan ke pustaka.')}
            onRemoved={(removed) => change((content) => ({ ...content, photos: content.photos.filter(({ id }) => id !== removed.id) }), 'Foto dihapus.')} />
        ) : selected?.kind === 'series' ? (
          <SeriesEditor series={selected.item} photos={photos} nextPosition={Math.min(9999, (series.at(-1)?.position ?? 0) + 10)} request={request} onClose={() => setSelected(null)}
            onSaved={(saved) => change((content) => ({ ...content, series: [...content.series.filter(({ id }) => id !== saved.id), saved]
              .sort((a, b) => a.position - b.position || a.id - b.id) }), 'Seri disimpan.')}
            onRemoved={(removed) => change((content) => ({ ...content, series: content.series.filter(({ id }) => id !== removed.id) }), 'Seri dihapus.')} />
        ) : (
          <>
            <div className={styles.dashboardHead}>
              <div><h1>Galeri Arka</h1><p className={styles.meta}>Unggah foto dan susun urutan untuk setiap seri.</p></div>
              <div className={styles.actions}>
                <button className={styles.primary} type="button" onClick={() => { setTab('Pustaka foto'); open({ kind: 'photo' }); }}><ImagePlus size={18} aria-hidden="true" /> Unggah foto</button>
                <button className={styles.secondary} type="button" onClick={() => { setTab('Seri'); open({ kind: 'series' }); }}><FolderPlus size={18} aria-hidden="true" /> Buat seri</button>
              </div>
            </div>
            <nav className={styles.tabs} aria-label="Bagian studio">
              {(['Pustaka foto', 'Seri'] as const).map((item) => <button key={item} type="button" aria-current={item === tab ? 'page' : undefined} onClick={() => { setTab(item); setNotice(''); }}>{item}</button>)}
            </nav>
            {notice && <p className={styles.notice} role="status">{notice}</p>}
            {error && <p className={styles.error} role="alert">{error}</p>}
            {tab === 'Pustaka foto' ? (
              photos.length ? (
                <ul className={styles.library}>
                  {photos.map((photo) => (
                    <li key={photo.id}>
                      <img src={photoUrl(photo.id, { admin: true })} alt={photo.alt} loading="lazy" />
                      <div><h2>{photo.title}</h2><p className={styles.meta}>{photo.credit}</p>
                        <button className={styles.back} type="button" aria-label={'Sunting foto ' + photo.title} onClick={() => open({ kind: 'photo', item: photo })}><Pencil size={15} aria-hidden="true" /> Sunting</button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : <p className={styles.empty}>Pustaka masih kosong.</p>
            ) : (
              series.length ? (
                <ul className={styles.series}>
                  {series.map((item) => (
                    <li key={item.id}>
                      <div className={styles.seriesSummary}>
                        {item.photos.length > 0 && <img src={photoUrl(item.photos[0], { admin: true })} alt="" loading="lazy" />}
                        <div><h2>{item.title}</h2><p className={styles.meta}>{item.photos.length} foto · {item.published ? 'Tampil' : 'Tersembunyi'}</p></div>
                      </div>
                      <button className={styles.secondary} type="button" aria-label={'Sunting seri ' + item.title} onClick={() => open({ kind: 'series', item })}><Pencil size={15} aria-hidden="true" /> Sunting</button>
                    </li>
                  ))}
                </ul>
              ) : <p className={styles.empty}>Belum ada seri.</p>
            )}
          </>
        )}
      </main>
      <footer className={styles.shell + ' ' + styles.footer}><ProjectCredit /></footer>
    </div>
  );
}
