import { Package } from 'lucide-react';

const PageLoader = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
      <div className="relative flex items-center justify-center">
        <div className="absolute w-20 h-20 bg-indigo-500/20 rounded-full animate-ping"></div>
        <div className="absolute w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm relative z-10">
          <Package size={20} className="text-indigo-600 animate-pulse" />
        </div>
      </div>
      <h3 className="mt-6 text-lg font-bold text-slate-800 tracking-tight">Memuat...</h3>
      <p className="mt-1 text-sm text-slate-500 font-medium">Mohon tunggu sebentar</p>
    </div>
  );
};

export default PageLoader;