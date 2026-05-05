// src/components/layouts/RootLayout.tsx
import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from '../Sidebar';
import Navbar from '../Navbar';

const RootLayout = () => {
  const token = localStorage.getItem('token');

  // State untuk expand/shrink di Desktop
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  // State untuk membuka/menutup menu di Mobile
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden relative">
      <Sidebar
        isExpanded={isSidebarExpanded}
        setIsExpanded={setIsSidebarExpanded}
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={setIsMobileMenuOpen}
      />

      {/* Container utama, min-w-0 penting agar tabel/konten tidak overflow */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <Navbar
          toggleMobileMenu={() => setIsMobileMenuOpen(true)}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-4 md:p-6 lg:p-8 custom-scrollbar">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default RootLayout;