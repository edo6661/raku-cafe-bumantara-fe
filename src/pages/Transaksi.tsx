import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShoppingCart, Plus, Minus, Trash2, UploadCloud, Calendar, ReceiptText } from 'lucide-react';
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
    // Menghapus h-[calc] yang baku, diganti dengan min-h untuk mobile dan max-h untuk desktop
    <div className="flex flex-col xl:flex-row gap-6 h-full xl:max-h-[calc(100vh-7rem)]">

      {/* PANEL KIRI: KATALOG PRODUK */}
      <div className="flex-1 flex flex-col bg-white rounded-[24px] shadow-sm border border-slate-200/80 overflow-hidden min-h-[500px]">
        {/* Header Filter Pos */}
        <div className="p-4 md:p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between gap-4 bg-slate-50/30">
          <div className="flex bg-slate-100 p-1.5 rounded-xl w-max border border-slate-200/60">
            {(Object.values(BusinessUnit) as BusinessUnit[]).map((unit) => (
              <button
                key={unit}
                onClick={() => { setBusinessUnit(unit); setCart([]); }}
                className={`px-5 md:px-6 py-2.5 text-[13px] font-bold rounded-lg transition-all cursor-pointer ${businessUnit === unit ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                  }`}
              >
                {unit}
              </button>
            ))}
          </div>

          <div className="flex bg-slate-100 p-1.5 rounded-xl w-max border border-slate-200/60">
            <button
              onClick={() => { setTipeTransaksi(TransactionType.PEMASUKAN); setCart([]); }}
              className={`px-4 py-2.5 text-[13px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-2 ${tipeTransaksi === TransactionType.PEMASUKAN ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200/50'
                }`}
            >
              <Plus size={16} className={tipeTransaksi !== TransactionType.PEMASUKAN ? 'text-slate-400' : ''} /> Penjualan
            </button>
            <button
              onClick={() => { setTipeTransaksi(TransactionType.PENGELUARAN); setCart([]); }}
              className={`px-4 py-2.5 text-[13px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-2 ${tipeTransaksi === TransactionType.PENGELUARAN ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200/50'
                }`}
            >
              <Minus size={16} className={tipeTransaksi !== TransactionType.PENGELUARAN ? 'text-slate-400' : ''} /> Pembelian
            </button>
          </div>
        </div>

        {/* List Produk */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-slate-50/50">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              <p className="font-bold text-sm">Memuat Katalog Produk...</p>
            </div>
          ) : displayProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
              <ReceiptText size={48} className="text-slate-300" />
              <p className="font-medium text-sm">Katalog kosong untuk kategori ini.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
              {displayProducts.map((produk) => (
                <button
                  key={produk.id}
                  onClick={() => handleAddToCart(produk)}
                  className="group relative border border-slate-200 rounded-2xl p-4 bg-white text-left hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-600/10 hover:-translate-y-1 transition-all active:scale-95 cursor-pointer flex flex-col justify-between h-36 overflow-hidden"
                >
                  {/* Decorative background circle on hover */}
                  <div className="absolute -right-6 -top-6 w-20 h-20 bg-indigo-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>

                  <div className="relative z-10">
                    <div className="text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">{produk.kategoriNama}</div>
                    <h3 className="text-[13px] md:text-sm font-bold text-slate-800 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors">{produk.nama}</h3>
                  </div>

                  <div className="relative z-10 flex justify-between items-end mt-2">
                    <span className="text-indigo-600 font-black text-sm md:text-base">
                      Rp {new Intl.NumberFormat('id-ID').format(tipeTransaksi === TransactionType.PEMASUKAN ?
                        (isWeekend(waktuTransaksi) && produk.tipe === 'JASA' && produk.hargaJualWeekend ? Number(produk.hargaJualWeekend) : Number(produk.hargaJual))
                        : Number(produk.hargaBeli))}
                    </span>
                    {produk.tipe === 'BARANG' && (
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${produk.stok > 0 ? 'bg-slate-100 text-slate-600' : 'bg-red-100 text-red-600'}`}>
                        Sisa: {produk.stok}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* PANEL KANAN: KERANJANG TRANSAKSI */}
      <div className="w-full xl:w-[420px] flex flex-col bg-white rounded-[24px] shadow-sm border border-slate-200/80 overflow-hidden flex-shrink-0 lg:sticky lg:top-0">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
              <ShoppingCart size={20} />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 tracking-tight">Keranjang</h2>
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">{cart.length} Item dipilih</p>
            </div>
          </div>

          {cart.length > 0 && (
            <button onClick={() => setCart([])} className="text-[11px] font-bold text-red-500 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer">
              Kosongkan
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar flex flex-col gap-4">
          {cart.length === 0 ? (
            <div className="m-auto flex flex-col items-center text-center text-slate-400 gap-3">
              <ShoppingCart size={40} className="text-slate-200" />
              <p className="text-sm font-medium">Keranjang kosong.<br />Silakan pilih produk dari katalog.</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.cartId} className="border border-slate-100 rounded-2xl p-4 bg-white shadow-sm relative group hover:border-slate-300 transition-colors">
                <div className="flex justify-between items-start mb-3 pr-8">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 leading-tight mb-0.5">{item.nama}</h4>
                    <p className="text-[11px] font-bold text-indigo-600">
                      Rp {new Intl.NumberFormat('id-ID').format(tipeTransaksi === TransactionType.PEMASUKAN ? Number(item.hargaJual) : Number(item.hargaBeli))}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveFromCart(item.cartId)}
                    className="absolute top-4 right-4 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Hapus Item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="flex items-center justify-between bg-slate-50 rounded-xl p-1.5 border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-2">Kuantitas</span>
                  <div className="flex items-center gap-1 bg-white rounded-lg p-0.5 border border-slate-200 shadow-sm">
                    <button
                      onClick={() => handleUpdateCart(item.cartId, 'kuantitas', Math.max(1, item.kuantitas - 1))}
                      className="w-8 h-8 flex items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 hover:text-indigo-600 active:scale-95 transition-all cursor-pointer"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="text-sm font-black w-8 text-center text-slate-800">{item.kuantitas}</span>
                    <button
                      onClick={() => handleUpdateCart(item.cartId, 'kuantitas', item.kuantitas + 1)}
                      className="w-8 h-8 flex items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 hover:text-indigo-600 active:scale-95 transition-all cursor-pointer"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                {/* Bagian Diskon (Khusus Penjualan) */}
                {tipeTransaksi === TransactionType.PEMASUKAN && (
                  <div className="mt-3 pt-3 border-t border-slate-100 border-dashed">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Opsi Diskon (Pilih Salah Satu)</label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {voucherData?.map((voucher) => (
                        <button
                          key={voucher.id}
                          onClick={() => {
                            const harga = Number(item.hargaJual);
                            const diskonPersen = Number(voucher.persentase) / 100;
                            handleUpdateCart(item.cartId, 'diskonInput', (harga * item.kuantitas) * diskonPersen);
                          }}
                          className="text-[11px] px-3 py-1.5 bg-white text-indigo-600 rounded-lg font-bold hover:bg-indigo-50 hover:border-indigo-300 transition-colors border border-indigo-200 cursor-pointer shadow-sm"
                        >
                          {voucher.nama} ({voucher.persentase}%)
                        </button>
                      ))}
                      <button
                        onClick={() => handleUpdateCart(item.cartId, 'diskonInput', 0)}
                        className="text-[11px] px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg font-bold hover:bg-slate-200 transition-colors border border-slate-200 cursor-pointer"
                      >
                        Reset
                      </button>
                    </div>

                    <CurrencyInput
                      label="Atau Diskon Manual (Rp)"
                      name={`diskon-${item.cartId}`}
                      value={item.diskonInput}
                      onValueChange={(_, val) => handleUpdateCart(item.cartId, 'diskonInput', val)}
                    />
                  </div>
                )}

                {/* Bagian Tanggal Kadaluarsa (Khusus Pembelian) */}
                {tipeTransaksi === TransactionType.PENGELUARAN && item.tipe === 'BARANG' && (
                  <div className="mt-3 flex flex-col gap-1.5 w-full bg-orange-50/50 p-3 rounded-xl border border-orange-100">
                    <label className="text-[10px] font-bold text-orange-700 uppercase tracking-wider">Expired Date (Wajib untuk Stok)</label>
                    <input
                      type="date"
                      value={item.expiredAtInput || ''}
                      onChange={(e) => handleUpdateCart(item.cartId, 'expiredAtInput', e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-orange-200 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 bg-white text-black transition-all"
                    />
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* SUMMARY & CHECKOUT BUTTON */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Waktu (Opsional)</label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="datetime-local"
                  value={waktuTransaksi}
                  onChange={(e) => setWaktuTransaksi(e.target.value)}
                  className="w-full pl-9 pr-2 py-2 text-xs font-medium rounded-xl border border-slate-200 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 bg-white text-black transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1 truncate" title={tipeTransaksi === TransactionType.PENGELUARAN ? 'Nota Beli' : 'Struk/Transfer'}>
                {tipeTransaksi === TransactionType.PENGELUARAN ? 'Bukti Nota' : 'Bukti Bayar'}
              </label>
              <div className="relative">
                <UploadCloud size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFotoBukti(e.target.files?.[0] || null)}
                  className="w-full pl-9 pr-2 py-1.5 text-xs font-medium rounded-xl border border-slate-200 bg-white text-slate-600 cursor-pointer file:hidden transition-all hover:border-slate-300"
                />
              </div>
            </div>

            {fotoBukti && <div className="col-span-2 text-[10px] text-emerald-600 font-bold ml-1 bg-emerald-50 p-1.5 rounded-lg truncate">📷 {fotoBukti.name}</div>}
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            {tipeTransaksi === TransactionType.PEMASUKAN && cartSummary.totalDiskon > 0 && (
              <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-100 border-dashed">
                <span className="text-[12px] text-slate-500 font-bold uppercase tracking-wider">Total Diskon</span>
                <span className="text-sm text-rose-500 font-bold">- Rp {new Intl.NumberFormat('id-ID').format(cartSummary.totalDiskon)}</span>
              </div>
            )}
            <div className="flex justify-between items-end">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Total Bayar</span>
              <span className="text-2xl md:text-3xl font-black text-indigo-600 tracking-tight">Rp {new Intl.NumberFormat('id-ID').format(cartSummary.subtotal)}</span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={checkoutMutation.isPending || cart.length === 0}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex justify-center items-center gap-2"
          >
            {checkoutMutation.isPending ? (
              <>Memproses <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div></>
            ) : (
              `Bayar Transaksi`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Transaksi;