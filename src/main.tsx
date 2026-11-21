import { lazy, StrictMode, Suspense, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link, Route, Routes, useLocation } from 'react-router';
import '@fontsource-variable/dm-sans';
import './reset.css';
import { Photography } from './pages/Photography';

const Admin = lazy(() => import('./pages/Admin'));

function NavigationEffects() {
  const { pathname } = useLocation();
  useEffect(() => {
    document.title = pathname === '/admin' ? 'Studio Arka · Admin' : 'Arka Wijaya · Fotografi lanskap dan perjalanan';
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <NavigationEffects />
      <Suspense fallback={<p className="resource-state" role="status">Memuat studio…</p>}>
        <Routes>
          <Route path="/" element={<Photography />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<main className="resource-state"><h1>Halaman tidak ditemukan</h1><Link to="/">Kembali ke portofolio</Link></main>} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </StrictMode>,
);
