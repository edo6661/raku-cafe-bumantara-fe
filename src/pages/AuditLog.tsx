
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldAlert } from 'lucide-react';
import api from '../lib/axios';
import DataTable, { type Column } from '../components/shared/DataTable';
import { formatDate } from '../utils/formatters';
import type { AuditLog } from '../types/domain';

interface PaginatedResponse<T> {
  items: T[];
  meta: { nextCursor: number | null; hasNextPage: boolean };
}


type AuditLogTableItem = AuditLog & Record<string, unknown>;

const AuditLogPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cursorHistory, setCursorHistory] = useState<(number | undefined)[]>([undefined]);
  const currentCursor = cursorHistory[cursorHistory.length - 1];

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', searchTerm, currentCursor],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '15' });
      if (searchTerm) params.append('search', searchTerm);
      if (currentCursor) params.append('cursor', currentCursor.toString());

      const response = await api.get<{ data: PaginatedResponse<AuditLog> }>(`/audit-logs?${params.toString()}`);
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

  const columns: Column<AuditLogTableItem>[] = [
    {
      header: 'Waktu',
      accessor: 'createdAt',
      render: (val) => <span className="text-slate-600 font-medium whitespace-nowrap">{formatDate(String(val))}</span>
    },
    {
      header: 'User / Aktor',
      accessor: 'username',
      render: (val) => (
        <span className="font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md">
          {String(val)}
        </span>
      )
    },
    {
      header: 'Aksi',
      accessor: 'action',
      render: (val) => {
        const action = String(val);
        const colors = {
          CREATE: 'bg-emerald-100 text-emerald-700',
          UPDATE: 'bg-blue-100 text-blue-700',
          DELETE: 'bg-rose-100 text-rose-700'
        }[action] || 'bg-slate-100 text-slate-700';

        return <span className={`px-2.5 py-1 rounded text-[10px] font-bold tracking-wider ${colors}`}>{action}</span>;
      }
    },
    {
      header: 'Modul (Entity)',
      accessor: 'entityName',
      render: (val, row) => (
        <div>
          <span className="font-bold text-slate-700">{String(val)}</span>
          <span className="ml-2 text-[11px] text-slate-400">ID: {row.entityId}</span>
        </div>
      )
    }
  ];


  const expandedRowRender = (row: AuditLogTableItem) => (
    <div className="p-4 bg-slate-900 rounded-xl overflow-x-auto shadow-inner m-4 mt-0">
      <div className="flex items-center gap-2 mb-3 border-b border-slate-700 pb-2">
        <ShieldAlert size={16} className="text-indigo-400" />
        <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest">Detail Log Perubahan Data</span>
      </div>
      <pre className="text-[11px] font-mono text-emerald-400 leading-relaxed">
        {JSON.stringify(row.changes, null, 2)}
      </pre>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Audit Log (System History)</h1>
        <p className="text-sm text-slate-500">Pantau seluruh aktivitas user (Create, Update, Delete) pada sistem.</p>
      </div>

      <DataTable<AuditLogTableItem>
        title="Daftar Aktivitas Sistem"
        columns={columns}
        data={(data?.items as AuditLogTableItem[]) || []}
        isLoading={isLoading}
        serverSide={true}
        searchTerm={searchTerm}
        onSearchChange={handleSearch}
        expandedRowRender={expandedRowRender}
        hasNextPage={data?.meta.hasNextPage}
        hasPrevPage={cursorHistory.length > 1}
        onNextPage={handleNextPage}
        onPrevPage={handlePrevPage}
      />
    </div>
  );
};

export default AuditLogPage;