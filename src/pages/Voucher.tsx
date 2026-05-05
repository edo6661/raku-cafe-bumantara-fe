import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import DataTable, { type Column } from '../components/shared/DataTable';
import Modal from '../components/shared/Modal';
import Input from '../components/shared/Input';
import Select from '../components/shared/Select';
import { handleApiError } from '../utils/errorHandler';
import { formatDate } from '../utils/formatters';
import type { Voucher } from '../types/domain';

interface PaginatedResponse<T> {
  items: T[];
  meta: {
    nextCursor: number | null;
    hasNextPage: boolean;
  };
}

type VoucherTableItem = Voucher & Record<string, unknown>;

interface VoucherFormPayload {
  nama: string;
  persentase: number | '';
  isActive: string;
}

const initialFormState: VoucherFormPayload = {
  nama: '',
  persentase: '',
  isActive: 'true',
};

const VoucherPage = () => {
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [cursorHistory, setCursorHistory] = useState<(number | undefined)[]>([undefined]);
  const currentCursor = cursorHistory[cursorHistory.length - 1];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<VoucherFormPayload>(initialFormState);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof VoucherFormPayload, string>>>({});

  const { data } = useQuery({
    queryKey: ['vouchers', searchTerm, currentCursor],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '10' });
      if (searchTerm) params.append('search', searchTerm);
      if (currentCursor) params.append('cursor', currentCursor.toString());

      const response = await api.get<{ data: PaginatedResponse<Voucher> }>(`/vouchers?${params.toString()}`);
      return response.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: { nama: string; persentase: number; isActive: boolean }) => {
      await api.post('/vouchers', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      handleCloseModal();
    },
    onError: (error) => alert(handleApiError(error).message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: Partial<{ nama: string; persentase: number; isActive: boolean }> }) => {
      await api.patch(`/vouchers/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      handleCloseModal();
    },
    onError: (error) => alert(handleApiError(error).message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/vouchers/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vouchers'] }),
    onError: (error) => alert(handleApiError(error).message),
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

  const handleOpenModal = (voucher?: Voucher) => {
    setFormErrors({});
    if (voucher) {
      setEditingId(voucher.id);
      setFormData({
        nama: voucher.nama,
        persentase: voucher.persentase,
        isActive: voucher.isActive ? 'true' : 'false',
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
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value,
    }));
    if (formErrors[name as keyof VoucherFormPayload]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = () => {
    const errors: Partial<Record<keyof VoucherFormPayload, string>> = {};
    if (!formData.nama || formData.nama.length < 3) {
      errors.nama = 'Nama voucher minimal 3 karakter';
    }
    if (formData.persentase === '' || formData.persentase < 0 || formData.persentase > 100) {
      errors.persentase = 'Persentase harus antara 0 dan 100';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const payload = {
      nama: formData.nama,
      persentase: Number(formData.persentase),
      isActive: formData.isActive === 'true',
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (voucher: Voucher) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus voucher "${voucher.nama}"?`)) {
      deleteMutation.mutate(voucher.id);
    }
  };

  const columns: Column<VoucherTableItem>[] = [
    { header: 'Nama Voucher', accessor: 'nama', render: (val) => <span className="font-bold text-slate-800">{String(val)}</span> },
    {
      header: 'Persentase Diskon',
      accessor: 'persentase',
      render: (val) => <span className="font-bold text-indigo-600">{Number(val)}%</span>
    },
    {
      header: 'Status',
      accessor: 'isActive',
      render: (val) => (
        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider ${val ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
          }`}>
          {val ? 'AKTIF' : 'NONAKTIF'}
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
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Voucher & Diskon</h1>
        <p className="text-sm text-slate-500">Kelola master data voucher dan preset diskon untuk kasir.</p>
      </div>

      <DataTable<VoucherTableItem>
        title="Daftar Voucher"
        columns={columns}
        data={(data?.items as VoucherTableItem[]) || []}
        serverSide={true}
        searchTerm={searchTerm}
        onSearchChange={handleSearch}
        onAdd={() => handleOpenModal()}
        onEdit={(row) => handleOpenModal(row as Voucher)}
        onDelete={(row) => handleDelete(row as Voucher)}
        hasNextPage={data?.meta.hasNextPage}
        hasPrevPage={cursorHistory.length > 1}
        onNextPage={handleNextPage}
        onPrevPage={handlePrevPage}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingId ? 'Edit Voucher' : 'Tambah Voucher Baru'}
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Nama Voucher"
            name="nama"
            placeholder="Contoh: Karyawan, Driver, Promo Kemerdekaan..."
            value={formData.nama}
            onChange={handleChange}
            error={formErrors.nama}
            disabled={createMutation.isPending || updateMutation.isPending}
          />
          <Input
            label="Persentase Diskon (%)"
            name="persentase"
            type="number"
            placeholder="Contoh: 40, 20, 10..."
            value={formData.persentase}
            onChange={handleChange}
            error={formErrors.persentase}
            disabled={createMutation.isPending || updateMutation.isPending}
          />
          <Select
            label="Status Voucher"
            name="isActive"
            value={formData.isActive}
            onChange={handleChange}
            disabled={createMutation.isPending || updateMutation.isPending}
            options={[
              { value: 'true', label: 'Aktif' },
              { value: 'false', label: 'Nonaktif' },
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

export default VoucherPage;