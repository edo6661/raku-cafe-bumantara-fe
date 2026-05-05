import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import DataTable, { type Column } from '../components/shared/DataTable';
import Modal from '../components/shared/Modal';
import Input from '../components/shared/Input';
import Select from '../components/shared/Select';
import { handleApiError } from '../utils/errorHandler';
import { formatDate } from '../utils/formatters';
import { BusinessUnit, type Kategori as KategoriType } from '../types/domain';


interface PaginatedResponse<T> {
  items: T[];
  meta: {
    nextCursor: number | null;
    hasNextPage: boolean;
  };
}


interface KategoriFormPayload {
  nama: string;
  businessUnit: BusinessUnit | '';
}
type KategoriTableItem = KategoriType & Record<string, unknown>;

const initialFormState: KategoriFormPayload = {
  nama: '',
  businessUnit: '',
};

const Kategori = () => {
  const queryClient = useQueryClient();


  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');


  const [cursorHistory, setCursorHistory] = useState<(number | undefined)[]>([undefined]);
  const currentCursor = cursorHistory[cursorHistory.length - 1];


  const [formData, setFormData] = useState<KategoriFormPayload>(initialFormState);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof KategoriFormPayload, string>>>({});


  const { data, isLoading } = useQuery({
    queryKey: ['categories', searchTerm, currentCursor],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '10' });
      if (searchTerm) params.append('search', searchTerm);
      if (currentCursor) params.append('cursor', currentCursor.toString());

      const response = await api.get<{ data: PaginatedResponse<KategoriType> }>(`/categories?${params.toString()}`);
      return response.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: KategoriFormPayload) => {
      await api.post('/categories', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories-all'] });
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
      handleCloseModal();
    },
    onError: (error) => {
      const result = handleApiError(error);
      alert(result.message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: Partial<KategoriFormPayload> }) => {
      await api.patch(`/categories/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      handleCloseModal();
    },
    onError: (error) => {
      const result = handleApiError(error);
      alert(result.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (error) => {
      const result = handleApiError(error);
      alert(result.message);
    }
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

  const handlePrevPage = () => {
    setCursorHistory((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  };

  const handleOpenModal = (kategori?: KategoriType) => {
    setFormErrors({});
    if (kategori) {
      setEditingId(kategori.id);
      setFormData({
        nama: kategori.nama,
        businessUnit: kategori.businessUnit,
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
    setFormErrors({});
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name as keyof KategoriFormPayload]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = () => {
    const errors: Partial<Record<keyof KategoriFormPayload, string>> = {};
    if (!formData.nama || formData.nama.length < 3) {
      errors.nama = 'Nama kategori minimal 3 karakter';
    }
    if (!formData.businessUnit) {
      errors.businessUnit = 'Business Unit wajib dipilih';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    if (editingId) {
      updateMutation.mutate({ id: editingId, payload: formData });
    } else {
      createMutation.mutate(formData as KategoriFormPayload);
    }
  };

  const handleDelete = (kategori: KategoriType) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus kategori "${kategori.nama}"?`)) {
      deleteMutation.mutate(kategori.id);
    }
  };


  const columns: Column<KategoriType>[] = [
    { header: 'Nama Kategori', accessor: 'nama' },
    {
      header: 'Business Unit',
      accessor: 'businessUnit',
      render: (val) => (
        <span className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-wider ${val === BusinessUnit.PADEL
          ? 'bg-blue-50 text-blue-600 border border-blue-200'
          : 'bg-orange-50 text-orange-600 border border-orange-200'
          }`}>
          {String(val)}
        </span>
      )
    },
    {
      header: 'Dibuat Pada',
      accessor: 'createdAt',
      render: (val) => <span className="text-slate-500">{formatDate(String(val))}</span>
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Kategori</h1>
        <p className="text-sm text-slate-500">Kelola kategori produk untuk Padel dan Cafe.</p>
      </div>

      <DataTable<KategoriTableItem>
        title="Daftar Kategori"
        columns={columns}
        data={(data?.items as KategoriTableItem[]) || []}
        isLoading={isLoading}
        serverSide={true}
        searchTerm={searchTerm}
        onSearchChange={handleSearch}
        onAdd={() => handleOpenModal()}
        onEdit={handleOpenModal}
        onDelete={handleDelete}
        hasNextPage={data?.meta.hasNextPage}
        hasPrevPage={cursorHistory.length > 1}
        onNextPage={handleNextPage}
        onPrevPage={handlePrevPage}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingId ? 'Edit Kategori' : 'Tambah Kategori Baru'}
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Nama Kategori"
            name="nama"
            placeholder="Masukkan nama kategori..."
            value={formData.nama}
            onChange={handleChange}
            error={formErrors.nama}
            disabled={createMutation.isPending || updateMutation.isPending}
          />
          <Select
            label="Business Unit"
            name="businessUnit"
            value={formData.businessUnit}
            onChange={handleChange}
            error={formErrors.businessUnit}
            disabled={createMutation.isPending || updateMutation.isPending}
            options={[
              { value: BusinessUnit.PADEL, label: 'Padel' },
              { value: BusinessUnit.CAFE, label: 'Cafe' },
            ]}
          />

          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
            <button
              onClick={handleCloseModal}
              className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              Batal
            </button>
            <button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {createMutation.isPending || updateMutation.isPending ? 'Menyimpan...' : 'Simpan Data'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Kategori;