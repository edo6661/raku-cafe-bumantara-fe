// src/components/Sidebar.tsx
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Tags, Package, ArrowRightLeft,
  LogOut, Ticket, ChevronLeft, ChevronRight, X,
  ShieldCheck
} from 'lucide-react';

interface SidebarProps {
  isExpanded: boolean;
  setIsExpanded: (val: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (val: boolean) => void;
}

const Sidebar = ({ isExpanded, setIsExpanded, isMobileOpen, setIsMobileOpen }: SidebarProps) => {
  const navigate = useNavigate();
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : { username: 'Guest', role: 'UNKNOWN' };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const menuItems = [
    { title: 'Dashboard', path: '/', icon: LayoutDashboard },
    { title: 'Kategori', path: '/kategori', icon: Tags },
    { title: 'Voucher', path: '/voucher', icon: Ticket },
    { title: 'Produk & Stok', path: '/produk', icon: Package },
    { title: 'Transaksi', path: '/transaksi', icon: ArrowRightLeft },
    { title: 'History', path: '/history-transaksi', icon: ArrowRightLeft },
    { title: 'Audit Log', path: '/audit-logs', icon: ShieldCheck },
  ];

  return (
    <>
      {/* Mobile Overlay Background */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out shadow-2xl lg:shadow-none
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isExpanded ? 'w-64' : 'w-20'}
        `}
      >
        {/* Header Logo & Toggles */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
          <h1 className={`text-white font-bold tracking-wider transition-all duration-300 overflow-hidden whitespace-nowrap ${isExpanded ? 'opacity-100 w-auto ml-2' : 'opacity-0 w-0 m-0'}`}>
            Raku
          </h1>

          {/* Close button for Mobile */}
          <button
            className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer"
            onClick={() => setIsMobileOpen(false)}
          >
            <X size={20} />
          </button>

          {/* Expand/Shrink toggle for Desktop */}
          <button
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer shrink-0"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Perkecil Sidebar" : "Perbesar Sidebar"}
          >
            {isExpanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>

        {/* Navigation Menus */}
        <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                // Jika di mobile, tutup sidebar saat menu di klik
                onClick={() => window.innerWidth < 1024 && setIsMobileOpen(false)}
                title={!isExpanded ? item.title : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3 py-3 rounded-xl transition-all duration-200 font-medium text-[14px] group relative ${isActive
                    ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20'
                    : 'hover:bg-slate-800 hover:text-white text-slate-400'
                  } ${!isExpanded ? 'px-0 justify-center' : 'px-4'}`
                }
              >
                <Icon size={20} strokeWidth={2} className="shrink-0" />
                <span className={`transition-all duration-300 whitespace-nowrap overflow-hidden ${isExpanded ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0 m-0'}`}>
                  {item.title}
                </span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Profile Section */}
        <div className="p-4 border-t border-slate-800">
          <div className={`flex items-center ${isExpanded ? 'justify-between px-3 py-3 bg-slate-800/50' : 'justify-center py-3 bg-transparent'} rounded-xl transition-all duration-300`}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 shrink-0 rounded-xl bg-indigo-500 flex items-center justify-center text-white font-bold text-sm uppercase shadow-sm">
                {user.username.charAt(0)}
              </div>
              <div className={`flex flex-col overflow-hidden transition-all duration-300 ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
                <span className="text-sm font-bold text-white leading-tight truncate">{user.username}</span>
                <span className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider truncate">{user.role}</span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className={`text-slate-400 hover:text-red-400 p-2 rounded-lg hover:bg-red-400/10 transition-colors cursor-pointer shrink-0 ${!isExpanded && 'hidden'}`}
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>

          {/* Tombol logout khusus saat mode shrink */}
          {!isExpanded && (
            <button
              onClick={handleLogout}
              className="mt-2 w-full flex justify-center text-slate-400 hover:text-red-400 p-2 rounded-xl hover:bg-red-400/10 cursor-pointer transition-colors"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;