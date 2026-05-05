export const BusinessUnit = {
  PADEL: "PADEL",
  CAFE: "CAFE",
} as const;
export type BusinessUnit = (typeof BusinessUnit)[keyof typeof BusinessUnit];
export const TransactionType = {
  PEMASUKAN: "PEMASUKAN",
  PENGELUARAN: "PENGELUARAN",
} as const;
export type TransactionType =
  (typeof TransactionType)[keyof typeof TransactionType];
export const ProductType = {
  BARANG: "BARANG",
  JASA: "JASA",
} as const;
export type ProductType = (typeof ProductType)[keyof typeof ProductType];
export interface Kategori {
  id: number;
  nama: string;
  businessUnit: BusinessUnit;
  createdAt: string;
  updatedAt: string;
}
export interface Produk {
  id: number;
  kategoriId: number;
  kategoriNama: string;
  businessUnit: BusinessUnit;
  nama: string;
  tipe: ProductType;
  stok: number;
  hargaBeli: number;
  hargaJual: number;
  hargaJualWeekend?: number;
  createdAt: string;
  updatedAt: string;
}
export interface DetailTransaksi {
  id: number;
  transaksiId: number;
  produkId: number;
  kuantitas: number;
  hargaBeli: number;
  hargaJual: number;
  diskon: number;
  subtotal: number;
  expiredAt: string | null;
  produk: {
    nama: string;
    tipe: ProductType;
  };
}
export interface Transaksi {
  id: number;
  noTransaksi: string;
  businessUnit: BusinessUnit;
  tipe: TransactionType;
  waktuTransaksi: string;
  totalNominal: number;
  totalDiskon: number;
  fotoBuktiUrl: string | null;
  userId: number;
  user: {
    username: string;
  };
  details: DetailTransaksi[];
  createdAt: string;
  updatedAt: string;
}
export interface DashboardSummary {
  period: {
    startDate: string;
    endDate: string;
  };
  financial: {
    pemasukan: number;
    pengeluaran: number;
    net: number;
  };
  inventory: Array<{
    id: number;
    nama: string;
    tipe: ProductType;
    sisaStok: number;
    terjual: number;
    masuk: number;
  }>;
  expiringProducts: Array<{
    id: number;
    expiredAt: string;
    kuantitas: number;
    produk: {
      nama: string;
      kategori: {
        nama: string;
      };
    };
  }>;
}

export interface Voucher {
  id: number;
  nama: string;
  persentase: number;
  isActive: boolean;
}
