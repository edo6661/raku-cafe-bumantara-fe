import { useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';

interface NavbarProps {
  toggleMobileMenu: () => void;
}

const Navbar = ({ toggleMobileMenu }: NavbarProps) => {
  const location = useLocation();

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'Dashboard';
      case '/kategori': return 'Manajemen Kategori';
      case '/produk': return 'Manajemen Produk & Stok';
      case '/voucher': return 'Manajemen Voucher';
      case '/transaksi': return 'Pencatatan Transaksi';
      case '/history-transaksi': return 'Riwayat Transaksi';
      case '/audit-logs': return 'Audit Log';
      default: return 'Raku';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 flex-shrink-0 z-10 sticky top-0">
      <div className="flex items-center gap-3">
        {/* Tombol Hamburger HANYA muncul di layar mobile/tablet (lg:hidden) */}
        <button
          onClick={toggleMobileMenu}
          className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer lg:hidden"
        >
          <Menu size={24} />
        </button>

        <h2 className="text-base md:text-lg font-bold text-slate-800 tracking-tight line-clamp-1">
          {getPageTitle()}
        </h2>
      </div>


    </header>
  );
};

export default Navbar;