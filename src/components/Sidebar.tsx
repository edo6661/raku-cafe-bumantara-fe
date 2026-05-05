import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Tags, Package, ArrowRightLeft, LogOut, Ticket } from 'lucide-react';
const Sidebar = () => {
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
  ];
  return (
    <aside className="w-64 h-screen bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 transition-all duration-300">
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <h1 className="text-white font-bold text-xl tracking-wider">BUMANTARA</h1>
      </div>
      <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium text-[14px] ${isActive
                  ? 'bg-indigo-600/10 text-indigo-400 font-bold'
                  : 'hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon size={20} strokeWidth={2} />
              {item.title}
            </NavLink>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-sm uppercase">
              {user.username.charAt(0)}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white leading-none">{user.username}</span>
              <span className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">{user.role}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-400/10 transition-colors cursor-pointer"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};
export default Sidebar;