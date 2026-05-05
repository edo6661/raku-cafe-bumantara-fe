import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PageLoader from './pages/PageLoader';
import { QueryProvider } from './providers/QueryProvider';
import RootLayout from './components/layouts/RootLayout';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Kategori = lazy(() => import('./pages/Kategori'));
const Produk = lazy(() => import('./pages/Produk'));
const Transaksi = lazy(() => import('./pages/Transaksi'));
const HistoryTransaksi = lazy(() => import('./pages/HistoryTransaksi'));
const Voucher = lazy(() => import('./pages/Voucher')); // <-- Tambahkan ini
const Login = lazy(() => import('./pages/Login'));

const App = () => {
  return (
    <QueryProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<RootLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/kategori" element={<Kategori />} />
              <Route path="/produk" element={<Produk />} />
              <Route path="/voucher" element={<Voucher />} />
              <Route path="/transaksi" element={<Transaksi />} />
              <Route path="/history-transaksi" element={<HistoryTransaksi />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryProvider>
  );
};

export default App;