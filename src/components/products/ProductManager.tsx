import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ServiceCategory, InventoryItem, ProductPackage } from '../../types';
import { 
  Package, 
  Wrench, 
  Boxes, 
  Layers, 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  DollarSign, 
  Percent, 
  ShieldCheck, 
  Sparkles, 
  Calculator, 
  Tag, 
  TrendingUp, 
  AlertCircle,
  Building2,
  Home,
  CheckCircle2,
  HelpCircle,
  AlertTriangle
} from 'lucide-react';

export const ProductManager: React.FC = () => {
  const { 
    currentUser, 
    serviceCategories, 
    inventory, 
    productPackages,
    addServiceCategory,
    updateServiceCategory,
    deleteServiceCategory,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    addProductPackage,
    updateProductPackage,
    deleteProductPackage,
    hasPermission,
    showNotification 
  } = useApp();

  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
  const canManage = hasPermission('products_manage') || isSuperAdmin;

  const [activeTab, setActiveTab] = useState<'SERVICES' | 'GOODS' | 'PACKAGES' | 'CALCULATOR'>('SERVICES');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  // Delete Target States for In-App Confirmation Modals
  const [serviceToDelete, setServiceToDelete] = useState<ServiceCategory | null>(null);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  const [packageToDelete, setPackageToDelete] = useState<ProductPackage | null>(null);

  // Modal / Form States
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<ServiceCategory | null>(null);
  const [serviceFormData, setServiceFormData] = useState<Partial<ServiceCategory>>({
    name: '',
    description: '',
    basePrice: 0,
    warrantyDays: 30,
    isActive: true,
  });

  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [itemFormData, setItemFormData] = useState<Partial<InventoryItem>>({
    code: '',
    name: '',
    category: 'SPAREPART',
    stock: 0,
    minStockThreshold: 5,
    unit: 'pcs',
    purchasePrice: 0,
    sellingPrice: 0,
    isActive: true,
    itemType: 'BARANG',
  });

  const [showPackageModal, setShowPackageModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<ProductPackage | null>(null);
  const [packageFormData, setPackageFormData] = useState<Partial<ProductPackage>>({
    name: '',
    description: '',
    targetCustomerType: 'SEMUA',
    includedServices: [],
    includedSpareParts: [],
    packagePrice: 0,
    originalPrice: 0,
    isActive: true,
    discountBadge: '',
  });

  // Simulator Calculator State
  const [simSelectedServices, setSimSelectedServices] = useState<{ id: string; qty: number }[]>([]);
  const [simSelectedItems, setSimSelectedItems] = useState<{ id: string; qty: number }[]>([]);
  const [simDiscount, setSimDiscount] = useState<number>(0);

  // --- SERVICE CATEGORY ACTIONS ---
  const handleOpenAddService = () => {
    setEditingService(null);
    setServiceFormData({
      name: '',
      description: '',
      basePrice: 75000,
      warrantyDays: 30,
      isActive: true,
    });
    setShowServiceModal(true);
  };

  const handleOpenEditService = (service: ServiceCategory) => {
    setEditingService(service);
    setServiceFormData({
      name: service.name,
      description: service.description || '',
      basePrice: service.basePrice,
      warrantyDays: service.warrantyDays || 30,
      isActive: service.isActive !== false,
    });
    setShowServiceModal(true);
  };

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceFormData.name?.trim()) {
      showNotification('Nama layanan jasa wajib diisi', 'error');
      return;
    }

    if (editingService) {
      updateServiceCategory(editingService.id, serviceFormData);
      showNotification(`Layanan jasa "${serviceFormData.name}" berhasil diperbarui!`, 'success');
    } else {
      addServiceCategory({
        name: serviceFormData.name!,
        description: serviceFormData.description || '',
        basePrice: serviceFormData.basePrice || 0,
        warrantyDays: serviceFormData.warrantyDays || 30,
        isActive: serviceFormData.isActive !== false,
      });
      showNotification(`Layanan jasa baru "${serviceFormData.name}" berhasil ditambahkan!`, 'success');
    }
    setShowServiceModal(false);
  };

  const handleDeleteService = (id: string, name?: string) => {
    deleteServiceCategory(id);
    showNotification(`Layanan jasa "${name || id}" telah dihapus`, 'info');
  };

  // --- INVENTORY ITEM (BARANG) ACTIONS ---
  const handleOpenAddItem = () => {
    setEditingItem(null);
    const generatedCode = `BRG-${Math.floor(1000 + Math.random() * 9000)}`;
    setItemFormData({
      code: generatedCode,
      name: '',
      category: 'SPAREPART',
      stock: 10,
      minStockThreshold: 3,
      unit: 'pcs',
      purchasePrice: 50000,
      sellingPrice: 85000,
      isActive: true,
      itemType: 'BARANG',
    });
    setShowItemModal(true);
  };

  const handleOpenEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setItemFormData({
      code: item.code,
      name: item.name,
      category: item.category,
      stock: item.stock,
      minStockThreshold: item.minStockThreshold,
      unit: item.unit,
      purchasePrice: item.purchasePrice,
      sellingPrice: item.sellingPrice,
      isActive: item.isActive !== false,
      itemType: item.itemType || 'BARANG',
    });
    setShowItemModal(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemFormData.name?.trim()) {
      showNotification('Nama produk barang wajib diisi', 'error');
      return;
    }

    if (editingItem) {
      updateInventoryItem(editingItem.id, itemFormData);
      showNotification(`Produk barang "${itemFormData.name}" berhasil diperbarui!`, 'success');
    } else {
      addInventoryItem({
        code: itemFormData.code || `BRG-${Date.now().toString().slice(-4)}`,
        name: itemFormData.name!,
        category: itemFormData.category || 'SPAREPART',
        stock: Number(itemFormData.stock) || 0,
        minStockThreshold: Number(itemFormData.minStockThreshold) || 3,
        unit: itemFormData.unit || 'pcs',
        purchasePrice: Number(itemFormData.purchasePrice) || 0,
        sellingPrice: Number(itemFormData.sellingPrice) || 0,
        isActive: itemFormData.isActive !== false,
        itemType: itemFormData.itemType || 'BARANG',
      });
      showNotification(`Produk barang baru "${itemFormData.name}" berhasil ditambahkan!`, 'success');
    }
    setShowItemModal(false);
  };

  const handleDeleteItem = (id: string, name?: string) => {
    deleteInventoryItem(id);
    showNotification(`Produk barang "${name || id}" telah dihapus`, 'info');
  };

  // --- PACKAGE ACTIONS ---
  const handleOpenAddPackage = () => {
    setEditingPackage(null);
    setPackageFormData({
      name: '',
      description: '',
      targetCustomerType: 'SEMUA',
      includedServices: [],
      includedSpareParts: [],
      packagePrice: 150000,
      originalPrice: 180000,
      isActive: true,
      discountBadge: 'Hemat 15%',
    });
    setShowPackageModal(true);
  };

  const handleOpenEditPackage = (pkg: ProductPackage) => {
    setEditingPackage(pkg);
    const services = pkg.includedServices || (pkg.servicesIncluded ? pkg.servicesIncluded.map(s => ({ serviceCategoryId: s.serviceCategoryId, categoryName: s.serviceCategoryName, quantity: s.quantity })) : []);
    const parts = pkg.includedSpareParts || (pkg.itemsIncluded ? pkg.itemsIncluded.map(p => ({ inventoryItemId: p.inventoryItemId, name: p.itemName, quantity: p.quantity, unit: p.unit })) : []);

    setPackageFormData({
      name: pkg.name,
      description: pkg.description,
      targetCustomerType: pkg.targetCustomerType || 'SEMUA',
      includedServices: [...services],
      includedSpareParts: [...parts],
      packagePrice: pkg.packagePrice,
      originalPrice: pkg.originalPrice,
      isActive: pkg.isActive,
      discountBadge: pkg.discountBadge || pkg.badgeText || '',
    });
    setShowPackageModal(true);
  };

  const handleSavePackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!packageFormData.name?.trim()) {
      showNotification('Nama paket produk wajib diisi', 'error');
      return;
    }

    if (editingPackage) {
      updateProductPackage(editingPackage.id, packageFormData);
      showNotification(`Paket "${packageFormData.name}" berhasil diperbarui!`, 'success');
    } else {
      addProductPackage({
        name: packageFormData.name!,
        description: packageFormData.description || '',
        targetCustomerType: packageFormData.targetCustomerType || 'SEMUA',
        includedServices: packageFormData.includedServices || [],
        includedSpareParts: packageFormData.includedSpareParts || [],
        packagePrice: Number(packageFormData.packagePrice) || 0,
        originalPrice: Number(packageFormData.originalPrice) || Number(packageFormData.packagePrice) || 0,
        isActive: packageFormData.isActive !== false,
        discountBadge: packageFormData.discountBadge,
      });
      showNotification(`Paket baru "${packageFormData.name}" berhasil ditambahkan!`, 'success');
    }
    setShowPackageModal(false);
  };

  const handleDeletePackage = (id: string, name?: string) => {
    deleteProductPackage(id);
    showNotification(`Paket "${name || id}" telah dihapus`, 'info');
  };

  // Filtered Services
  const filteredServices = serviceCategories.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Filtered Goods
  const filteredGoods = inventory.filter(g => {
    const matchesSearch = g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterType === 'ALL' || g.category === filterType;
    return matchesSearch && matchesCategory;
  });

  // Filtered Packages
  const filteredPackages = productPackages.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTarget = filterType === 'ALL' || p.targetCustomerType === filterType || p.targetCustomerType === 'SEMUA';
    return matchesSearch && matchesTarget;
  });

  // --- SIMULATOR CALCULATOR TOTALS ---
  const simTotalService = simSelectedServices.reduce((acc, item) => {
    const s = serviceCategories.find(c => c.id === item.id);
    return acc + (s ? s.basePrice * item.qty : 0);
  }, 0);

  const simTotalGoods = simSelectedItems.reduce((acc, item) => {
    const g = inventory.find(i => i.id === item.id);
    return acc + (g ? g.sellingPrice * item.qty : 0);
  }, 0);

  const simTotalCost = simSelectedItems.reduce((acc, item) => {
    const g = inventory.find(i => i.id === item.id);
    return acc + (g ? g.purchasePrice * item.qty : 0);
  }, 0);

  const simTotalTechCommission = simSelectedServices.reduce((acc, item) => {
    const s = serviceCategories.find(c => c.id === item.id);
    const commPct = s?.technicianCommissionPercent ?? 30;
    return acc + (s ? Math.round((s.basePrice * item.qty * commPct) / 100) : 0);
  }, 0);

  const simGrandRevenue = Math.max(0, simTotalService + simTotalGoods - simDiscount);
  const simGrossProfit = simGrandRevenue - simTotalCost - simTotalTechCommission;
  const simProfitMarginPercent = simGrandRevenue > 0 ? Math.round((simGrossProfit / simGrandRevenue) * 100) : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-900/40 via-slate-900 to-indigo-900/30 p-6 rounded-3xl border border-white/10 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-blue-600/30 text-blue-400 border border-blue-500/30 shadow-inner">
            <Package className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Katalog Produk: Barang & Jasa
              </h1>
              {isSuperAdmin && (
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Full Root Control
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-white/60 mt-0.5">
              Kelola master tarif layanan jasa, suku cadang/material, paket promo hemat, dan kalkulasi margin laba
            </p>
          </div>
        </div>

        {/* Action Button depending on activeTab */}
        {canManage && (
          <div className="flex items-center gap-2">
            {activeTab === 'SERVICES' && (
              <button
                id="btn-add-service"
                onClick={handleOpenAddService}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-lg shadow-blue-600/30 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Tambah Layanan Jasa
              </button>
            )}

            {activeTab === 'GOODS' && (
              <button
                id="btn-add-goods"
                onClick={handleOpenAddItem}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-lg shadow-amber-600/30 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Tambah Barang / Part
              </button>
            )}

            {activeTab === 'PACKAGES' && (
              <button
                id="btn-add-package"
                onClick={handleOpenAddPackage}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-lg shadow-purple-600/30 flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Buat Paket Bundling
              </button>
            )}
          </div>
        )}
      </div>

      {/* Navigation Tabs & Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        
        {/* Tab Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth pb-1 -mx-1 px-1">
          <button
            onClick={() => { setActiveTab('SERVICES'); setFilterType('ALL'); }}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-2 shrink-0 text-nowrap ${
              activeTab === 'SERVICES'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10 border border-white/5'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            Layanan Jasa ({serviceCategories.length})
          </button>

          <button
            onClick={() => { setActiveTab('GOODS'); setFilterType('ALL'); }}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-2 shrink-0 text-nowrap ${
              activeTab === 'GOODS'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10 border border-white/5'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            Barang & Suku Cadang ({inventory.length})
          </button>

          <button
            onClick={() => { setActiveTab('PACKAGES'); setFilterType('ALL'); }}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-2 shrink-0 text-nowrap ${
              activeTab === 'PACKAGES'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10 border border-white/5'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Paket Promo & Bundling ({productPackages.length})
          </button>

          <button
            onClick={() => setActiveTab('CALCULATOR')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-2 shrink-0 text-nowrap ${
              activeTab === 'CALCULATOR'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10 border border-white/5'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            Simulasi Margin Laba
          </button>
        </div>

        {/* Search & Filter (when not on calculator tab) */}
        {activeTab !== 'CALCULATOR' && (
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama, kode, deskripsi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
              />
            </div>

            {activeTab === 'GOODS' && (
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none"
              >
                <option value="ALL">Semua Kategori</option>
                <option value="SPAREPART">Sparepart</option>
                <option value="MATERIAL">Material & Pipa</option>
                <option value="FREON">Freon Refrigerant</option>
                <option value="UNIT_BARU">Unit AC Baru</option>
              </select>
            )}

            {activeTab === 'PACKAGES' && (
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none"
              >
                <option value="ALL">Semua Target Klien</option>
                <option value="UMUM">Khusus Rumah (Residensial)</option>
                <option value="KANTOR">Khusus Perusahaan / B2B</option>
              </select>
            )}
          </div>
        )}
      </div>

      {/* --- TAB 1: LAYANAN JASA --- */}
      {activeTab === 'SERVICES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServices.map(service => (
            <div 
              key={service.id}
              className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 flex flex-col justify-between hover:border-blue-500/40 transition shadow-lg group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h3 className="text-sm font-black text-white group-hover:text-blue-400 transition">
                      {service.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20">
                        Garansi {service.warrantyDays || 30} Hari
                      </span>
                      {service.isActive !== false ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Aktif
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-500/10 text-red-400 border border-red-500/20">
                          Non-Aktif
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 shrink-0">
                    <Wrench className="w-4 h-4" />
                  </div>
                </div>

                <p className="text-xs text-white/60 line-clamp-2 mt-2">
                  {service.description || 'Layanan teknis standar berkualitas tinggi dengan SOP pendingin profesional.'}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-white/40 block">Tarif Konsumen</span>
                    <span className="text-base font-black text-white font-mono">
                      Rp {service.basePrice.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-white/40 block">Garansi Layanan</span>
                    <span className="text-xs font-bold text-cyan-400">
                      {service.warrantyDays || 30} Hari
                    </span>
                  </div>
                </div>

                {canManage && (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
                    <button
                      onClick={() => handleOpenEditService(service)}
                      className="px-3 py-1.5 bg-white/5 hover:bg-white/15 text-white rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                      Edit
                    </button>
                    <button
                      onClick={() => setServiceToDelete(service)}
                      className="p-1.5 bg-red-500/10 hover:bg-red-500/25 text-red-400 border border-red-500/20 rounded-lg transition cursor-pointer"
                      title="Hapus Layanan Jasa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- TAB 2: BARANG & SUKU CADANG --- */}
      {activeTab === 'GOODS' && (
        <div className="bg-slate-900/60 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 border-b border-white/10 text-white/50 font-black uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Kode & Nama Barang</th>
                  <th className="py-3.5 px-4">Kategori</th>
                  <th className="py-3.5 px-4 text-center">Stok Fisik</th>
                  <th className="py-3.5 px-4 text-right">Harga Modal (Beli)</th>
                  <th className="py-3.5 px-4 text-right">Harga Jual Konsumen</th>
                  <th className="py-3.5 px-4 text-right">Margin Laba / Unit</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  {canManage && <th className="py-3.5 px-4 text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white">
                {filteredGoods.map(item => {
                  const profit = item.sellingPrice - item.purchasePrice;
                  const marginPct = item.sellingPrice > 0 ? Math.round((profit / item.sellingPrice) * 100) : 0;
                  const isLowStock = item.stock <= item.minStockThreshold;

                  return (
                    <tr key={item.id} className="hover:bg-white/5 transition">
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-[10px] text-amber-400 font-bold block">{item.code}</span>
                        <span className="font-bold text-white text-xs">{item.name}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 text-white/70 border border-white/10">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                          isLowStock 
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {item.stock} {item.unit}
                        </span>
                        {isLowStock && (
                          <span className="block text-[9px] text-red-400 font-bold mt-0.5">Min: {item.minStockThreshold}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-white/70">
                        Rp {item.purchasePrice.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                        Rp {item.sellingPrice.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-mono font-bold text-emerald-400 block">
                          +Rp {profit.toLocaleString('id-ID')}
                        </span>
                        <span className="text-[10px] text-emerald-400/80 font-bold">
                          ({marginPct}%)
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {item.isActive !== false ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-red-400 font-bold">
                            <X className="w-3 h-3" />
                            Non-Aktif
                          </span>
                        )}
                      </td>
                      {canManage && (
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditItem(item)}
                              className="p-1.5 bg-white/5 hover:bg-white/15 text-white rounded-lg transition cursor-pointer"
                              title="Edit Barang"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                            </button>
                            <button
                              onClick={() => setItemToDelete(item)}
                              className="p-1.5 bg-red-500/10 hover:bg-red-500/25 text-red-400 border border-red-500/20 rounded-lg transition cursor-pointer"
                              title="Hapus Barang"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB 3: PAKET PROMO & BUNDLING --- */}
      {activeTab === 'PACKAGES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPackages.map(pkg => {
            const savings = pkg.originalPrice - pkg.packagePrice;
            const savingsPct = pkg.originalPrice > 0 ? Math.round((savings / pkg.originalPrice) * 100) : 0;

            return (
              <div 
                key={pkg.id}
                className="bg-gradient-to-b from-slate-900/90 to-slate-950 border border-purple-500/30 rounded-3xl p-5 flex flex-col justify-between hover:border-purple-400 transition shadow-xl relative overflow-hidden group"
              >
                {/* Discount Badge */}
                {pkg.discountBadge && (
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-amber-500 to-red-500 text-black text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md">
                    {pkg.discountBadge}
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                      pkg.targetCustomerType === 'KANTOR' 
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                        : pkg.targetCustomerType === 'UMUM'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    }`}>
                      {pkg.targetCustomerType === 'KANTOR' ? '🏢 B2B Korporat' : pkg.targetCustomerType === 'UMUM' ? '🏠 Rumah Residensial' : '🌐 Semua Klien'}
                    </span>
                  </div>

                  <h3 className="text-base font-black text-white group-hover:text-purple-300 transition">
                    {pkg.name}
                  </h3>
                  <p className="text-xs text-white/60 mt-1 mb-4">
                    {pkg.description}
                  </p>

                  {/* Included Items Breakdown */}
                  <div className="space-y-2 py-3 border-y border-white/10 bg-white/5 rounded-2xl p-3">
                    <span className="text-[10px] uppercase font-bold text-white/50 block">Termasuk Dalam Paket:</span>
                    
                    {(pkg.includedServices || (pkg.servicesIncluded ? pkg.servicesIncluded.map(s => ({ categoryName: s.serviceCategoryName, quantity: s.quantity })) : [])).map((s, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs text-white/90">
                        <span className="flex items-center gap-1.5">
                          <Wrench className="w-3 h-3 text-blue-400" />
                          {s.categoryName}
                        </span>
                        <span className="font-mono text-white/60 font-bold">{s.quantity}x</span>
                      </div>
                    ))}

                    {(pkg.includedSpareParts || (pkg.itemsIncluded ? pkg.itemsIncluded.map(p => ({ name: p.itemName, quantity: p.quantity, unit: p.unit })) : [])).map((p, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs text-white/90">
                        <span className="flex items-center gap-1.5">
                          <Boxes className="w-3 h-3 text-amber-400" />
                          {p.name}
                        </span>
                        <span className="font-mono text-white/60 font-bold">{p.quantity} {p.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 mt-4">
                  <div className="flex items-end justify-between mb-3">
                    <div>
                      {pkg.originalPrice > pkg.packagePrice && (
                        <span className="text-xs text-white/40 line-through font-mono block">
                          Rp {pkg.originalPrice.toLocaleString('id-ID')}
                        </span>
                      )}
                      <span className="text-lg font-black text-purple-300 font-mono">
                        Rp {pkg.packagePrice.toLocaleString('id-ID')}
                      </span>
                    </div>

                    {savings > 0 && (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                        Hemat Rp {savings.toLocaleString('id-ID')} ({savingsPct}%)
                      </span>
                    )}
                  </div>

                  {canManage && (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                      <button
                        onClick={() => handleOpenEditPackage(pkg)}
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/15 text-white rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-purple-400" />
                        Edit Paket
                      </button>
                      <button
                        onClick={() => setPackageToDelete(pkg)}
                        className="p-1.5 bg-red-500/10 hover:bg-red-500/25 text-red-400 border border-red-500/20 rounded-lg transition cursor-pointer"
                        title="Hapus Paket"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- TAB 4: SIMULASI MARGIN LABA & KALKULATOR HARGA --- */}
      {activeTab === 'CALCULATOR' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Selector */}
          <div className="lg:col-span-2 space-y-5">
            {/* Pick Services */}
            <div className="p-5 bg-slate-900/70 rounded-3xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-blue-400" />
                  <h3 className="text-sm font-black text-white">1. Pilih Item Jasa Servis</h3>
                </div>
                <span className="text-xs text-white/50">Subtotal Jasa: Rp {simTotalService.toLocaleString('id-ID')}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {serviceCategories.map(cat => {
                  const existing = simSelectedServices.find(s => s.id === cat.id);
                  const qty = existing ? existing.qty : 0;

                  return (
                    <div key={cat.id} className="p-3 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{cat.name}</p>
                        <p className="text-[10px] text-blue-300 font-mono">Rp {cat.basePrice.toLocaleString('id-ID')}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            if (qty <= 1) {
                              setSimSelectedServices(simSelectedServices.filter(s => s.id !== cat.id));
                            } else {
                              setSimSelectedServices(simSelectedServices.map(s => s.id === cat.id ? { ...s, qty: s.qty - 1 } : s));
                            }
                          }}
                          className="w-6 h-6 rounded-lg bg-white/10 text-white font-bold flex items-center justify-center hover:bg-white/20"
                        >
                          -
                        </button>
                        <span className="w-6 text-center font-bold text-xs text-white">{qty}</span>
                        <button
                          type="button"
                          onClick={() => {
                            if (!existing) {
                              setSimSelectedServices([...simSelectedServices, { id: cat.id, qty: 1 }]);
                            } else {
                              setSimSelectedServices(simSelectedServices.map(s => s.id === cat.id ? { ...s, qty: s.qty + 1 } : s));
                            }
                          }}
                          className="w-6 h-6 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center hover:bg-blue-500"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pick Goods / Spareparts */}
            <div className="p-5 bg-slate-900/70 rounded-3xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Boxes className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-black text-white">2. Pilih Material / Suku Cadang Terpakai</h3>
                </div>
                <span className="text-xs text-white/50">Subtotal Part: Rp {simTotalGoods.toLocaleString('id-ID')}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {inventory.map(item => {
                  const existing = simSelectedItems.find(g => g.id === item.id);
                  const qty = existing ? existing.qty : 0;

                  return (
                    <div key={item.id} className="p-3 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{item.name}</p>
                        <p className="text-[10px] text-amber-300 font-mono">
                          Beli: Rp {item.purchasePrice.toLocaleString('id-ID')} | Jual: Rp {item.sellingPrice.toLocaleString('id-ID')}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            if (qty <= 1) {
                              setSimSelectedItems(simSelectedItems.filter(g => g.id !== item.id));
                            } else {
                              setSimSelectedItems(simSelectedItems.map(g => g.id === item.id ? { ...g, qty: g.qty - 1 } : g));
                            }
                          }}
                          className="w-6 h-6 rounded-lg bg-white/10 text-white font-bold flex items-center justify-center hover:bg-white/20"
                        >
                          -
                        </button>
                        <span className="w-6 text-center font-bold text-xs text-white">{qty}</span>
                        <button
                          type="button"
                          onClick={() => {
                            if (!existing) {
                              setSimSelectedItems([...simSelectedItems, { id: item.id, qty: 1 }]);
                            } else {
                              setSimSelectedItems(simSelectedItems.map(g => g.id === item.id ? { ...g, qty: g.qty + 1 } : g));
                            }
                          }}
                          className="w-6 h-6 rounded-lg bg-amber-600 text-white font-bold flex items-center justify-center hover:bg-amber-500"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Profit & Breakdown Calculation Card */}
          <div className="bg-gradient-to-b from-slate-900 to-[#0B0F19] border border-white/10 rounded-3xl p-6 space-y-5 h-fit shadow-2xl">
            <div className="flex items-center gap-2 pb-3 border-b border-white/10">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Hasil Analisa Margin Proyek</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-white/80">
                <span>Total Omzet Jasa:</span>
                <span className="font-mono font-bold text-white">Rp {simTotalService.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-white/80">
                <span>Total Omzet Suku Cadang:</span>
                <span className="font-mono font-bold text-amber-300">Rp {simTotalGoods.toLocaleString('id-ID')}</span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <span className="text-red-400 font-bold">Simulasi Diskon Proyek:</span>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-red-400">Rp</span>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    value={simDiscount}
                    onChange={(e) => setSimDiscount(parseInt(e.target.value) || 0)}
                    className="w-24 bg-white/5 border border-red-500/30 rounded-lg px-2 py-1 text-right font-mono font-bold text-xs text-red-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-2 border-t border-white/10 text-sm font-black text-white">
                <span>Grand Total Omzet Bersih:</span>
                <span className="font-mono text-cyan-300 text-base">
                  Rp {simGrandRevenue.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Cost & Commission Deductions */}
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2 text-xs">
              <p className="text-[10px] font-black uppercase tracking-wider text-white/40">Beban Operasional & HPP</p>
              <div className="flex justify-between text-red-300/80">
                <span>HPP Material (Harga Beli Part):</span>
                <span className="font-mono font-bold">-Rp {simTotalCost.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-amber-300/80">
                <span>Estimasi Komisi Tim Teknisi:</span>
                <span className="font-mono font-bold">-Rp {simTotalTechCommission.toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Net Profit & Margin Score */}
            <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl text-center space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">
                Estimasi Laba Kotor Perusahaan (Gross Margin)
              </span>
              <p className="text-2xl font-black text-emerald-300 font-mono">
                Rp {simGrossProfit.toLocaleString('id-ID')}
              </p>
              <div className="inline-block px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                Profit Margin: {simProfitMarginPercent}%
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setSimSelectedServices([]);
                setSimSelectedItems([]);
                setSimDiscount(0);
              }}
              className="w-full py-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-xl text-xs font-bold transition"
            >
              Reset Kalkulator
            </button>
          </div>
        </div>
      )}

      {/* --- MODAL: TAMBAH / EDIT LAYANAN JASA --- */}
      {showServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-blue-500/30 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-blue-950/30">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Wrench className="w-5 h-5 text-blue-400" />
                {editingService ? 'Edit Layanan Jasa' : 'Tambah Layanan Jasa Baru'}
              </h3>
              <button onClick={() => setShowServiceModal(false)} className="text-white/50 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-black uppercase text-white/50 mb-1">Nama Layanan Jasa</label>
                <input
                  type="text"
                  required
                  value={serviceFormData.name || ''}
                  onChange={(e) => setServiceFormData({ ...serviceFormData, name: e.target.value })}
                  placeholder="Contoh: Cuci AC Inverter 0.5 - 1 PK"
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white font-bold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-white/50 mb-1">Deskripsi & Ruang Lingkup</label>
                <textarea
                  rows={2}
                  value={serviceFormData.description || ''}
                  onChange={(e) => setServiceFormData({ ...serviceFormData, description: e.target.value })}
                  placeholder="Pembersihan evaporator, fan blower, outdoor kondensor, flushing drain..."
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-white/50 mb-1">Tarif Standar (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    required
                    value={serviceFormData.basePrice ?? 0}
                    onChange={(e) => setServiceFormData({ ...serviceFormData, basePrice: parseInt(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-white/50 mb-1">Garansi Pekerjaan (Hari)</label>
                  <input
                    type="number"
                    min="0"
                    value={serviceFormData.warrantyDays ?? 30}
                    onChange={(e) => setServiceFormData({ ...serviceFormData, warrantyDays: parseInt(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-white/50 mb-1">Status Publikasi</label>
                <select
                  value={serviceFormData.isActive ? 'true' : 'false'}
                  onChange={(e) => setServiceFormData({ ...serviceFormData, isActive: e.target.value === 'true' })}
                  className="w-full p-2.5 bg-slate-900 border border-white/10 rounded-xl text-white font-bold focus:outline-none"
                >
                  <option value="true">Aktif (Tersedia)</option>
                  <option value="false">Non-Aktif (Diarsipkan)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowServiceModal(false)}
                  className="px-4 py-2 bg-white/10 text-white rounded-xl font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black uppercase tracking-wider shadow-lg shadow-blue-600/30"
                >
                  Simpan Layanan Jasa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: TAMBAH / EDIT BARANG / SPAREPART --- */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-amber-500/30 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-amber-950/30">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Boxes className="w-5 h-5 text-amber-400" />
                {editingItem ? 'Edit Produk Barang & Part' : 'Tambah Produk Barang Baru'}
              </h3>
              <button onClick={() => setShowItemModal(false)} className="text-white/50 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-white/50 mb-1">Kode Part / SKU</label>
                  <input
                    type="text"
                    required
                    value={itemFormData.code || ''}
                    onChange={(e) => setItemFormData({ ...itemFormData, code: e.target.value })}
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-amber-400 font-mono font-bold focus:outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] font-black uppercase text-white/50 mb-1">Nama Barang / Material</label>
                  <input
                    type="text"
                    required
                    value={itemFormData.name || ''}
                    onChange={(e) => setItemFormData({ ...itemFormData, name: e.target.value })}
                    placeholder="Kapasitor Daikin 25uF / Pipa Tembaga..."
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-white/50 mb-1">Kategori Barang</label>
                  <select
                    value={itemFormData.category || 'SPAREPART'}
                    onChange={(e) => setItemFormData({ ...itemFormData, category: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-900 border border-white/10 rounded-xl text-white font-bold focus:outline-none"
                  >
                    <option value="SPAREPART">Sparepart (Komponen)</option>
                    <option value="MATERIAL">Material & Pipa AC</option>
                    <option value="FREON">Freon Refrigerant</option>
                    <option value="UNIT_BARU">Unit AC Baru</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-white/50 mb-1">Satuan Ukuran</label>
                  <input
                    type="text"
                    value={itemFormData.unit || 'pcs'}
                    onChange={(e) => setItemFormData({ ...itemFormData, unit: e.target.value })}
                    placeholder="pcs, meter, kg, roll, tabung..."
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-white/50 mb-1">Harga Beli / Modal (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    required
                    value={itemFormData.purchasePrice ?? 0}
                    onChange={(e) => setItemFormData({ ...itemFormData, purchasePrice: parseInt(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white font-mono font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-white/50 mb-1">Harga Jual Konsumen (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    required
                    value={itemFormData.sellingPrice ?? 0}
                    onChange={(e) => setItemFormData({ ...itemFormData, sellingPrice: parseInt(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-amber-400 font-mono font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-white/50 mb-1">Stok Awal Saat Ini</label>
                  <input
                    type="number"
                    min="0"
                    value={itemFormData.stock ?? 0}
                    onChange={(e) => setItemFormData({ ...itemFormData, stock: parseInt(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white font-mono font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-white/50 mb-1">Batas Minimum Peringatan (Alert)</label>
                  <input
                    type="number"
                    min="0"
                    value={itemFormData.minStockThreshold ?? 3}
                    onChange={(e) => setItemFormData({ ...itemFormData, minStockThreshold: parseInt(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-red-400 font-mono font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="px-4 py-2 bg-white/10 text-white rounded-xl font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-black uppercase tracking-wider shadow-lg shadow-amber-600/30"
                >
                  Simpan Produk Barang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: TAMBAH / EDIT PAKET PROMO & BUNDLING --- */}
      {showPackageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-purple-500/30 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-purple-950/30">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                {editingPackage ? 'Edit Paket Promo' : 'Buat Paket Promo & Bundling Baru'}
              </h3>
              <button onClick={() => setShowPackageModal(false)} className="text-white/50 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePackage} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-black uppercase text-white/50 mb-1">Nama Paket Promo</label>
                <input
                  type="text"
                  required
                  value={packageFormData.name || ''}
                  onChange={(e) => setPackageFormData({ ...packageFormData, name: e.target.value })}
                  placeholder="Paket Cuci Bersih + Tambah Freon R32..."
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-white/50 mb-1">Deskripsi Keuntungan Paket</label>
                <textarea
                  rows={2}
                  value={packageFormData.description || ''}
                  onChange={(e) => setPackageFormData({ ...packageFormData, description: e.target.value })}
                  placeholder="Solusi lengkap AC dingin maksimal & wangi segar tahan lama..."
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-white/50 mb-1">Target Segmen Pelanggan</label>
                  <select
                    value={packageFormData.targetCustomerType || 'SEMUA'}
                    onChange={(e) => setPackageFormData({ ...packageFormData, targetCustomerType: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-900 border border-white/10 rounded-xl text-white font-bold focus:outline-none"
                  >
                    <option value="SEMUA">Semua Klien (Umum & Kantor)</option>
                    <option value="UMUM">Khusus Rumah Residensial</option>
                    <option value="KANTOR">Khusus Perusahaan / Kantor B2B</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-white/50 mb-1">Badge Tag Promosi</label>
                  <input
                    type="text"
                    value={packageFormData.discountBadge || ''}
                    onChange={(e) => setPackageFormData({ ...packageFormData, discountBadge: e.target.value })}
                    placeholder="Contoh: BEST SELLER / Hemat 20%"
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-amber-400 font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-white/50 mb-1">Harga Normal Asli (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    value={packageFormData.originalPrice ?? 0}
                    onChange={(e) => setPackageFormData({ ...packageFormData, originalPrice: parseInt(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white/70 line-through font-mono font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-white/50 mb-1">Harga Paket Promo (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    required
                    value={packageFormData.packagePrice ?? 0}
                    onChange={(e) => setPackageFormData({ ...packageFormData, packagePrice: parseInt(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-white/5 border border-purple-500/50 rounded-xl text-purple-300 font-mono font-black text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowPackageModal(false)}
                  className="px-4 py-2 bg-white/10 text-white rounded-xl font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-black uppercase tracking-wider shadow-lg shadow-purple-600/30"
                >
                  Simpan Paket Promo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Service Confirmation Modal */}
      {serviceToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#141414] rounded-3xl p-6 max-w-md w-full border border-red-500/30 shadow-2xl space-y-4 text-white">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="font-black text-base text-white">Hapus Layanan Jasa?</h3>
                <p className="text-xs text-white/50">Tindakan ini permanen di cloud database.</p>
              </div>
            </div>

            <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-1 text-xs">
              <p className="text-white/50 text-[10px] font-black uppercase">Layanan yang akan dihapus:</p>
              <p className="font-bold text-white text-sm">{serviceToDelete.name}</p>
              <p className="text-blue-400 font-mono font-bold">Rp {serviceToDelete.basePrice.toLocaleString('id-ID')}</p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setServiceToDelete(null)}
                className="flex-1 py-2.5 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteServiceCategory(serviceToDelete.id);
                  setServiceToDelete(null);
                }}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-wider rounded-xl text-xs transition cursor-pointer shadow-lg shadow-red-600/30"
              >
                Ya, Hapus Layanan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Item Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#141414] rounded-3xl p-6 max-w-md w-full border border-red-500/30 shadow-2xl space-y-4 text-white">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="font-black text-base text-white">Hapus Produk / Suku Cadang?</h3>
                <p className="text-xs text-white/50">Tindakan ini akan menghapus data barang dari gudang cloud.</p>
              </div>
            </div>

            <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-1 text-xs">
              <p className="text-white/50 text-[10px] font-black uppercase">Barang yang akan dihapus:</p>
              <p className="font-mono text-amber-400 text-xs font-bold">{itemToDelete.code}</p>
              <p className="font-bold text-white text-sm">{itemToDelete.name}</p>
              <p className="text-white/60">Stok saat ini: <span className="text-white font-bold">{itemToDelete.stock} {itemToDelete.unit}</span></p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="flex-1 py-2.5 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteInventoryItem(itemToDelete.id);
                  setItemToDelete(null);
                }}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-wider rounded-xl text-xs transition cursor-pointer shadow-lg shadow-red-600/30"
              >
                Ya, Hapus Barang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Package Confirmation Modal */}
      {packageToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#141414] rounded-3xl p-6 max-w-md w-full border border-red-500/30 shadow-2xl space-y-4 text-white">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="font-black text-base text-white">Hapus Paket Promo?</h3>
                <p className="text-xs text-white/50">Tindakan ini akan menghapus bundling paket dari katalog.</p>
              </div>
            </div>

            <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-1 text-xs">
              <p className="text-white/50 text-[10px] font-black uppercase">Paket yang akan dihapus:</p>
              <p className="font-bold text-white text-sm">{packageToDelete.name}</p>
              <p className="text-purple-300 font-mono font-bold">Rp {packageToDelete.packagePrice.toLocaleString('id-ID')}</p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPackageToDelete(null)}
                className="flex-1 py-2.5 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteProductPackage(packageToDelete.id);
                  setPackageToDelete(null);
                }}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-wider rounded-xl text-xs transition cursor-pointer shadow-lg shadow-red-600/30"
              >
                Ya, Hapus Paket
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
