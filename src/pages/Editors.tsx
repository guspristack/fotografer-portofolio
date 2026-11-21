import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { ArrowDown, ArrowLeft, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { maxUploadBytes, photoUrl, slugFromTitle, type Photo, type PhotoInput, type Series } from '../../shared/content';
import { errorText } from '../api';
import styles from './Admin.module.css';

export type AdminRequest = <T>(path: string, options?: { method?: string; data?: unknown }) => Promise<T>;

function Editor({ title, submitLabel, children, onSubmit, onRemove, onClose }: {
  title: string; submitLabel: string; children: ReactNode; onSubmit: () => Promise<unknown>;
  onRemove?: () => Promise<unknown>; onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, []);

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError('');
    try {
      await action();
    } catch (cause) {
      setError(errorText(cause));
    } finally {
      setBusy(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void run(onSubmit);
  }

  return (
    <section className={styles.editor} aria-labelledby="editor-title">
      <button className={styles.back} type="button" onClick={onClose} disabled={busy}><ArrowLeft size={17} aria-hidden="true" /> Kembali ke studio</button>
      <h1 id="editor-title" ref={heading} tabIndex={-1}>{title}</h1>
      <form onSubmit={submit}>
        <fieldset className={styles.fields} disabled={busy}>
          {children}
          <div className={styles.actions}>
            <button className={styles.primary} type="submit">{busy ? 'Memproses…' : submitLabel}</button>
            {onRemove && <button type="button" className={styles.danger} onClick={() => {
              if (window.confirm('Hapus entri ini?')) void run(onRemove);
            }}><Trash2 size={17} aria-hidden="true" /> Hapus</button>}
          </div>
        </fieldset>
      </form>
      {error && <p role="alert" className={styles.error}>{error}</p>}
    </section>
  );
}

const photoFields = [
  { key: 'title', label: 'Judul foto', max: 100, required: true },
  { key: 'alt', label: 'Teks alternatif', max: 220, required: true },
  { key: 'location', label: 'Lokasi', max: 100, required: false },
  { key: 'type', label: 'Jenis foto', max: 60, required: false },
  { key: 'credit', label: 'Kredit foto', max: 200, required: true },
  { key: 'source', label: 'Sumber atau lisensi', max: 160, required: false },
] as const;

export function PhotoEditor({ photo, request, onSaved, onRemoved, onClose }: {
  photo?: Photo; request: AdminRequest; onSaved: (photo: Photo) => void; onRemoved: (photo: Photo) => void; onClose: () => void;
}) {
  const [fields, setFields] = useState<PhotoInput>(() => ({
    title: photo?.title ?? '', alt: photo?.alt ?? '', location: photo?.location ?? '',
    type: photo?.type ?? '', credit: photo?.credit ?? 'Arka Wijaya', source: photo?.source ?? '',
  }));
  const [file, setFile] = useState<File>();
  const [slugEdit, setSlugEdit] = useState<string>();
  const [sizeNotice, setSizeNotice] = useState('');
  const slug = slugEdit ?? slugFromTitle(fields.title);

  async function save() {
    if (photo) {
      onSaved(await request<Photo>('/admin/photos/' + photo.id, { method: 'PUT', data: fields }));
    } else if (file) {
      const data = new FormData();
      for (const [name, value] of Object.entries(fields)) data.set(name, value);
      data.set('slug', slug);
      data.set('image', file);
      onSaved(await request<Photo>('/admin/photos', { method: 'POST', data }));
    }
  }

  return (
    <Editor title={photo ? 'Sunting detail foto' : 'Unggah foto'} submitLabel={photo ? 'Simpan detail foto' : 'Unggah ke pustaka'} onSubmit={save} onClose={onClose}
      onRemove={photo ? async () => {
        await request('/admin/photos/' + photo.id, { method: 'DELETE' });
        onRemoved(photo);
      } : undefined}>
      {photo ? (
        <figure className={styles.preview}><img src={photoUrl(photo.id, { admin: true })} alt={photo.alt} /><figcaption>{photo.width} × {photo.height} piksel</figcaption></figure>
      ) : (
        <label>File foto <span className={styles.meta}>JPEG, PNG, atau WebP · maksimal 12 MB</span>
          <input type="file" accept="image/jpeg,image/png,image/webp" required onChange={(event) => {
            const selected = event.target.files?.[0];
            if (selected && selected.size > maxUploadBytes) {
              event.target.value = '';
              setFile(undefined);
              setSizeNotice('Ukuran foto melebihi 12 MB.');
              return;
            }
            setFile(selected);
            setSizeNotice('');
          }} />
          {sizeNotice && <span role="alert">{sizeNotice}</span>}
        </label>
      )}
      <div className={styles.columns}>
        {photoFields.map(({ key, label, max, required }) => (
          <label key={key}>{label}<input value={fields[key]} maxLength={max} required={required}
            onChange={(event) => setFields({ ...fields, [key]: event.target.value })} /></label>
        ))}
        {!photo && <label>Alamat foto<input value={slug} minLength={2} maxLength={90} pattern="[a-z0-9]+(-[a-z0-9]+)*" required onChange={(event) => setSlugEdit(event.target.value)} /></label>}
      </div>
    </Editor>
  );
}

export function SeriesEditor({ series, photos, nextPosition, request, onSaved, onRemoved, onClose }: {
  series?: Series<number>; photos: Photo[]; nextPosition: number; request: AdminRequest;
  onSaved: (series: Series<number>) => void; onRemoved: (series: Series<number>) => void; onClose: () => void;
}) {
  const [title, setTitle] = useState(series?.title ?? '');
  const [description, setDescription] = useState(series?.description ?? '');
  const [position, setPosition] = useState(series?.position.toString() ?? nextPosition.toString());
  const [published, setPublished] = useState(series?.published ?? false);
  const [ordered, setOrdered] = useState(series?.photos ?? []);
  const [slugEdit, setSlugEdit] = useState<string>();
  const [choice, setChoice] = useState('');
  const slug = series?.slug ?? slugEdit ?? slugFromTitle(title);
  const available = photos.filter(({ id }) => !ordered.includes(id));
  const byId = new Map(photos.map((item) => [item.id, item]));

  function move(index: number, step: number) {
    const next = [...ordered];
    const [photo] = next.splice(index, 1);
    next.splice(index + step, 0, photo);
    setOrdered(next);
  }

  async function save() {
    const data = { title, description, position: Number(position), published, photoIds: ordered };
    onSaved(await request<Series<number>>('/admin/series' + (series ? '/' + series.id : ''), {
      method: series ? 'PUT' : 'POST',
      data: { ...data, ...(series ? { revision: series.revision } : { slug }) },
    }));
  }

  return (
    <Editor title={series ? 'Sunting seri' : 'Buat seri'} submitLabel="Simpan seri" onSubmit={save} onClose={onClose}
      onRemove={series ? async () => {
        await request('/admin/series/' + series.id, { method: 'DELETE', data: { revision: series.revision } });
        onRemoved(series);
      } : undefined}>
      <div className={styles.columns}>
        <label>Nama seri<input required maxLength={100} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
        <label>Alamat seri<input required readOnly={!!series} minLength={2} maxLength={90} pattern="[a-z0-9]+(-[a-z0-9]+)*" value={slug} onChange={(event) => setSlugEdit(event.target.value)} /></label>
        <label>Deskripsi<textarea rows={3} maxLength={600} value={description} onChange={(event) => setDescription(event.target.value)} /></label>
        <label>Urutan tampil<input required type="number" min={0} max={9999} value={position} onChange={(event) => setPosition(event.target.value)} /></label>
      </div>
      <section className={styles.order} aria-labelledby="photo-order">
        <h2 id="photo-order">Urutan foto</h2>
        <p className={styles.meta}>Foto pertama menjadi sampul seri.</p>
        <div className={styles.picker}>
          <label htmlFor="choose-photo">Pilih dari pustaka</label>
          <div className={styles.actions}>
            <select id="choose-photo" value={choice} onChange={(event) => setChoice(event.target.value)}>
              <option value="">Pilih foto</option>
              {available.map(({ id, title }) => <option key={id} value={id}>{title}</option>)}
            </select>
            <button className={styles.secondary} type="button" disabled={!choice || ordered.length >= 100} onClick={() => {
              setOrdered([...ordered, Number(choice)]);
              setChoice('');
            }}><Plus size={17} aria-hidden="true" /> Tambah ke seri</button>
          </div>
        </div>
        {ordered.length === 0 && <p className={styles.empty}>Belum ada foto dalam seri.</p>}
        <ol className={styles.photoOrder}>
          {ordered.map((id, index) => {
            const item = byId.get(id);
            const name = item?.title ?? 'Foto';
            return (
              <li key={id}>
                {item && <img src={photoUrl(id, { admin: true })} alt="" />}
                <div><strong>{name}</strong>{index === 0 && <span className={styles.meta}>Sampul</span>}</div>
                <div className={styles.actions}>
                  <button className={styles.secondary} type="button" aria-label={'Naikkan ' + name} disabled={index === 0} onClick={() => move(index, -1)}><ArrowUp size={16} /></button>
                  <button className={styles.secondary} type="button" aria-label={'Turunkan ' + name} disabled={index === ordered.length - 1} onClick={() => move(index, 1)}><ArrowDown size={16} /></button>
                  <button className={styles.danger} type="button" aria-label={'Keluarkan ' + name} onClick={() => setOrdered(ordered.filter((itemId) => itemId !== id))}><Trash2 size={16} /></button>
                </div>
              </li>
            );
          })}
        </ol>
      </section>
      <label className={styles.checkbox}><input type="checkbox" checked={published} onChange={(event) => setPublished(event.target.checked)} /> Tampilkan seri di portofolio</label>
    </Editor>
  );
}
