import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { FinancialTransaction } from '../../types';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Plus, 
  Printer, 
  X,
  Trash2,
  AlertTriangle,
  Crown
} from 'lucide-react';

export const FinancialReportsView: React.FC = () => {
  const { financialTransactions, addFinancialExpense, deleteFinancialTransaction, currentUser } = useApp();
  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';

  const [dateFilter, setDateFilter] = useState<'MONTH' | 'ALL'>('MONTH');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'PEMASUKAN' | 'PENGELUARAN'>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [txToDelete, setTxToDelete] = useState<FinancialTransaction | null>(null);

  // New Expense Form
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<FinancialTransaction['category']>('OPERASIONAL_BBM');
  const [amount, setAmount] = useState<number>(100000);
  const [paymentMethod, setPaymentMethod] = useState<'TUNAI' | 'TRANSFER_BANK' | 'QRIS'>('TRANSFER_BANK');

  // Calculations
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  let filtered = [...financialTransactions];

  if (dateFilter === 'MONTH') {
    filtered = filtered.filter(t => t.date.startsWith(currentMonthStr));
  }
  if (typeFilter !== 'ALL') {
    filtered = filtered.filter(t => t.type === typeFilter);
  }

  const totalIncome = filtered
    .filter(t => t.type === 'PEMASUKAN')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = filtered
    .filter(t => t.type === 'PENGELUARAN')
    .reduce((sum, t) => sum + t.amount, 0);

  const netProfit = totalIncome - totalExpense;
  const profitMargin = totalIncome > 0 ? Math.round((netProfit / totalIncome) * 100) : 0;

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;

    addFinancialExpense({
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      category,
      amount,
      paymentMethod,
      description,
      recordedBy: currentUser.name,
    });

    setShowAddModal(false);
    setDescription('');
    setAmount(100000);
  };

  return (
    <div className="space-y-8 text-white">
      {/* Header with Bold Typography */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-blue-500 font-bold mb-1">
            Real-time Cash Flow & Accounting
          </p>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tighter leading-none text-white">
            ARUS KAS & LABA
          </h2>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Cetak Laporan
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-600/30 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Catat Pengeluaran
          </button>
        </div>
      </div>

      {/* KPI Cards in Frosted Dark Style */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl flex flex-col justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-400 font-bold mb-1">
              Total Pemasukan Servis
            </p>
            <h3 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-2 tabular-nums">
              Rp {totalIncome.toLocaleString('id-ID')}
            </h3>
          </div>
          <p className="text-[11px] text-white/50">Dari faktur servis & penjualan part</p>
        </div>

        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl flex flex-col justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-red-400 font-bold mb-1">
              Total Pengeluaran Kas
            </p>
            <h3 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-2 tabular-nums">
              Rp {totalExpense.toLocaleString('id-ID')}
            </h3>
          </div>
          <p className="text-[11px] text-white/50">Komisi teknisi, restok part, operasional</p>
        </div>

        <div className="bg-blue-600 p-6 rounded-3xl text-white flex flex-col justify-between shadow-xl shadow-blue-600/20">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-blue-200 font-bold mb-1">
              Laba Bersih ({profitMargin}% Margin)
            </p>
            <h3 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-2 tabular-nums">
              Rp {netProfit.toLocaleString('id-ID')}
            </h3>
          </div>
          <p className="text-[11px] text-blue-100 font-bold">Arus Kas Bersih Tersedia</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <button
            onClick={() => setDateFilter('MONTH')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition ${
              dateFilter === 'MONTH' ? 'bg-white text-black' : 'bg-white/5 text-white/60 hover:text-white'
            }`}
          >
            Bulan Ini
          </button>
          <button
            onClick={() => setDateFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition ${
              dateFilter === 'ALL' ? 'bg-white text-black' : 'bg-white/5 text-white/60 hover:text-white'
            }`}
          >
            Semua Periode
          </button>
        </div>

        <div className="flex gap-2">
          {['ALL', 'PEMASUKAN', 'PENGELUARAN'].map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                typeFilter === t ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/60 hover:text-white'
              }`}
            >
              {t === 'ALL' ? 'SEMUA MUTASI' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Mutation Journal Table in High-Contrast Card */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-4">
        <h3 className="text-base font-black text-white tracking-tight">Jurnal Buku Kas Real-time</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 text-white/70 font-black uppercase tracking-wider text-[10px] border-b border-white/10">
              <tr>
                <th className="py-3 px-4">Tanggal & Jam</th>
                <th className="py-3 px-4">Kategori & Keterangan</th>
                <th className="py-3 px-4">Metode</th>
                <th className="py-3 px-4">Oleh</th>
                <th className="py-3 px-4 text-right">Nominal</th>
                {isSuperAdmin && <th className="py-3 px-4 text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map(tx => (
                <tr key={tx.id} className="hover:bg-white/5">
                  <td className="py-3.5 px-4 font-mono text-white/70">{tx.date}</td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-white">{tx.description}</div>
                    <span className="text-[10px] font-black uppercase text-white/40">{tx.category.replace(/_/g, ' ')}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-white/60">{tx.paymentMethod}</td>
                  <td className="py-3.5 px-4 text-white/60">{tx.recordedBy}</td>
                  <td className={`py-3.5 px-4 text-right font-black tabular-nums text-sm ${
                    tx.type === 'PEMASUKAN' ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {tx.type === 'PEMASUKAN' ? '+' : '-'} Rp {tx.amount.toLocaleString('id-ID')}
                  </td>
                  {isSuperAdmin && (
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => setTxToDelete(tx)}
                        title="Hapus Transaksi (Super Admin)"
                        className="p-1.5 bg-red-500/10 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#121212] rounded-3xl p-6 max-w-md w-full border border-white/15 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base text-white">Catat Pengeluaran Kas Baru</h3>
              <button onClick={() => setShowAddModal(false)} className="text-white/40 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-4 text-xs">
              <div>
                <label className="block font-black uppercase tracking-wider text-white/60 mb-1">Keterangan Pengeluaran</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Contoh: Pembelian BBM armada teknisi #1"
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-black uppercase tracking-wider text-white/60 mb-1">Kategori</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as any)}
                  className="w-full p-2.5 bg-[#1a1a1a] border border-white/10 rounded-xl text-white font-bold"
                >
                  <option value="OPERASIONAL_BBM">OPERASIONAL BBM & TRANSPORT</option>
                  <option value="RESTOK_SUKU_CADANG">PEMBELIAN / RESTOK PART</option>
                  <option value="KOMISI_TEKNISI">KOMISI & GAJI TEKNISI</option>
                  <option value="PERAWATAN_ALAT">PERAWATAN ALAT / VACUUM PUMP</option>
                  <option value="LAINNYA">LAINNYA</option>
                </select>
              </div>

              <div>
                <label className="block font-black uppercase tracking-wider text-white/60 mb-1">Nominal Biaya (Rp)</label>
                <input
                  type="number"
                  min="1000"
                  step="5000"
                  required
                  value={amount}
                  onChange={e => setAmount(Number(e.target.value))}
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-red-400 font-black text-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black uppercase tracking-wider cursor-pointer"
                >
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Transaction Confirmation Modal */}
      {txToDelete && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-150">
          <div className="max-w-md w-full bg-[#181818] border border-red-500/40 rounded-3xl p-6 text-white space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-black">Hapus Transaksi Kas?</h3>
                <p className="text-xs text-white/60">{txToDelete.description}</p>
              </div>
            </div>

            <p className="text-xs text-white/70 leading-relaxed">
              Apakah Anda yakin ingin menghapus catatan transaksi sebesar <span className="font-bold text-white">Rp {txToDelete.amount.toLocaleString('id-ID')}</span> ini? Saldo dan laporan kas akan disesuaikan otomatis.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setTxToDelete(null)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  deleteFinancialTransaction(txToDelete.id);
                  setTxToDelete(null);
                }}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-red-600/40 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Ya, Hapus Transaksi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
