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
      case '/transaksi': return 'Point of Sale (POS)';
      case '/history-transaksi': return 'Riwayat Transaksi';
      case '/audit-logs': return 'Audit Log Sistem';
      default: return 'Raku ERP';
    }
  };

  return (

    <header className="h-[72px] glass-effect flex items-center justify-between px-6 lg:px-8 flex-shrink-0 z-40 sticky top-0 transition-all duration-300">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleMobileMenu}
          className="p-2 -ml-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer lg:hidden active:scale-95"
        >
          <Menu size={24} strokeWidth={2.5} />
        </button>

        <h2 className="text-lg lg:text-xl font-black text-slate-800 tracking-tight line-clamp-1">
          {getPageTitle()}
        </h2>
      </div>
    </header>
  );
};

export default Navbar;