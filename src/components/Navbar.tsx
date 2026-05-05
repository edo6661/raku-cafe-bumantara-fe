import { useLocation } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'Dashboard Analitik';
      case '/kategori': return 'Manajemen Kategori';
      case '/produk': return 'Manajemen Produk & Stok';
      case '/voucher': return 'Manajemen Voucher';
      case '/transaksi': return 'Pencatatan Transaksi';
      case '/history-transaksi': return 'Riwayat Transaksi';
      default: return 'Bumantara';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 flex-shrink-0 z-10">
      <h2 className="text-lg font-bold text-slate-800 tracking-tight">
        {getPageTitle()}
      </h2>

      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-slate-500">
          {new Date().toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </span>
      </div>
    </header>
  );
};

export default Navbar;