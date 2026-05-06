import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import DataTable, { type Column } from '../components/shared/DataTable';
import Modal from '../components/shared/Modal';
import Input from '../components/shared/Input';
import Select from '../components/shared/Select';
import CurrencyInput from '../components/shared/CurrencyInput';
import FileInput from '../components/shared/FileInput';
import { applyApiErrors, handleApiError } from '../utils/errorHandler';
import { ProductType, type Produk as ProdukType, type Kategori as KategoriType } from '../types/domain';

interface PaginatedResponse<T> {
  items: T[];
  meta: {
    nextCursor: number | null;
    hasNextPage: boolean;
  };
}

interface ProdukFormPayload {
  kategoriId: number | '';
  nama: string;
  tipe: ProductType | '';
  stok: number;
  hargaBeli: number;
  hargaJual: number;
}

const initialFormState: ProdukFormPayload = {
  kategoriId: '',
  nama: '',
  tipe: '',
  stok: 0,
  hargaBeli: 0,
  hargaJual: 0,
};

type ProdukTableItem = ProdukType & Record<string, unknown>;

const Produk = () => {
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [cursorHistory, setCursorHistory] = useState<(number | undefined)[]>([undefined]);
  const currentCursor = cursorHistory[cursorHistory.length - 1];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ProdukFormPayload>(initialFormState);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ProdukFormPayload, string>>>({});
  const [stockErrors, setStockErrors] = useState<Partial<Record<'jumlahPenyesuaian' | 'keterangan', string>>>({});

  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedProdukId, setSelectedProdukId] = useState<number | null>(null);
  const [stockAdjustment, setStockAdjustment] = useState<{ jumlahPenyesuaian: number | string, keterangan: string }>({ jumlahPenyesuaian: '', keterangan: '' });
  const [fotoOpname, setFotoOpname] = useState<File | null>(null);

  const { data: produkData, isLoading } = useQuery({
    queryKey: ['products', searchTerm, currentCursor],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '10' });
      if (searchTerm) params.append('search', searchTerm);
      if (currentCursor) params.append('cursor', currentCursor.toString());
      const response = await api.get<{ data: PaginatedResponse<ProdukType> }>(`/products?${params.toString()}`);
      return response.data.data;
    },
  });

  const { data: kategoriData } = useQuery({
    queryKey: ['categories-all'],
    queryFn: async () => {
      const response = await api.get<{ data: PaginatedResponse<KategoriType> }>(`/categories?limit=100`);
      return response.data.data.items;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: Omit<ProdukFormPayload, 'kategoriId' | 'tipe'> & { kategoriId: number, tipe: ProductType }) => {
      await api.post('/products', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products-pos'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
      handleCloseModal();
    },
    onError: (error) => applyApiErrors(error, setFormErrors)
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: Partial<ProdukFormPayload> }) => {
      await api.patch(`/products/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      handleCloseModal();
    },
    onError: (error) => applyApiErrors(error, setFormErrors)
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products-pos'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
    },
    onError: (error) => alert(handleApiError(error).message)
  });


  const adjustStockMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: FormData }) => {
      await api.post(`/products/${id}/adjust`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      handleCloseStockModal();
    },
    onError: (error) => applyApiErrors(error, setStockErrors)
  });
  const handleSearch = (val: string) => {
    setSearchTerm(val);
    setCursorHistory([undefined]);
  };

  const handleNextPage = () => {
    if (produkData?.meta.hasNextPage && produkData.meta.nextCursor) {
      setCursorHistory((prev) => [...prev, produkData.meta.nextCursor as number]);
    }
  };

  const handlePrevPage = () => setCursorHistory((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));

  const handleOpenModal = (produk?: ProdukType) => {
    setFormErrors({});
    if (produk) {
      setEditingId(produk.id);
      setFormData({
        kategoriId: produk.kategoriId,
        nama: produk.nama,
        tipe: produk.tipe,
        stok: produk.stok,
        hargaBeli: produk.hargaBeli,
        hargaJual: produk.hargaJual,
      });
    } else {
      setEditingId(null);
      setFormData(initialFormState);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData(initialFormState);
  };

  const handleOpenStockModal = (produk: ProdukType) => {
    setSelectedProdukId(produk.id);
    setStockAdjustment({ jumlahPenyesuaian: 0, keterangan: '' });
    setFotoOpname(null);
    setIsStockModalOpen(true);
  };

  const handleCloseStockModal = () => {
    setIsStockModalOpen(false);
    setSelectedProdukId(null);
    setStockAdjustment({ jumlahPenyesuaian: 0, keterangan: '' });
    setFotoOpname(null);
    setStockErrors({});
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleCurrencyChange = (name: string, value: number) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    const errors: Partial<Record<keyof ProdukFormPayload, string>> = {};
    if (!formData.nama) errors.nama = 'Nama produk wajib diisi';
    if (!formData.kategoriId) errors.kategoriId = 'Kategori wajib dipilih';
    if (!formData.tipe) errors.tipe = 'Tipe wajib dipilih';

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    if (editingId) {
      updateMutation.mutate({ id: editingId, payload: formData });
    } else {

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      createMutation.mutate(formData as any);
    }
  };

  const columns: Column<ProdukTableItem>[] = [
    {
      header: 'Produk', accessor: 'nama', render: (val, row) => (
        <div>
          <div className="font-bold text-slate-800">{String(val)}</div>
          <div className="text-[11px] text-slate-500">{String(row.kategoriNama)} • {String(row.businessUnit)}</div>
        </div>
      )
    },
    {
      header: 'Tipe', accessor: 'tipe', render: (val) => (
        <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${val === 'BARANG' ? 'bg-emerald-100 text-emerald-700' : 'bg-purple-100 text-purple-700'}`}>
          {String(val)}
        </span>
      )
    },
    {
      header: 'Stok', accessor: 'stok', render: (val, row) => (
        <div className="flex items-center gap-2">
          <span className={`font-medium ${row.tipe === 'JASA' ? 'text-slate-400' : Number(val) <= 10 ? 'text-red-600' : 'text-slate-700'}`}>
            {row.tipe === 'JASA' ? '∞' : String(val)}
          </span>
          {row.tipe === 'BARANG' && (
            <button onClick={() => handleOpenStockModal(row as ProdukType)} className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded transition-colors cursor-pointer">
              Opname
            </button>
          )}
        </div>
      )
    },
    { header: 'Harga Beli', accessor: 'hargaBeli', render: (val) => `Rp ${new Intl.NumberFormat('id-ID').format(Number(val))}` },
    { header: 'Harga Jual', accessor: 'hargaJual', render: (val) => `Rp ${new Intl.NumberFormat('id-ID').format(Number(val))}` },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Manajemen Produk & Stok</h1>
        <p className="text-sm text-slate-500">Kelola master data lapangan, F&B, dan bahan baku operasional.</p>
      </div>

      <DataTable<ProdukTableItem>
        title="Daftar Master Produk"
        columns={columns}
        data={(produkData?.items as ProdukTableItem[]) || []}
        isLoading={isLoading}
        serverSide={true}
        searchTerm={searchTerm}
        onSearchChange={handleSearch}
        onAdd={() => handleOpenModal()}
        onEdit={(row) => handleOpenModal(row as ProdukType)}
        onDelete={(row) => {
          if (window.confirm(`Hapus produk ${row.nama}?`)) deleteMutation.mutate(Number(row.id));
        }}
        hasNextPage={produkData?.meta.hasNextPage}
        hasPrevPage={cursorHistory.length > 1}
        onNextPage={handleNextPage}
        onPrevPage={handlePrevPage}
      />

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingId ? 'Edit Produk' : 'Tambah Produk Baru'}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Nama Produk" name="nama" value={formData.nama} onChange={handleChange} error={formErrors.nama} />
          <Select
            label="Kategori" name="kategoriId"
            value={formData.kategoriId} onChange={handleChange} error={formErrors.kategoriId}
            options={kategoriData?.map(k => ({ value: k.id, label: `${k.nama} (${k.businessUnit})` })) || []}
          />
          <Select
            label="Tipe (Barang Fisik / Jasa Lapangan)" name="tipe"
            value={formData.tipe} onChange={handleChange} error={formErrors.tipe}
            options={[{ value: ProductType.BARANG, label: 'Barang (F&B / Bahan Baku)' }, { value: ProductType.JASA, label: 'Jasa (Sewa Lapangan)' }]}
          />
          <Input
            label="Stok Awal" name="stok" type="number"
            value={formData.stok} onChange={handleChange}
            disabled={formData.tipe === ProductType.JASA}
            className="text-lg font-bold disabled:opacity-60"
          />
          <CurrencyInput label="Harga Beli / Modal" name="hargaBeli" value={formData.hargaBeli} onValueChange={handleCurrencyChange} />
          <CurrencyInput label="Harga Jual" name="hargaJual" value={formData.hargaJual} onValueChange={handleCurrencyChange} />

        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
          <button onClick={handleCloseModal} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer">Batal</button>
          <button onClick={handleSubmit} className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer">Simpan Data</button>
        </div>
      </Modal>

      <Modal isOpen={isStockModalOpen} onClose={handleCloseStockModal} title="Penyesuaian Stok (Opname)">
        <div className="flex flex-col gap-4">
          <div className="bg-orange-50 text-orange-800 p-4 rounded-xl text-sm mb-2 border border-orange-100">
            <strong>Catatan:</strong> Gunakan nilai minus (-) untuk mengurangi stok (barang rusak/kadaluarsa), dan positif (+) untuk menambah stok (koreksi).
          </div>
          <Input
            label="Jumlah Penyesuaian"
            type="number"
            value={stockAdjustment.jumlahPenyesuaian}
            error={stockErrors.jumlahPenyesuaian}
            onChange={(e) => {
              const val = e.target.value;
              setStockAdjustment(p => ({ ...p, jumlahPenyesuaian: val === '' ? '' : Number(val) }));
              if (stockErrors.jumlahPenyesuaian) setStockErrors(p => ({ ...p, jumlahPenyesuaian: undefined }));
            }}
          />
          <Input
            label="Keterangan Audit"
            placeholder="Contoh: Barang rusak, koreksi perhitungan..."
            value={stockAdjustment.keterangan}
            error={stockErrors.keterangan}
            onChange={(e) => {
              setStockAdjustment(p => ({ ...p, keterangan: e.target.value }));
              if (stockErrors.keterangan) setStockErrors(p => ({ ...p, keterangan: undefined }));
            }}
          />

          <FileInput
            label="Foto Bukti (Expired / Beli Manual) - Opsional"
            accept="image/*"
            onChange={(e) => setFotoOpname(e.target.files?.[0] || null)}
          />
          {fotoOpname && <span className="text-[10px] text-emerald-600 font-bold ml-1 -mt-2">Terpilih: {fotoOpname.name}</span>}
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
          <button onClick={handleCloseStockModal} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer">Batal</button>
          <button
            onClick={() => {
              const formData = new FormData();
              formData.append('jumlahPenyesuaian', Number(stockAdjustment.jumlahPenyesuaian).toString());
              formData.append('keterangan', stockAdjustment.keterangan);
              if (fotoOpname) formData.append('fotoBukti', fotoOpname);

              adjustStockMutation.mutate({ id: selectedProdukId!, payload: formData });
            }}
            disabled={adjustStockMutation.isPending}
            className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer disabled:opacity-50"
          >
            {adjustStockMutation.isPending ? 'Menyimpan...' : 'Simpan Penyesuaian'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Produk;