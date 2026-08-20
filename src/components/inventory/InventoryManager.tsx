import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { InventoryItem } from '../../types';
import { 
  Boxes, 
  Plus, 
  Search, 
  AlertTriangle, 
  TrendingUp, 
  PackagePlus, 
  History, 
  DollarSign,
  Tag,
  ArrowDownRight,
  ArrowUpRight,
  X,
  Trash2,
  Crown
} from 'lucide-react';

export const InventoryManager: React.FC = () => {
  const { 
    currentUser, 
    inventory, 
    addInventoryItem, 
    deleteInventoryItem,
    restockItem, 
    inventoryTransactions 
  } = useApp();

  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
  const isTechnician = currentUser.role === 'TEKNISI';
  const isSuperOrAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN';

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'STOCK' | 'LOGS'>('STOCK');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [selectedItemForRestock, setSelectedItemForRestock] = useState<InventoryItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);

  // Add Item Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState<any>('FREON');
  const [stock, setStock] = useState<number>(5);
  const [minThreshold, setMinThreshold] = useState<number>(3);
  const [unit, setUnit] = useState('pcs');
  const [purchasePrice, setPurchasePrice] = useState<number>(50000);
  const [sellingPrice, setSellingPrice] = useState<number>(100000);
  const [compatibleUnits, setCompatibleUnits] = useState('');
  const [supplier, setSupplier] = useState('');

  // Restock Form State
  const [restockQty, setRestockQty] = useState<number>(5);
  const [restockPrice, setRestockPrice] = useState<number>(0);
  const [restockSupplier, setRestockSupplier] = useState('');
  const [restockNotes, setRestockNotes] = useState('');

  // Calculations
  const totalStockCount = inventory.reduce((sum, item) => sum + item.stock, 0);
  const totalAssetValue = inventory.reduce((sum, item) => sum + (item.stock * item.purchasePrice), 0);
  const totalSalesPotential = inventory.reduce((sum, item) => sum + (item.stock * item.sellingPrice), 0);
  const lowStockItems = inventory.filter(item => item.stock <= item.minStockThreshold);

  // Filter items
  let filteredItems = [...inventory];
  if (categoryFilter !== 'ALL') {
    filteredItems = filteredItems.filter(i => i.category === categoryFilter);
  }
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filteredItems = filteredItems.filter(i => 
      i.name.toLowerCase().includes(q) || 
      i.code.toLowerCase().includes(q) ||
      (i.compatibleUnits && i.compatibleUnits.toLowerCase().includes(q))
    );
  }

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) return;

    addInventoryItem({
      name,
      code,
      category,
      stock,
      minStockThreshold: minThreshold,
      unit,
      purchasePrice,
      sellingPrice,
      compatibleUnits,
      supplier,
    });

    setShowAddModal(false);
    setName('');
    setCode('');
    setPurchasePrice(50000);
    setSellingPrice(100000);
  };

  const handleRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForRestock || restockQty <= 0) return;

    restockItem(
      selectedItemForRestock.id, 
      restockQty, 
      restockPrice > 0 ? restockPrice : selectedItemForRestock.purchasePrice,
      restockSupplier || selectedItemForRestock.supplier,
      restockNotes || 'Restok pengadaan suku cadang gudang'
    );

    setShowRestockModal(false);
    setSelectedItemForRestock(null);
    setRestockQty(5);
    setRestockNotes('');
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'FREON':
        return <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-md font-black text-[9px] uppercase tracking-wider">FREON</span>;
      case 'KAPASITOR':
        return <span className="px-2.5 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-md font-black text-[9px] uppercase tracking-wider">KAPASITOR</span>;
      case 'PIPA':
        return <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-md font-black text-[9px] uppercase tracking-wider">PIPA TEMBAGA</span>;
      case 'MODUL_PCB':
        return <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-md font-black text-[9px] uppercase tracking-wider">MODUL PCB</span>;
      default:
        return <span className="px-2.5 py-0.5 bg-white/10 text-white/70 border border-white/20 rounded-md font-black text-[9px] uppercase tracking-wider">{cat}</span>;
    }
  };

  return (
    <div className="space-y-8 text-white">
      {/* Header section with Bold Typography */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-blue-500 font-bold mb-1">
            Warehouse & Parts Tracking
          </p>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tighter leading-none text-white">
            INVENTARIS SUKU CADANG
          </h2>
        </div>

        {isSuperOrAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-600/30 transition cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Tambah Suku Cadang
          </button>
        )}
      </div>

      {/* KPI Cards in Frosted Dark Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold mb-1">Total Unit Part</p>
            <h3 className="text-4xl font-black tracking-tight text-white mb-2 tabular-nums">{totalStockCount}</h3>
          </div>
          <p className="text-[11px] text-white/60 font-medium">Dari {inventory.length} varian suku cadang aktif</p>
        </div>

        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold mb-1">Valuasi Aset Modal</p>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2 tabular-nums">
              Rp {totalAssetValue.toLocaleString('id-ID')}
            </h3>
          </div>
          <p className="text-[11px] text-blue-400 font-bold">Harga Beli Modal Gudang</p>
        </div>

        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold mb-1">Potensi Penjualan</p>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-emerald-400 mb-2 tabular-nums">
              Rp {totalSalesPotential.toLocaleString('id-ID')}
            </h3>
          </div>
          <p className="text-[11px] text-emerald-400/80 font-bold">Estimasi Pendapatan Servis</p>
        </div>

        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold mb-1">Peringatan Restok</p>
            <h3 className={`text-4xl font-black tracking-tight mb-2 tabular-nums ${lowStockItems.length > 0 ? 'text-red-400' : 'text-white'}`}>
              {lowStockItems.length}
            </h3>
          </div>
          <p className="text-[11px] text-white/60 font-medium">
            {lowStockItems.length > 0 ? 'Item di bawah batas minimum' : 'Semua part dalam kondisi aman'}
          </p>
        </div>
      </div>

      {/* Tabs & Controls */}
      <div className="bg-white/5 p-4 sm:p-5 rounded-2xl border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('STOCK')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${
                activeTab === 'STOCK' ? 'bg-blue-600 text-white shadow-md' : 'bg-white/5 text-white/60 hover:text-white'
              }`}
            >
              Katalog Stok Suku Cadang
            </button>
            <button
              onClick={() => setActiveTab('LOGS')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${
                activeTab === 'LOGS' ? 'bg-blue-600 text-white shadow-md' : 'bg-white/5 text-white/60 hover:text-white'
              }`}
            >
              Riwayat Mutasi & Restok
            </button>
          </div>

          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari nama part, kode SKU, atau kecocokan PK AC..."
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Category filters if STOCK tab */}
        {activeTab === 'STOCK' && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
            {[
              { id: 'ALL', label: 'SEMUA KATEGORI' },
              { id: 'FREON', label: 'FREON (R32/R410/R22)' },
              { id: 'KAPASITOR', label: 'KAPASITOR' },
              { id: 'PIPA', label: 'PIPA TEMBAGA' },
              { id: 'MODUL_PCB', label: 'MODUL & SENSOR' },
              { id: 'LAINNYA', label: 'LAINNYA' },
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition cursor-pointer ${
                  categoryFilter === cat.id ? 'bg-white text-black' : 'bg-white/5 text-white/60 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Stock Table View */}
      {activeTab === 'STOCK' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map(item => {
            const isLow = item.stock <= item.minStockThreshold;

            return (
              <div
                key={item.id}
                className="bg-white/5 border border-white/10 hover:border-white/20 rounded-3xl p-6 transition flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    {getCategoryBadge(item.category)}
                    <span className="font-mono text-xs font-black text-white/40">{item.code}</span>
                  </div>

                  <h3 className="text-lg font-black text-white tracking-tight leading-snug">{item.name}</h3>
                  <p className="text-xs text-white/50 mt-1">Kecocokan: {item.compatibleUnits || 'Semua AC Split & Cassette'}</p>

                  <div className="mt-4 p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-white/40 font-bold uppercase text-[10px]">Stok Saat Ini:</span>
                      <span className={`text-lg font-black tabular-nums ${isLow ? 'text-red-400' : 'text-white'}`}>
                        {item.stock} <span className="text-xs font-normal text-white/60">{item.unit}</span>
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-white/40 font-bold uppercase text-[10px]">Harga Jual Servis:</span>
                      <span className="font-black text-emerald-400 tabular-nums">
                        Rp {item.sellingPrice.toLocaleString('id-ID')}
                      </span>
                    </div>

                    {isSuperOrAdmin && (
                      <div className="flex justify-between items-center text-xs pt-1 border-t border-white/5">
                        <span className="text-white/30 text-[10px]">Harga Modal Beli:</span>
                        <span className="font-bold text-white/60 tabular-nums">
                          Rp {item.purchasePrice.toLocaleString('id-ID')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {isSuperOrAdmin && (
                  <div className="pt-2 flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedItemForRestock(item);
                        setRestockPrice(item.purchasePrice);
                        setShowRestockModal(true);
                      }}
                      className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer text-center"
                    >
                      Restok Part Ini
                    </button>
                    {isSuperOrAdmin && (
                      <button
                        onClick={() => setItemToDelete(item)}
                        title="Hapus Suku Cadang"
                        className="px-3 py-2.5 bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-500/30 rounded-xl transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Logs View */}
      {activeTab === 'LOGS' && (
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
          <h3 className="font-black text-base text-white tracking-tight">Jurnal Mutasi Masuk / Keluar Suku Cadang</h3>
          <div className="divide-y divide-white/10 text-xs">
            {inventoryTransactions.map(tx => (
              <div key={tx.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{tx.itemName}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      tx.type === 'RESTOCK' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {tx.type === 'RESTOCK' ? '+ Restok Masuk' : '- Terpakai Servis'}
                    </span>
                  </div>
                  <p className="text-white/40 text-[11px] mt-0.5">{tx.date} • Oleh: {tx.userName} • {tx.notes}</p>
                </div>
                <span className={`font-black text-sm tabular-nums ${tx.type === 'RESTOCK' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {tx.type === 'RESTOCK' ? `+${tx.quantity}` : `-${tx.quantity}`} unit
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#121212] rounded-3xl p-6 max-w-lg w-full border border-white/15 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base text-white">Tambah Suku Cadang Baru ke Gudang</h3>
              <button onClick={() => setShowAddModal(false)} className="text-white/40 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateItem} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-black uppercase tracking-wider text-white/60 mb-1">Nama Suku Cadang</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Contoh: Freon R32 Daikin 1 Kg"
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-black uppercase tracking-wider text-white/60 mb-1">Kode SKU</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    placeholder="FRN-R32-01"
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-black uppercase tracking-wider text-white/60 mb-1">Kategori</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full p-2.5 bg-[#1a1a1a] border border-white/10 rounded-xl text-white font-bold"
                  >
                    <option value="FREON">FREON</option>
                    <option value="KAPASITOR">KAPASITOR</option>
                    <option value="PIPA">PIPA TEMBAGA</option>
                    <option value="MODUL_PCB">MODUL PCB & SENSOR</option>
                    <option value="LAINNYA">LAINNYA</option>
                  </select>
                </div>
                <div>
                  <label className="block font-black uppercase tracking-wider text-white/60 mb-1">Satuan</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-black uppercase tracking-wider text-white/60 mb-1">Stok Awal</label>
                  <input
                    type="number"
                    min="1"
                    value={stock}
                    onChange={e => setStock(Number(e.target.value))}
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white font-black"
                  />
                </div>
                <div>
                  <label className="block font-black uppercase tracking-wider text-white/60 mb-1">Batas Minimum Peringatan</label>
                  <input
                    type="number"
                    min="1"
                    value={minThreshold}
                    onChange={e => setMinThreshold(Number(e.target.value))}
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white font-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-black uppercase tracking-wider text-white/60 mb-1">Harga Beli Modal (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={purchasePrice}
                    onChange={e => setPurchasePrice(Number(e.target.value))}
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white font-black"
                  />
                </div>
                <div>
                  <label className="block font-black uppercase tracking-wider text-white/60 mb-1">Harga Jual Servis (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={sellingPrice}
                    onChange={e => setSellingPrice(Number(e.target.value))}
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-emerald-400 font-black"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black uppercase tracking-wider"
                >
                  Simpan Part Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {showRestockModal && selectedItemForRestock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#121212] rounded-3xl p-6 max-w-md w-full border border-white/15 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-base text-white">Restok Pengadaan Gudang</h3>
                <p className="text-xs text-white/50">{selectedItemForRestock.name}</p>
              </div>
              <button onClick={() => setShowRestockModal(false)} className="text-white/40 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleRestockSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-black uppercase tracking-wider text-white/60 mb-1">Jumlah Tambahan Stok</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={restockQty}
                  onChange={e => setRestockQty(Number(e.target.value))}
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white font-black text-lg"
                />
              </div>

              <div>
                <label className="block font-black uppercase tracking-wider text-white/60 mb-1">Harga Beli Modal Per Unit (Rp)</label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={restockPrice}
                  onChange={e => setRestockPrice(Number(e.target.value))}
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white font-black"
                />
              </div>

              <div>
                <label className="block font-black uppercase tracking-wider text-white/60 mb-1">Catatan / Supplier</label>
                <input
                  type="text"
                  value={restockNotes}
                  onChange={e => setRestockNotes(e.target.value)}
                  placeholder="Pengadaan batch gudang pusat"
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowRestockModal(false)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black uppercase tracking-wider"
                >
                  Konfirmasi Restok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Item Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-150">
          <div className="max-w-md w-full bg-[#181818] border border-red-500/40 rounded-3xl p-6 text-white space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-black">Hapus Suku Cadang?</h3>
                <p className="text-xs text-white/60 font-mono">{itemToDelete.code} - {itemToDelete.name}</p>
              </div>
            </div>

            <p className="text-xs text-white/70 leading-relaxed">
              Apakah Anda yakin ingin menghapus item suku cadang ini dari database katalog inventaris?
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  deleteInventoryItem(itemToDelete.id);
                  setItemToDelete(null);
                }}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-red-600/40 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Ya, Hapus Part
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
