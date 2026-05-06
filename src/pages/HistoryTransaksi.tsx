
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/axios';
import DataTable, { type Column } from '../components/shared/DataTable';
import Modal from '../components/shared/Modal';
import { BusinessUnit, TransactionType, type Transaksi } from '../types/domain';
import { formatDate } from '../utils/formatters';
import { ExternalLink, Receipt, Filter } from 'lucide-react';

interface PaginatedResponse<T> {
  items: T[];
  meta: { nextCursor: number | null; hasNextPage: boolean };
}


type HistoryTableItem = Transaksi & Record<string, unknown>;

const HistoryTransaksi = () => {

  const [searchTerm, setSearchTerm] = useState('');
  const [cursorHistory, setCursorHistory] = useState<(number | undefined)[]>([undefined]);
  const currentCursor = cursorHistory[cursorHistory.length - 1];


  const [filterUnit, setFilterUnit] = useState<BusinessUnit | ''>('');
  const [filterTipe, setFilterTipe] = useState<TransactionType | ''>('');


  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);


  const { data, isLoading } = useQuery({
    queryKey: ['transactions-history', searchTerm, currentCursor, filterUnit, filterTipe],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '10' });
      if (searchTerm) params.append('search', searchTerm);
      if (currentCursor) params.append('cursor', currentCursor.toString());
      if (filterUnit) params.append('businessUnit', filterUnit);
      if (filterTipe) params.append('tipe', filterTipe);

      const response = await api.get<{ data: PaginatedResponse<Transaksi> }>(`/transactions?${params.toString()}`);
      return response.data.data;
    },
  });


  const handleSearch = (val: string) => {
    setSearchTerm(val);
    setCursorHistory([undefined]);
  };

  const handleNextPage = () => {
    if (data?.meta.hasNextPage && data.meta.nextCursor) {
      setCursorHistory((prev) => [...prev, data.meta.nextCursor as number]);
    }
  };

  const handlePrevPage = () => setCursorHistory((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));

  const formatCurrency = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);


  const columns: Column<HistoryTableItem>[] = [
    {
      header: 'Kategori',
      accessor: 'tipe',
      render: (_, row) => (
        <div className="flex flex-col gap-1.5 items-start">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${row.tipe === TransactionType.PEMASUKAN ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
            {row.tipe}
          </span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${row.businessUnit === BusinessUnit.PADEL ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-orange-50 text-orange-600 border border-orange-100'}`}>
            {row.businessUnit}
          </span>
        </div>
      )
    },
    {
      header: 'Waktu / Kasir',
      accessor: 'waktuTransaksi',
      render: (val, row) => (
        <div>
          <div className="text-sm font-medium text-slate-600">{formatDate(String(val))}</div>
          <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
            Oleh: <span className="font-bold text-slate-700">{row.user.username}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Total Nominal',
      accessor: 'totalNominal',
      render: (val, row) => (
        <div>
          <div className={`font-black ${row.tipe === TransactionType.PEMASUKAN ? 'text-emerald-600' : 'text-rose-600'}`}>
            {row.tipe === TransactionType.PEMASUKAN ? '+' : '-'} {formatCurrency(Number(val))}
          </div>
          {Number(row.totalDiskon) > 0 && (
            <div className="text-[10px] text-slate-400 font-medium">Diskon: {formatCurrency(Number(row.totalDiskon))}</div>
          )}
        </div>
      )
    },
    {
      header: 'Bukti',
      accessor: 'fotoBuktiUrl',
      render: (val) => val ? (
        <img
          src={String(val)}
          alt="Bukti Transaksi"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedPhotoUrl(String(val));
            setIsPhotoModalOpen(true);
          }}
          className="w-10 h-10 object-cover rounded-lg border border-slate-200 cursor-pointer hover:opacity-80 transition-opacity"
          title="Lihat Bukti"
        />
      ) : <span className="text-[11px] text-slate-400 italic">Tidak ada</span>
    }
  ];


  const expandedRowRender = (row: HistoryTableItem) => (
    <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
      <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
        Detail Item Transaksi
      </h4>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider">
              <th className="pb-2 font-bold">Produk</th>
              <th className="pb-2 font-bold text-center">Qty</th>
              <th className="pb-2 font-bold text-right">Harga Satuan</th>
              <th className="pb-2 font-bold text-right">Diskon</th>
              <th className="pb-2 font-bold text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {row.details.map((detail, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50">
                <td className="py-2.5">
                  <span className="font-bold text-slate-700">{detail.produk.nama}</span>
                  <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-500">{detail.produk.tipe}</span>
                </td>
                <td className="py-2.5 text-center font-medium text-slate-600">{detail.kuantitas}</td>
                <td className="py-2.5 text-right font-medium text-slate-600">
                  {formatCurrency(row.tipe === TransactionType.PEMASUKAN ? detail.hargaJual : detail.hargaBeli)}
                </td>
                <td className="py-2.5 text-right font-medium text-rose-500">
                  {detail.diskon > 0 ? formatCurrency(detail.diskon) : '-'}
                </td>
                <td className="py-2.5 text-right font-bold text-slate-800">
                  {formatCurrency(detail.subtotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Riwayat Transaksi</h1>
          <p className="text-sm text-slate-500">Pantau seluruh aktivitas pemasukan dan pengeluaran.</p>
        </div>

        {/* Filter Custom */}
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 px-3 border-r border-slate-200">
            <Filter size={14} className="text-slate-400" />
            <select
              value={filterTipe}
              onChange={(e) => { setFilterTipe(e.target.value as TransactionType | ''); setCursorHistory([undefined]); }}
              className="text-xs font-bold text-slate-600 bg-transparent outline-none cursor-pointer"
            >
              <option value="">Semua Tipe</option>
              <option value={TransactionType.PEMASUKAN}>Pemasukan (Sales)</option>
              <option value={TransactionType.PENGELUARAN}>Pengeluaran (Beli)</option>
            </select>
          </div>
          <div className="px-2">
            <select
              value={filterUnit}
              onChange={(e) => { setFilterUnit(e.target.value as BusinessUnit | ''); setCursorHistory([undefined]); }}
              className="text-xs font-bold text-slate-600 bg-transparent outline-none cursor-pointer"
            >
              <option value="">Semua Unit</option>
              <option value={BusinessUnit.PADEL}>Padel</option>
              <option value={BusinessUnit.CAFE}>Cafe</option>
            </select>
          </div>
        </div>
      </div>

      <DataTable<HistoryTableItem>
        title="Daftar History Transaksi"
        columns={columns}
        data={(data?.items as HistoryTableItem[]) || []}
        serverSide={true}
        isLoading={isLoading}
        searchTerm={searchTerm}
        onSearchChange={handleSearch}
        expandedRowRender={expandedRowRender}
        hasNextPage={data?.meta.hasNextPage}
        hasPrevPage={cursorHistory.length > 1}
        onNextPage={handleNextPage}
        onPrevPage={handlePrevPage}
      />

      {/* Modal Foto Bukti */}
      <Modal isOpen={isPhotoModalOpen} onClose={() => setIsPhotoModalOpen(false)} title="Bukti Transaksi">
        <div className="flex flex-col items-center gap-4">
          {selectedPhotoUrl ? (
            <>
              <img src={selectedPhotoUrl} alt="Bukti Transaksi" className="max-w-full max-h-[60vh] object-contain rounded-xl border border-slate-200" />
              <a
                href={selectedPhotoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-4 py-2 rounded-lg transition-colors"
              >
                Buka di Tab Baru <ExternalLink size={16} />
              </a>
            </>
          ) : (
            <p className="text-slate-500 py-10">Gambar tidak ditemukan.</p>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default HistoryTransaksi;