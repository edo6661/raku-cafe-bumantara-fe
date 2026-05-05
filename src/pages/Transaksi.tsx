import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShoppingCart, Plus, Minus, Trash2, UploadCloud, Calendar } from 'lucide-react';
import api from '../lib/axios';
import { BusinessUnit, TransactionType, type Produk, type Voucher } from '../types/domain';
import { handleApiError } from '../utils/errorHandler';
import CurrencyInput from '../components/shared/CurrencyInput';
interface CartItem extends Produk {
  cartId: string;
  kuantitas: number;
  diskonInput: number;
  expiredAtInput?: string;
  originalHargaJual: number;
}
interface PaginatedResponse<T> {
  items: T[];
  meta: { nextCursor: number | null; hasNextPage: boolean };
}
const isWeekend = (dateStr: string) => {
  const date = dateStr ? new Date(dateStr) : new Date();
  const day = date.getDay();
  return day === 0 || day === 6;
};
const Transaksi = () => {
  const queryClient = useQueryClient();
  const [businessUnit, setBusinessUnit] = useState<BusinessUnit>(BusinessUnit.CAFE);
  const [tipeTransaksi, setTipeTransaksi] = useState<TransactionType>(TransactionType.PEMASUKAN);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [fotoBukti, setFotoBukti] = useState<File | null>(null);
  const [waktuTransaksi, setWaktuTransaksi] = useState<string>('');
  const { data: produkData, isLoading } = useQuery({
    queryKey: ['products-pos', businessUnit],
    queryFn: async () => {
      const response = await api.get<{ data: PaginatedResponse<Produk> }>(
        `/products?limit=100&businessUnit=${businessUnit}`
      );
      return response.data.data.items;
    },
  });
  const { data: voucherData } = useQuery({
    queryKey: ['vouchers-active'],
    queryFn: async () => {
      const response = await api.get<{ data: PaginatedResponse<Voucher> }>(`/vouchers?limit=100`);
      return response.data.data.items.filter(v => v.isActive);
    },
  });
  const displayProducts = useMemo(() => {
    if (!produkData) return [];
    return produkData.filter((p) => {
      if (tipeTransaksi === TransactionType.PEMASUKAN) {
        return Number(p.hargaJual) > 0;
      } else {
        return p.tipe === 'BARANG';
      }
    });
  }, [produkData, tipeTransaksi]);
  const cartSummary = useMemo(() => {
    let subtotal = 0;
    let totalDiskon = 0;
    cart.forEach((item) => {
      const harga = tipeTransaksi === TransactionType.PEMASUKAN ? Number(item.hargaJual) : Number(item.hargaBeli);
      const kotor = harga * item.kuantitas;
      const diskon = Math.min(item.diskonInput, kotor);
      subtotal += (kotor - diskon);
      totalDiskon += diskon;
    });
    return { subtotal, totalDiskon };
  }, [cart, tipeTransaksi]);
  const checkoutMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await api.post('/transactions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: () => {
      alert('Transaksi berhasil disimpan!');
      setCart([]);
      setFotoBukti(null);
      setWaktuTransaksi('');
      queryClient.invalidateQueries({ queryKey: ['products-pos'] });
    },
    onError: (error) => alert(handleApiError(error).message),
  });
  const handleAddToCart = (produk: Produk) => {
    if (tipeTransaksi === TransactionType.PEMASUKAN && produk.tipe === 'BARANG' && produk.stok <= 0) {
      alert('Stok produk habis!');
      return;
    }
    setCart((prev) => {
      const existing = prev.find((item) => item.id === produk.id);
      if (existing) {
        if (tipeTransaksi === TransactionType.PEMASUKAN && produk.tipe === 'BARANG' && existing.kuantitas >= produk.stok) {
          alert('Mencapai batas maksimal stok yang tersedia!');
          return prev;
        }
        const isWknd = isWeekend(waktuTransaksi);
        return prev.map((item) => {
          if (item.id === produk.id) {
            let updatedHargaJual = item.hargaJual;
            if (item.tipe === 'JASA' && item.originalHargaJual && item.hargaJualWeekend) {
              updatedHargaJual = isWknd ? item.hargaJualWeekend : item.originalHargaJual;
            }
            return { ...item, kuantitas: item.kuantitas + 1, hargaJual: updatedHargaJual };
          }
          return item;
        });
      }
      const isWknd = isWeekend(waktuTransaksi);
      let appliedHargaJual = produk.hargaJual;
      if (tipeTransaksi === TransactionType.PEMASUKAN && produk.tipe === 'JASA' && produk.hargaJualWeekend && isWknd) {
        appliedHargaJual = produk.hargaJualWeekend;
      }
      return [...prev, {
        ...produk,
        hargaJual: appliedHargaJual,
        originalHargaJual: produk.hargaJual,
        cartId: Math.random().toString(36).substr(2, 9),
        kuantitas: 1,
        diskonInput: 0
      }];
    });
  };
  const handleUpdateCart = (cartId: string, field: keyof CartItem, value: any) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.cartId === cartId) {
          if (field === 'kuantitas' && tipeTransaksi === TransactionType.PEMASUKAN && item.tipe === 'BARANG' && value > item.stok) {
            alert('Mencapai batas maksimal stok!');
            return item;
          }
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };
  const handleRemoveFromCart = (cartId: string) => {
    setCart((prev) => prev.filter((item) => item.cartId !== cartId));
  };
  const handleCheckout = () => {
    if (cart.length === 0) return alert('Keranjang masih kosong!');
    const formData = new FormData();
    formData.append('businessUnit', businessUnit);
    formData.append('tipe', tipeTransaksi);
    if (waktuTransaksi) {
      formData.append('waktuTransaksi', new Date(waktuTransaksi).toISOString());
    }
    if (fotoBukti) {
      formData.append('fotoBukti', fotoBukti);
    }
    const itemsPayload = cart.map((item) => ({
      produkId: item.id,
      kuantitas: item.kuantitas,
      hargaBeli: Number(item.hargaBeli),
      hargaJual: Number(item.hargaJual),
      diskon: item.diskonInput,
      expiredAt: item.expiredAtInput ? new Date(item.expiredAtInput).toISOString() : undefined,
    }));
    formData.append('items', JSON.stringify(itemsPayload));
    checkoutMutation.mutate(formData);
  };
  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
      <div className="flex-1 flex flex-col bg-white rounded-[20px] shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex bg-slate-100 p-1 rounded-xl w-max">
            {(Object.values(BusinessUnit) as BusinessUnit[]).map((unit) => (
              <button
                key={unit}
                onClick={() => { setBusinessUnit(unit); setCart([]); }}
                className={`px-6 py-2 text-sm font-bold rounded-lg transition-all cursor-pointer ${businessUnit === unit ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                {unit}
              </button>
            ))}
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl w-max">
            <button
              onClick={() => { setTipeTransaksi(TransactionType.PEMASUKAN); setCart([]); }}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all cursor-pointer ${tipeTransaksi === TransactionType.PEMASUKAN ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500'
                }`}
            >
              Penjualan (Masuk)
            </button>
            <button
              onClick={() => { setTipeTransaksi(TransactionType.PENGELUARAN); setCart([]); }}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all cursor-pointer ${tipeTransaksi === TransactionType.PENGELUARAN ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-500'
                }`}
            >
              Pembelian (Keluar)
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {isLoading ? (
            <div className="text-center py-10 text-slate-500">Memuat produk...</div>
          ) : displayProducts.length === 0 ? (
            <div className="text-center py-10 text-slate-500">Tidak ada produk tersedia untuk kategori ini.</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {displayProducts.map((produk) => (
                <div
                  key={produk.id}
                  onClick={() => handleAddToCart(produk)}
                  className="border border-slate-200 rounded-xl p-4 hover:border-indigo-400 hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer bg-slate-50/50 flex flex-col justify-between h-32"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-400 mb-1">{produk.kategoriNama}</div>
                    <h3 className="text-sm font-bold text-slate-800 line-clamp-2 leading-tight">{produk.nama}</h3>
                  </div>
                  <div className="flex justify-between items-end mt-2">
                    <span className="text-indigo-600 font-black text-sm">
                      Rp {new Intl.NumberFormat('id-ID').format(tipeTransaksi === TransactionType.PEMASUKAN ?
                        (isWeekend(waktuTransaksi) && produk.tipe === 'JASA' && produk.hargaJualWeekend ? Number(produk.hargaJualWeekend) : Number(produk.hargaJual))
                        : Number(produk.hargaBeli))}
                    </span>
                    {produk.tipe === 'BARANG' && (
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${produk.stok > 0 ? 'bg-slate-200 text-slate-600' : 'bg-red-100 text-red-600'}`}>
                        Sisa: {produk.stok}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="w-full lg:w-[400px] flex flex-col bg-white rounded-[20px] shadow-sm border border-slate-200/80 overflow-hidden flex-shrink-0">
        <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
            <ShoppingCart size={20} />
          </div>
          <div>
            <h2 className="font-bold text-slate-800">Keranjang Transaksi</h2>
            <p className="text-xs text-slate-500 font-medium">{cart.length} Item dipilih</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-4">
          {cart.length === 0 ? (
            <div className="m-auto text-center text-slate-400 text-sm">Keranjang kosong.<br />Pilih produk di sebelah kiri.</div>
          ) : (
            cart.map((item) => (
              <div key={item.cartId} className="border border-slate-100 rounded-xl p-3 bg-white shadow-sm/50 relative">
                <div className="flex justify-between items-start mb-2 pr-6">
                  <h4 className="text-sm font-bold text-slate-800 leading-tight">{item.nama}</h4>
                  <button onClick={() => handleRemoveFromCart(item.cartId)} className="absolute top-3 right-3 text-red-400 hover:text-red-600 transition-colors cursor-pointer">
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm font-bold text-slate-700">
                    Rp {new Intl.NumberFormat('id-ID').format(tipeTransaksi === TransactionType.PEMASUKAN ? Number(item.hargaJual) : Number(item.hargaBeli))}
                  </span>
                  <div className="flex items-center gap-3 bg-slate-100 rounded-lg p-1">
                    <button onClick={() => handleUpdateCart(item.cartId, 'kuantitas', Math.max(1, item.kuantitas - 1))} className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-slate-600 hover:text-indigo-600 cursor-pointer">
                      <Minus size={14} />
                    </button>
                    <span className="text-base font-black w-8 text-center text-slate-800">{item.kuantitas}</span>
                    <button onClick={() => handleUpdateCart(item.cartId, 'kuantitas', item.kuantitas + 1)} className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-slate-600 hover:text-indigo-600 cursor-pointer">
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
                <div className="mt-3 space-y-3 pt-3 border-t border-slate-50">
                  {tipeTransaksi === TransactionType.PEMASUKAN && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Voucher / Preset Diskon</label>
                      <div className="flex flex-wrap gap-2 mb-1">

                        {voucherData?.map((voucher) => (
                          <button
                            key={voucher.id}
                            onClick={() => {
                              const harga = Number(item.hargaJual);
                              const diskonPersen = Number(voucher.persentase) / 100;
                              handleUpdateCart(item.cartId, 'diskonInput', (harga * item.kuantitas) * diskonPersen);
                            }}
                            className="text-[10px] px-2 py-1 bg-indigo-50 text-indigo-600 rounded-md font-bold hover:bg-indigo-100 transition-colors border border-indigo-200 cursor-pointer"
                          >
                            {voucher.nama} ({voucher.persentase}%)
                          </button>
                        ))}

                        <button
                          onClick={() => handleUpdateCart(item.cartId, 'diskonInput', 0)}
                          className="text-[10px] px-2 py-1 bg-slate-100 text-slate-600 rounded-md font-bold hover:bg-slate-200 transition-colors border border-slate-200 cursor-pointer"
                        >
                          Reset
                        </button>
                      </div>

                      <CurrencyInput
                        label="Atau Nominal Manual (Rp)"
                        name={`diskon-${item.cartId}`}
                        value={item.diskonInput}
                        onValueChange={(_, val) => handleUpdateCart(item.cartId, 'diskonInput', val)}
                      />
                    </div>
                  )}
                  {tipeTransaksi === TransactionType.PENGELUARAN && item.tipe === 'BARANG' && (
                    <div className="flex flex-col gap-1.5 w-full bg-orange-50/50 p-2 rounded-lg border border-orange-100">
                      <label className="text-[11px] font-bold text-orange-700 uppercase tracking-wider ml-1">Expired Date (Opsional)</label>
                      <input
                        type="date"
                        value={item.expiredAtInput || ''}
                        onChange={(e) => handleUpdateCart(item.cartId, 'expiredAtInput', e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-orange-200 outline-none focus:border-orange-500 bg-white text-black"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex flex-col gap-4">
          <div className="space-y-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Waktu Transaksi (Default: Saat ini)</label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="datetime-local"
                  value={waktuTransaksi}
                  onChange={(e) => setWaktuTransaksi(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 outline-none focus:border-indigo-500 bg-white text-black"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                {tipeTransaksi === TransactionType.PENGELUARAN ? 'Foto Bukti (Nota Beli / Foto Expired)' : 'Foto Bukti (Transfer/QRIS)'}
              </label>
              <div className="relative">
                <UploadCloud size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFotoBukti(e.target.files?.[0] || null)}
                  className="w-full pl-9 pr-3 py-1.5 text-sm rounded-xl border border-slate-200 bg-white file:hidden text-slate-600 cursor-pointer"
                />
              </div>
              {fotoBukti && <span className="text-[10px] text-emerald-600 font-bold ml-1">File: {fotoBukti.name}</span>}
            </div>
          </div>
          <div className="border-t border-slate-200 border-dashed pt-3">
            {tipeTransaksi === TransactionType.PEMASUKAN && (
              <div className="flex justify-between items-center mb-1 text-sm">
                <span className="text-slate-500 font-medium">Total Diskon</span>
                <span className="text-rose-500 font-bold">- Rp {new Intl.NumberFormat('id-ID').format(cartSummary.totalDiskon)}</span>
              </div>
            )}
            <div className="flex justify-between items-end mt-2">
              <span className="text-sm font-bold text-slate-600 uppercase tracking-wider">Total Bayar</span>
              <span className="text-2xl font-black text-indigo-600">Rp {new Intl.NumberFormat('id-ID').format(cartSummary.subtotal)}</span>
            </div>
          </div>
          <button
            onClick={handleCheckout}
            disabled={checkoutMutation.isPending || cart.length === 0}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {checkoutMutation.isPending ? 'Memproses...' : `Proses Transaksi ${tipeTransaksi === TransactionType.PEMASUKAN ? 'Masuk' : 'Keluar'}`}
          </button>
        </div>
      </div>
    </div>
  );
};
export default Transaksi;