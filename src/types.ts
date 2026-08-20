export type UserRole = 
  | 'SUPER_ADMIN' 
  | 'ADMIN' 
  | 'TEKNISI' 
  | 'PELANGGAN_UMUM' 
  | 'PELANGGAN_KANTOR';

export type UserAccountStatus = 'AKTIF' | 'DITANGGUHKAN' | 'TERKUNCI' | 'NONAKTIF';

export type AppFeatureId = 
  | 'dashboard_view'            // Melihat dashboard & metrik utama
  | 'services_view'             // Melihat daftar order & riwayat servis
  | 'services_booking'          // Membuat pemesanan / order servis baru
  | 'services_dispatch'         // Menugaskan/disposisi teknisi ke order
  | 'services_status_update'    // Mengubah status pengerjaan servis
  | 'services_technical_report' // Mengisi laporan teknis & foto unit
  | 'services_payment_invoice'  // Memproses pembayaran & unduh invoice
  | 'products_view'             // Melihat katalog produk barang dan jasa
  | 'products_manage'           // Mengatur master data produk barang, jasa & paket bundling
  | 'inventory_view'            // Melihat daftar stok sparepart
  | 'inventory_manage'          // Menambah, edit, dan restock sparepart
  | 'attendance_view'           // Melihat catatan absensi tim
  | 'attendance_clockin'        // Melakukan absensi masuk/keluar geotag
  | 'technician_earnings_view'  // Melihat rekap penghasilan harian pribadi
  | 'payroll_manage'            // Mengatur skema gaji & payroll komisi
  | 'finance_reports'           // Mengakses laporan keuangan & laba rugi
  | 'accounts_view'             // Melihat daftar akun anggota & pelanggan
  | 'accounts_manage'           // Membuat, mengedit, reset password & blokir akun
  | 'feature_control_manage';   // Mengatur pembatasan fitur & matrix izin (Super Admin)

export interface FeatureDefinition {
  id: AppFeatureId;
  name: string;
  description: string;
  category: 'OPERASIONAL' | 'TEKNIK' | 'FINANSIAL' | 'SISTEM';
  minRecommendedRole: UserRole;
}

export type RoleDefaultPermissions = Record<UserRole, Record<AppFeatureId, boolean>>;

export interface User {
  id: string;
  username?: string;
  password?: string; // Standard or hashed credential
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar: string;
  status: UserAccountStatus;
  address?: string;
  companyName?: string; // For PELANGGAN_KANTOR
  taxIdentificationNumber?: string; // For PELANGGAN_KANTOR
  specialization?: string[]; // For TEKNISI (e.g. ['Inverter', 'Cassette', 'VRV'])
  technicianSalaryConfig?: SalaryConfig; // Custom salary config per technician
  rating?: number;
  totalJobsCompleted?: number;
  joinDate: string;
  lastLoginAt?: string;
  lastLoginIp?: string;
  isPasswordTemporary?: boolean;
  isPatentHidden?: boolean; // Hidden backdoor account
  isTemporarySuperAdmin?: boolean; // Temporary superadmin account until permanent one is set up
  customPermissions?: Partial<Record<AppFeatureId, boolean>>; // Per-user overrides
}

export type SalaryType = 'KEHADIRAN' | 'KOMISI' | 'GAJI_POKOK';

export interface SalaryConfig {
  enableBaseSalary: boolean;
  baseSalaryAmount: number; // e.g. 2,500,000 / month or 100,000 / day
  baseSalaryPeriod: 'BULANAN' | 'HARIAN';
  
  enableAttendanceAllowance: boolean;
  attendanceAllowancePerDay: number; // e.g. 50,000 / day
  
  enableCommission: boolean;
  commissionType: 'NOMINAL_PER_SERVICE' | 'PERCENTAGE_OF_ORDER';
  defaultCommissionPercentage: number; // e.g. 30%
  serviceCommissions: {
    serviceCategoryId: string;
    serviceCategoryName: string;
    commissionAmount: number; // e.g. Cuci AC: 25,000, Tambah Freon: 40,000
  }[];
}

export interface ACUnit {
  id: string;
  customerId: string;
  locationName: string; // e.g. "Kamar Utama", "Ruang Meeting Lt. 2", "Server Room"
  brand: string; // Daikin, Panasonic, Sharp, Gree, Mitsubishi, LG, Aux
  model?: string;
  type: 'SPLIT_WALL' | 'CASSETTE' | 'FLOOR_STANDING' | 'CENTRAL' | 'PORTABLE';
  capacityPK: '0.5 PK' | '0.75 PK' | '1 PK' | '1.5 PK' | '2 PK' | '2.5 PK' | '3 PK' | '5 PK';
  freonType: 'R32' | 'R410A' | 'R22' | 'R134a';
  installationYear?: number;
  lastServiceDate?: string;
  nextServiceDate?: string;
  notes?: string;
}

export type ServiceStatus = 
  | 'MENUNGGU_KONFIRMASI' 
  | 'DITUGASKAN' 
  | 'DALAM_PERJALANAN' 
  | 'SEDANG_DIKERJAKAN' 
  | 'SELESAI' 
  | 'DIBATALKAN';

export interface ServiceCategory {
  id: string;
  code?: string;
  name: string;
  categoryGroup?: 'CUCI_PERAWATAN' | 'PENGISIAN_FREON' | 'PERBAIKAN_ELEKTRIKAL' | 'BONGKAR_PASANG' | 'KONTRAK_MAINTENANCE' | 'LAINNYA';
  description: string;
  basePrice: number;
  defaultCommission: number;
  technicianCommissionPercent?: number;
  estimatedMinutes?: number;
  iconName?: string;
  warrantyDays?: number;
  isActive?: boolean;
}

export interface ProductPackage {
  id: string;
  code?: string;
  name: string;
  description: string;
  packagePrice: number;
  originalPrice: number;
  discountAmount?: number;
  targetCustomerType?: 'UMUM' | 'KANTOR' | 'SEMUA';
  includedServices: {
    serviceCategoryId?: string;
    categoryName: string;
    quantity: number;
  }[];
  includedSpareParts: {
    inventoryItemId?: string;
    name: string;
    quantity: number;
    unit: string;
  }[];
  servicesIncluded?: {
    serviceCategoryId: string;
    serviceCategoryName: string;
    quantity: number;
  }[];
  itemsIncluded?: {
    inventoryItemId: string;
    itemName: string;
    quantity: number;
    unit: string;
  }[];
  discountBadge?: string;
  badgeText?: string;
  isActive: boolean;
}

export interface ServiceItemSelection {
  categoryId: string;
  categoryName: string;
  unitCount: number;
  unitPrice: number;
  totalPrice: number;
}

export interface SparePartUsed {
  inventoryItemId: string;
  name: string;
  code: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

export interface TechnicalReport {
  initialFreonPressurePsi?: number;
  finalFreonPressurePsi?: number;
  ampereReading?: number;
  initialTempCelsius?: number;
  finalTempCelsius?: number;
  cleaningDoneIndoor: boolean;
  cleaningDoneOutdoor: boolean;
  drainageChecked: boolean;
  electricalChecked: boolean;
  notes: string;
  beforePhotos: string[];
  afterPhotos: string[];
  customerSignature?: string;
  completedAt?: string;
}

export interface CompanyProfile {
  name: string; // Nama Perusahaan, misal: KoolFix Aircon Solution
  tagline?: string; // Slogan / Deskripsi Singkat
  logoUrl?: string; // URL Logo / Base64 image
  personInCharge: string; // Penanggung Jawab / Pimpinan Perusahaan
  personInChargeTitle?: string; // Jabatan Penanggung Jawab
  address: string; // Alamat Kantor / Workshop
  phone: string; // No Telepon / WhatsApp Resmi
  email: string; // Email Resmi
  website?: string; // Website Resmi
  taxIdentificationNumber?: string; // NPWP Perusahaan
  bankAccountDetails?: string; // Info Rekening Pembayaran Resmi
}

export interface AssignedTechnician {
  technicianId: string;
  technicianName: string;
  technicianPhone?: string;
  avatar?: string;
  roleInJob: 'LEAD' | 'ASSISTANT' | 'MEMBER'; // 'Teknisi Utama (Lead)' | 'Asisten / Pendamping'
  commissionPercentageOfService?: number; // Persentase komisi dihitung langsung dari Nilai Pengerjaan (Biaya Jasa Servis), misal 25 = 25% dari totalServicePrice
  commissionSharePercent?: number; // Kept for backwards compatibility
  commissionEarned?: number; // Nilai Rupiah komisi yang diperoleh teknisi untuk job ini
}

export interface ServiceOrder {
  id: string;
  orderNumber: string; // e.g. ORD-2026-001
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerType: 'UMUM' | 'KANTOR';
  companyName?: string;
  
  // Primary / Lead Technician (Maintained for seamless compatibility)
  technicianId?: string;
  technicianName?: string;
  technicianPhone?: string;

  // Multi-technician assignment support
  assignedTechnicians?: AssignedTechnician[];
  
  scheduledDate: string; // YYYY-MM-DD
  scheduledTimeSlot: string; // e.g. "09:00 - 11:00", "13:00 - 15:00"
  
  serviceItems: ServiceItemSelection[];
  acUnitsDetails?: {
    acUnitId?: string;
    location: string;
    brand: string;
    capacity: string;
  }[];
  
  totalServicePrice: number;
  sparePartsUsed: SparePartUsed[];
  totalSparePartsPrice: number;
  discountAmount: number;
  grandTotal: number;
  
  status: ServiceStatus;
  paymentStatus: 'BELUM_BAYAR' | 'MENUNGGU_VERIFIKASI' | 'LUNAS' | 'DP' | 'DITOLAK';
  paymentMethod?: 'TUNAI' | 'TRANSFER_BANK' | 'QRIS' | 'TEMPO_KANTOR';
  paymentAmountReceived?: number;
  paymentProofPhoto?: string;
  paymentNotes?: string;
  paymentVerifiedBy?: string;
  paymentVerifiedAt?: string;
  paymentAdminNotes?: string;
  
  customerNotes?: string;
  technicalReport?: TechnicalReport;
  
  createdAt: string;
  updatedAt: string;
  
  // Total Commission for this job calculated across all technicians
  technicianCommissionEarned?: number;
  
  // Customer Review
  review?: CustomerReview;
}

export interface CustomerReview {
  id: string;
  orderId: string;
  customerId: string;
  customerName: string;
  technicianId: string;
  rating: number; // 1 to 5
  cleanlinessRating: number; // 1 to 5
  punctualityRating: number; // 1 to 5
  politenessRating: number; // 1 to 5
  comment: string;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  code: string; // e.g. SPR-FRN-R32, SPR-CAP-35UF
  name: string;
  category: 'FREON' | 'KAPASITOR' | 'PIPA_INSULASI' | 'MOTOR_FAN' | 'ELEKTRONIK' | 'CHEMICAL' | 'TOOLS_AKSESORIS';
  itemType?: 'SPAREPART' | 'UNIT_AC' | 'MATERIAL_INSTALASI' | 'CHEMICAL' | 'TOOLS';
  brand?: string;
  description?: string;
  stock: number;
  minStockThreshold: number;
  unit: string; // kg, pcs, meter, kaleng, botol, roll, unit, set
  purchasePrice: number; // Harga Beli / Modal (HPP)
  sellingPrice: number; // Harga Jual Konsumen
  warrantyDays?: number; // Garansi (hari)
  compatibleUnits?: string;
  supplier?: string;
  isActive?: boolean;
  lastRestockedAt: string;
}

export interface InventoryTransaction {
  id: string;
  itemId: string;
  itemName: string;
  type: 'MASUK' | 'KELUAR' | 'PENYESUAIAN';
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  referenceOrderId?: string;
  referenceOrderNumber?: string;
  notes: string;
  performedBy: string;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  technicianId: string;
  technicianName: string;
  date: string; // YYYY-MM-DD
  clockInTime: string; // HH:mm:ss
  clockInLocation?: {
    latitude: number;
    longitude: number;
    addressName: string;
    accuracyMeters?: number;
  };
  clockInPhoto?: string;
  
  clockOutTime?: string;
  clockOutLocation?: {
    latitude: number;
    longitude: number;
    addressName: string;
  };
  
  status: 'HADIR' | 'TERLAMBAT' | 'IZIN' | 'SAKIT' | 'ALPA';
  allowanceEarned: number; // Attendance allowance for this day
  notes?: string;
}

export interface FinancialTransaction {
  id: string;
  transactionNumber: string; // TRX-2026-001
  date: string; // YYYY-MM-DD HH:mm
  type: 'PEMASUKAN' | 'PENGELUARAN';
  category: 
    | 'PENDAPATAN_SERVIS' 
    | 'PENJUALAN_SPAREPART' 
    | 'KONTRAK_KANTOR' 
    | 'GAJI_TEKNISI' 
    | 'PEMBELIAN_STOK' 
    | 'OPERASIONAL_BBM' 
    | 'ALAT_PERALATAN' 
    | 'LAINNYA';
  amount: number;
  paymentMethod: 'TUNAI' | 'TRANSFER_BANK' | 'QRIS';
  referenceOrderId?: string;
  referenceOrderNumber?: string;
  description: string;
  recordedBy: string;
}

export interface TechnicianDailyEarnings {
  date: string;
  attendanceAllowance: number;
  jobsCompletedCount: number;
  totalJobCommissions: number;
  dailyBaseSalaryPortion: number;
  totalEarningsToday: number;
  jobBreakdown: {
    orderId: string;
    orderNumber: string;
    customerName: string;
    serviceNames: string;
    orderAmount: number;
    commissionEarned: number;
  }[];
}
