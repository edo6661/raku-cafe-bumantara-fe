import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  AlertOctagon,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  BarChart3
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Cell
} from 'recharts';
import api from '../lib/axios';
import { BusinessUnit, type DashboardSummary } from '../types/domain';
import { formatDate } from '../utils/formatters';

const Dashboard = () => {
  const [filterPeriod, setFilterPeriod] = useState<string>('monthly');
  const [filterUnit, setFilterUnit] = useState<BusinessUnit | ''>('');

  const { data: dashboardData, isLoading, isError } = useQuery({
    queryKey: ['dashboard-summary', filterPeriod, filterUnit],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterPeriod) params.append('filter', filterPeriod);
      if (filterUnit) params.append('businessUnit', filterUnit);

      const response = await api.get<{ data: DashboardSummary }>(`/dashboard/summary?${params.toString()}`);
      return response.data.data;
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // --- DATA PREPARATION UNTUK GRAFIK ---
  const { topSellingData, financialChartData } = useMemo(() => {
    if (!dashboardData) return { topSellingData: [], financialChartData: [] };

    // 1. Data Top 5 Produk Terlaris
    const top5 = [...dashboardData.inventory]
      .filter(item => item.terjual > 0)
      .sort((a, b) => b.terjual - a.terjual)
      .slice(0, 5)
      .map(item => ({
        // Potong nama jika terlalu panjang agar rapi di sumbu X
        name: item.nama.length > 15 ? item.nama.substring(0, 15) + '...' : item.nama,
        Terjual: item.terjual,
        fullName: item.nama
      }));

    // 2. Data Perbandingan Keuangan
    const finance = [
      { name: 'Pemasukan', value: dashboardData.financial.pemasukan, fill: '#10b981' }, // emerald-500
      { name: 'Pengeluaran', value: dashboardData.financial.pengeluaran, fill: '#f43f5e' } // rose-500
    ];

    return { topSellingData: top5, financialChartData: finance };
  }, [dashboardData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="font-medium text-sm animate-pulse">Menghimpun data analitik...</p>
        </div>
      </div>
    );
  }

  if (isError || !dashboardData) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <p className="text-red-500 font-medium bg-red-50 px-4 py-2 rounded-xl">Gagal memuat data dashboard.</p>
      </div>
    );
  }

  const { financial, inventory, expiringProducts, period } = dashboardData;

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER & FILTER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-white p-5 rounded-[20px] shadow-sm border border-slate-200/80">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Ringkasan performa pada periode <strong className="text-slate-700">{formatDate(period.startDate).split(' ')[0]} - {formatDate(period.endDate).split(' ')[0]}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl">
            <Filter size={16} className="text-slate-400" />
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer"
            >
              <option value="daily">Hari Ini</option>
              <option value="weekly">Minggu Ini</option>
              <option value="monthly">Bulan Ini</option>
              <option value="yearly">Tahun Ini</option>
            </select>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setFilterUnit('')}
              className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all cursor-pointer ${filterUnit === '' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              Semua
            </button>
            <button
              onClick={() => setFilterUnit(BusinessUnit.PADEL)}
              className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all cursor-pointer ${filterUnit === BusinessUnit.PADEL ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              Padel
            </button>
            <button
              onClick={() => setFilterUnit(BusinessUnit.CAFE)}
              className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all cursor-pointer ${filterUnit === BusinessUnit.CAFE ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              Cafe
            </button>
          </div>
        </div>
      </div>

      {/* FINANCIAL CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-[20px] shadow-sm border border-slate-200/80 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute right-[-10%] top-[-10%] w-24 h-24 bg-emerald-50 rounded-full group-hover:scale-150 transition-transform duration-500 z-0"></div>
          <div className="relative z-10 flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Total Pemasukan</p>
              <h3 className="text-2xl font-black text-slate-800">{formatCurrency(financial.pemasukan)}</h3>
            </div>
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
              <TrendingUp size={24} strokeWidth={2.5} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[20px] shadow-sm border border-slate-200/80 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute right-[-10%] top-[-10%] w-24 h-24 bg-rose-50 rounded-full group-hover:scale-150 transition-transform duration-500 z-0"></div>
          <div className="relative z-10 flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Total Pengeluaran</p>
              <h3 className="text-2xl font-black text-slate-800">{formatCurrency(financial.pengeluaran)}</h3>
            </div>
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center shrink-0">
              <TrendingDown size={24} strokeWidth={2.5} />
            </div>
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-[20px] shadow-lg border border-slate-800 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/20 blur-2xl rounded-full"></div>
          <div className="relative z-10 flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-bold text-indigo-200 uppercase tracking-wider mb-1">Laba Bersih (Net Profit)</p>
              <h3 className={`text-2xl font-black ${financial.net >= 0 ? 'text-white' : 'text-rose-400'}`}>
                {formatCurrency(financial.net)}
              </h3>
            </div>
            <div className="w-12 h-12 bg-indigo-500/30 text-indigo-300 rounded-2xl flex items-center justify-center shrink-0">
              <Wallet size={24} strokeWidth={2.5} />
            </div>
          </div>
        </div>
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Chart */}
        <div className="bg-white p-5 rounded-[20px] shadow-sm border border-slate-200/80 flex flex-col">
          <h2 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2">
            <BarChart3 size={18} className="text-indigo-500" /> Top 5 Produk Terlaris
          </h2>
          <div className="flex-1 min-h-[250px] w-full">
            {topSellingData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topSellingData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <RechartsTooltip
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                    labelStyle={{ color: '#64748b', marginBottom: '4px' }}
                  />
                  <Bar dataKey="Terjual" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <Package size={32} className="mb-2 text-slate-300" />
                <p className="text-sm font-medium">Belum ada produk terjual</p>
              </div>
            )}
          </div>
        </div>

        {/* Financial Comparison Chart */}
        <div className="bg-white p-5 rounded-[20px] shadow-sm border border-slate-200/80 flex flex-col">
          <h2 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Wallet size={18} className="text-emerald-500" /> Perbandingan Keuangan
          </h2>
          <div className="flex-1 min-h-[250px] w-full">
            {financial.pemasukan > 0 || financial.pengeluaran > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financialChartData} margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                  <YAxis
                    tickFormatter={(val) => `Rp${val / 1000}k`}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <RechartsTooltip
                    formatter={(value) => value !== undefined && value !== null ? formatCurrency(value as number) : '-'}
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '13px', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={60}>
                    {financialChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <Wallet size={32} className="mb-2 text-slate-300" />
                <p className="text-sm font-medium">Belum ada transaksi</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* INVENTORY MOVEMENT TABLE */}
        <div className="xl:col-span-2 bg-white rounded-[20px] shadow-sm border border-slate-200/80 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Package size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Pergerakan Stok (Inventory)</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Barang masuk dan keluar berdasarkan periode terpilih</p>
            </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar flex-1 max-h-[400px]">
            <table className="w-full text-sm text-left">
              <thead className="sticky top-0 bg-white z-10 shadow-sm">
                <tr className="bg-slate-50/80 text-slate-500 text-[11px] uppercase font-bold tracking-wider border-b border-slate-200/60 backdrop-blur-sm">
                  <th className="px-6 py-4">Nama Produk</th>
                  <th className="px-6 py-4 text-center">Stok Masuk</th>
                  <th className="px-6 py-4 text-center">Stok Terjual</th>
                  <th className="px-6 py-4 text-center">Sisa Saat Ini</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inventory.length > 0 ? (
                  inventory.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-700 block">{item.nama}</span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">{item.tipe}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 font-bold text-xs">
                          <ArrowDownRight size={14} />
                          {item.masuk}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 font-bold text-xs">
                          <ArrowUpRight size={14} />
                          {item.terjual}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`font-black ${item.tipe === 'JASA' ? 'text-slate-300' : item.sisaStok <= 10 ? 'text-red-500' : 'text-slate-800'}`}>
                          {item.tipe === 'JASA' ? '-' : item.sisaStok}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500 font-medium text-sm">
                      Belum ada data pergerakan stok.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* EXPIRING PRODUCTS ALERT */}
        <div className="xl:col-span-1 bg-white rounded-[20px] shadow-sm border border-slate-200/80 overflow-hidden flex flex-col h-full">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-orange-50/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                <AlertOctagon size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">Peringatan Kadaluarsa</h2>
                <p className="text-xs text-orange-600/80 font-medium mt-0.5">Berakhir dalam &lt; 30 Hari</p>
              </div>
            </div>
            <span className="bg-orange-600 text-white text-xs font-bold px-2 py-1 rounded-lg shadow-sm shadow-orange-600/20">
              {expiringProducts.length}
            </span>
          </div>

          <div className="p-4 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3 max-h-[400px]">
            {expiringProducts.length > 0 ? (
              expiringProducts.map((item) => {
                const daysLeft = Math.ceil((new Date(item.expiredAt).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                const isCritical = daysLeft <= 7;

                return (
                  <div key={item.id} className={`p-4 rounded-xl border ${isCritical ? 'bg-red-50/50 border-red-100' : 'bg-white border-slate-100 shadow-sm'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-sm text-slate-800 leading-tight pr-4">{item.produk.nama}</h4>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md whitespace-nowrap">
                        Qty: {item.kuantitas}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-3">{item.produk.kategori.nama}</p>
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100/80">
                      <span className="text-xs font-medium text-slate-500">{formatDate(item.expiredAt).split(' ')[0]}</span>
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${isCritical ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                        {daysLeft} Hari Lagi
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-10 text-center">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-3">
                  <Package size={24} className="text-emerald-500" />
                </div>
                <h4 className="font-bold text-slate-700">Stok Aman</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-[200px]">Tidak ada bahan baku yang akan kadaluarsa dalam waktu dekat.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;