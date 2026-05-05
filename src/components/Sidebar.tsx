import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Tags, Package, ArrowRightLeft,
  LogOut, Ticket, ChevronLeft, ChevronRight, X,
  ShieldCheck, Zap
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
  const user = userString ? JSON.parse(userString) : { username: 'Admin', role: 'SUPERADMIN' };

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
    { title: 'Transaksi POS', path: '/transaksi', icon: Zap },
    { title: 'History Transaksi', path: '/history-transaksi', icon: ArrowRightLeft },
    { title: 'Audit Log', path: '/audit-logs', icon: ShieldCheck },
  ];

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 bg-[#0B1120] text-slate-300 flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out shadow-2xl lg:shadow-none
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isExpanded ? 'w-[260px]' : 'w-[84px]'}
        `}
      >
        <div className="h-[72px] flex items-center justify-between px-5 border-b border-white/5">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
              <span className="text-white font-black text-sm">R</span>
            </div>
            <h1 className={`text-white font-black text-xl tracking-tight transition-all duration-300 whitespace-nowrap ${isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 w-0'}`}>
              Raku.
            </h1>
          </div>

          <button className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg" onClick={() => setIsMobileOpen(false)}>
            <X size={20} />
          </button>

          <button
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer shrink-0"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => window.innerWidth < 1024 && setIsMobileOpen(false)}
                title={!isExpanded ? item.title : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3 py-3 rounded-xl transition-all duration-200 font-semibold text-sm group relative overflow-hidden ${isActive
                    ? 'bg-indigo-500/10 text-indigo-400'
                    : 'hover:bg-white/5 hover:text-slate-200 text-slate-400'
                  } ${!isExpanded ? 'px-0 justify-center' : 'px-4'}`
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Indikator aktif di sebelah kiri */}
                    {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-500 rounded-r-full" />}
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className="shrink-0 z-10" />
                    <span className={`transition-all duration-300 whitespace-nowrap z-10 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0 hidden'}`}>
                      {item.title}
                    </span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className={`flex items-center ${isExpanded ? 'justify-between px-3 py-3 bg-white/5' : 'justify-center py-3 bg-transparent'} rounded-2xl transition-all duration-300 border border-white/5`}>
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 shrink-0 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                {user.username.charAt(0)}
              </div>
              <div className={`flex flex-col transition-all duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0 hidden'}`}>
                <span className="text-sm font-bold text-white leading-tight truncate">{user.username}</span>
                <span className="text-[11px] text-slate-400 mt-0.5 font-medium truncate">{user.role}</span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className={`text-slate-400 hover:text-rose-400 p-2 rounded-xl hover:bg-rose-400/10 transition-colors cursor-pointer shrink-0 ${!isExpanded && 'hidden'}`}
            >
              <LogOut size={18} />
            </button>
          </div>

          {!isExpanded && (
            <button
              onClick={handleLogout}
              className="mt-2 w-full flex justify-center text-slate-400 hover:text-rose-400 p-3 rounded-xl hover:bg-rose-400/10 transition-colors"
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