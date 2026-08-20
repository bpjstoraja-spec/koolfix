import { 
  User, 
  ServiceCategory, 
  InventoryItem, 
  ACUnit, 
  ServiceOrder, 
  AttendanceRecord, 
  FinancialTransaction,
  SalaryConfig,
  FeatureDefinition,
  RoleDefaultPermissions,
  AppFeatureId,
  CompanyProfile,
  ProductPackage
} from '../types';

export const systemFeatureDefinitions: FeatureDefinition[] = [
  {
    id: 'dashboard_view',
    name: 'Dashboard & Analitik',
    description: 'Melihat ringkasan metrik performa, status order terkini, dan shortcut operasional.',
    category: 'OPERASIONAL',
    minRecommendedRole: 'PELANGGAN_UMUM'
  },
  {
    id: 'services_view',
    name: 'Daftar & Riwayat Servis',
    description: 'Melihat tabel daftar order servis, jadwal kunjungan, dan riwayat pekerjaan.',
    category: 'OPERASIONAL',
    minRecommendedRole: 'PELANGGAN_UMUM'
  },
  {
    id: 'services_booking',
    name: 'Pemesanan / Booking Servis',
    description: 'Membuat permintaan order servis baru untuk unit AC residensial maupun kantor.',
    category: 'OPERASIONAL',
    minRecommendedRole: 'PELANGGAN_UMUM'
  },
  {
    id: 'services_dispatch',
    name: 'Disposisi & Penugasan Teknisi',
    description: 'Menetapkan teknisi, memilih slot waktu, dan mengalihkan job ke teknisi lapangan.',
    category: 'OPERASIONAL',
    minRecommendedRole: 'ADMIN'
  },
  {
    id: 'services_status_update',
    name: 'Update Status Servis',
    description: 'Mengubah status pengerjaan (Dalam Perjalanan, Sedang Dikerjakan, Selesai).',
    category: 'TEKNIK',
    minRecommendedRole: 'TEKNISI'
  },
  {
    id: 'services_technical_report',
    name: 'Laporan Teknis & Foto Servis',
    description: 'Mengisi form checklist teknis (tekanan freon, ampere, suhu) dan upload foto sebelum/sesudah.',
    category: 'TEKNIK',
    minRecommendedRole: 'TEKNISI'
  },
  {
    id: 'services_payment_invoice',
    name: 'Kwitansi & Pembayaran Servis',
    description: 'Memvalidasi pembayaran, metode transfer/QRIS/tunai, dan cetak invoice digital.',
    category: 'FINANSIAL',
    minRecommendedRole: 'ADMIN'
  },
  {
    id: 'products_view',
    name: 'Lihat Katalog Produk & Jasa',
    description: 'Melihat daftar master katalog layanan servis AC, harga standar, dan produk barang/suku cadang.',
    category: 'OPERASIONAL',
    minRecommendedRole: 'PELANGGAN_UMUM'
  },
  {
    id: 'products_manage',
    name: 'Kelola Master Produk Barang & Jasa',
    description: 'Menambah, mengedit tarif jasa servis, harga jual sparepart, komisi standar teknisi, dan paket bundling.',
    category: 'OPERASIONAL',
    minRecommendedRole: 'ADMIN'
  },
  {
    id: 'inventory_view',
    name: 'Lihat Stok Inventaris',
    description: 'Melihat ketersediaan freon, kapasitor, pipa, dan sparepart AC lainnya.',
    category: 'OPERASIONAL',
    minRecommendedRole: 'TEKNISI'
  },
  {
    id: 'inventory_manage',
    name: 'Kelola & Restock Inventaris',
    description: 'Menambah item baru, update harga jual/modal, dan mencatat transaksi restock barang.',
    category: 'OPERASIONAL',
    minRecommendedRole: 'ADMIN'
  },
  {
    id: 'attendance_view',
    name: 'Rekap Absensi Tim',
    description: 'Melihat log kehadiran GPS geotag, foto selfie masuk, dan status absensi teknisi.',
    category: 'OPERASIONAL',
    minRecommendedRole: 'ADMIN'
  },
  {
    id: 'attendance_clockin',
    name: 'Presensi / Absensi GPS',
    description: 'Melakukan clock-in dan clock-out dengan validasi koordinat GPS dan selfie kamera.',
    category: 'OPERASIONAL',
    minRecommendedRole: 'TEKNISI'
  },
  {
    id: 'technician_earnings_view',
    name: 'Rincian Pendapatan Teknisi',
    description: 'Melihat transparansi komisi harian, uang kehadiran, dan estimasi take-home pay pribadi.',
    category: 'FINANSIAL',
    minRecommendedRole: 'TEKNISI'
  },
  {
    id: 'payroll_manage',
    name: 'Manajemen Gaji & Komisi (Payroll)',
    description: 'Mengatur skema komisi per layanan, gaji pokok, uang hadir, dan rekap payroll perusahaan.',
    category: 'FINANSIAL',
    minRecommendedRole: 'SUPER_ADMIN'
  },
  {
    id: 'finance_reports',
    name: 'Laporan Arus Kas & Laba Rugi',
    description: 'Akses laporan keuangan komprehensif, pencatatan beban operasional, dan grafik profitabilitas.',
    category: 'FINANSIAL',
    minRecommendedRole: 'SUPER_ADMIN'
  },
  {
    id: 'accounts_view',
    name: 'Lihat Direktori Pengguna',
    description: 'Melihat daftar seluruh pengguna, teknisi, admin, dan pelanggan terdaftar.',
    category: 'SISTEM',
    minRecommendedRole: 'ADMIN'
  },
  {
    id: 'accounts_manage',
    name: 'Kelola Akun, Password & Status',
    description: 'Membuat akun baru, mengubah data profil, mereset password, dan menonaktifkan akun.',
    category: 'SISTEM',
    minRecommendedRole: 'SUPER_ADMIN'
  },
  {
    id: 'feature_control_manage',
    name: 'Kontrol Pembatasan Fitur Global',
    description: 'Mengatur matrix izin hak akses semua fitur per role dan perorangan untuk seluruh sistem.',
    category: 'SISTEM',
    minRecommendedRole: 'SUPER_ADMIN'
  }
];

export const defaultRolePermissions: RoleDefaultPermissions = {
  SUPER_ADMIN: {
    dashboard_view: true,
    services_view: true,
    services_booking: true,
    services_dispatch: true,
    services_status_update: true,
    services_technical_report: true,
    services_payment_invoice: true,
    products_view: true,
    products_manage: true,
    inventory_view: true,
    inventory_manage: true,
    attendance_view: true,
    attendance_clockin: true,
    technician_earnings_view: true,
    payroll_manage: true,
    finance_reports: true,
    accounts_view: true,
    accounts_manage: true,
    feature_control_manage: true,
  },
  ADMIN: {
    dashboard_view: true,
    services_view: true,
    services_booking: true,
    services_dispatch: true,
    services_status_update: true,
    services_technical_report: true,
    services_payment_invoice: true,
    products_view: true,
    products_manage: true,
    inventory_view: true,
    inventory_manage: true,
    attendance_view: true,
    attendance_clockin: false,
    technician_earnings_view: false,
    payroll_manage: false, // dibatasi dari Super Admin secara default
    finance_reports: false, // dibatasi dari Super Admin secara default
    accounts_view: true,
    accounts_manage: false, // dibatasi dari Super Admin
    feature_control_manage: false,
  },
  TEKNISI: {
    dashboard_view: true,
    services_view: true,
    services_booking: false,
    services_dispatch: false,
    services_status_update: true,
    services_technical_report: true,
    services_payment_invoice: false,
    products_view: true,
    products_manage: false,
    inventory_view: true,
    inventory_manage: false,
    attendance_view: false,
    attendance_clockin: true,
    technician_earnings_view: true,
    payroll_manage: false,
    finance_reports: false,
    accounts_view: false,
    accounts_manage: false,
    feature_control_manage: false,
  },
  PELANGGAN_KANTOR: {
    dashboard_view: true,
    services_view: true,
    services_booking: true,
    services_dispatch: false,
    services_status_update: false,
    services_technical_report: false,
    services_payment_invoice: true,
    products_view: true,
    products_manage: false,
    inventory_view: false,
    inventory_manage: false,
    attendance_view: false,
    attendance_clockin: false,
    technician_earnings_view: false,
    payroll_manage: false,
    finance_reports: false,
    accounts_view: false,
    accounts_manage: false,
    feature_control_manage: false,
  },
  PELANGGAN_UMUM: {
    dashboard_view: true,
    services_view: true,
    services_booking: true,
    services_dispatch: false,
    services_status_update: false,
    services_technical_report: false,
    services_payment_invoice: true,
    products_view: true,
    products_manage: false,
    inventory_view: false,
    inventory_manage: false,
    attendance_view: false,
    attendance_clockin: false,
    technician_earnings_view: false,
    payroll_manage: false,
    finance_reports: false,
    accounts_view: false,
    accounts_manage: false,
    feature_control_manage: false,
  },
};

export const initialSalaryConfig: SalaryConfig = {
  enableBaseSalary: true,
  baseSalaryAmount: 2500000, // Rp 2.500.000 / bulan (~Rp 100.000 / hari kerja)
  baseSalaryPeriod: 'BULANAN',
  enableAttendanceAllowance: true,
  attendanceAllowancePerDay: 50000, // Rp 50.000 / hari hadir
  enableCommission: true,
  commissionType: 'NOMINAL_PER_SERVICE',
  defaultCommissionPercentage: 35,
  serviceCommissions: [
    { serviceCategoryId: 'srv-1', serviceCategoryName: 'Cuci AC Split (0.5 - 1 PK)', commissionAmount: 25000 },
    { serviceCategoryId: 'srv-2', serviceCategoryName: 'Cuci AC Split (1.5 - 2 PK)', commissionAmount: 30000 },
    { serviceCategoryId: 'srv-3', serviceCategoryName: 'Cuci AC Cassette / Ceiling', commissionAmount: 60000 },
    { serviceCategoryId: 'srv-4', serviceCategoryName: 'Tambah Freon R32 / R410A', commissionAmount: 40000 },
    { serviceCategoryId: 'srv-5', serviceCategoryName: 'Isi Penuh Freon Total', commissionAmount: 75000 },
    { serviceCategoryId: 'srv-6', serviceCategoryName: 'Perbaikan Bocor Air / Drainase', commissionAmount: 30000 },
    { serviceCategoryId: 'srv-7', serviceCategoryName: 'Ganti Kapasitor Kompresor', commissionAmount: 45000 },
    { serviceCategoryId: 'srv-8', serviceCategoryName: 'Ganti Motor Fan Indoor/Outdoor', commissionAmount: 50000 },
    { serviceCategoryId: 'srv-9', serviceCategoryName: 'Bongkar Pasang AC Split', commissionAmount: 120000 },
    { serviceCategoryId: 'srv-10', serviceCategoryName: 'Maintenance Kontrak Kantor (4-8 Unit)', commissionAmount: 160000 },
  ],
};

export const serviceCategories: ServiceCategory[] = [
  {
    id: 'srv-1',
    name: 'Cuci AC Split (0.5 - 1 PK)',
    description: 'Pembersihan evaporator indoor, filter udara, talang air & kondensor outdoor dengan water jet bertekanan.',
    basePrice: 75000,
    defaultCommission: 25000,
    estimatedMinutes: 45,
    iconName: 'Wind',
  },
  {
    id: 'srv-2',
    name: 'Cuci AC Split (1.5 - 2 PK)',
    description: 'Pembersihan menyeluruh unit kapasitas besar, pengecekan ampere & suhu hembusan dingin.',
    basePrice: 90000,
    defaultCommission: 30000,
    estimatedMinutes: 60,
    iconName: 'Fan',
  },
  {
    id: 'srv-3',
    name: 'Cuci AC Cassette / Ceiling',
    description: 'Servis AC Cassette gedung/kantor termasuk pembersihan panel, kisi-kisi, drain pump dan condensor.',
    basePrice: 180000,
    defaultCommission: 60000,
    estimatedMinutes: 90,
    iconName: 'Grid',
  },
  {
    id: 'srv-4',
    name: 'Tambah Freon R32 / R410A',
    description: 'Penambahan tekanan freon ramah lingkungan sesuai standar pabrikan (130 - 150 PSI).',
    basePrice: 150000,
    defaultCommission: 40000,
    estimatedMinutes: 30,
    iconName: 'Gauge',
  },
  {
    id: 'srv-5',
    name: 'Isi Penuh Freon Total',
    description: 'Pengisian ulang freon dari 0 psi setelah perbaikan kebocoran sistem sirkulasi pendingin.',
    basePrice: 275000,
    defaultCommission: 75000,
    estimatedMinutes: 60,
    iconName: 'Flame',
  },
  {
    id: 'srv-6',
    name: 'Perbaikan Bocor Air / Drainase',
    description: 'Flushing jalur pipa pembuangan tersumbat, ganti selang fleksibel & perbaikan kemiringan talang.',
    basePrice: 85000,
    defaultCommission: 30000,
    estimatedMinutes: 45,
    iconName: 'Droplets',
  },
  {
    id: 'srv-7',
    name: 'Ganti Kapasitor Kompresor',
    description: 'Penggantian kapasitor starter outdoor yang melemah atau mati total (AC hanya hembus angin).',
    basePrice: 175000,
    defaultCommission: 45000,
    estimatedMinutes: 40,
    iconName: 'Zap',
  },
  {
    id: 'srv-8',
    name: 'Ganti Motor Fan Indoor/Outdoor',
    description: 'Penggantian dinamo kipas fan yang macet, berisik atau terbakar.',
    basePrice: 240000,
    defaultCommission: 50000,
    estimatedMinutes: 60,
    iconName: 'RotateCw',
  },
  {
    id: 'srv-9',
    name: 'Bongkar Pasang AC Split',
    description: 'Relokasi unit AC dari lokasi lama ke titik baru lengkap dengan vacuuming dan instalasi.',
    basePrice: 350000,
    defaultCommission: 120000,
    estimatedMinutes: 120,
    iconName: 'Wrench',
  },
  {
    id: 'srv-10',
    name: 'Maintenance Kontrak Kantor (4-8 Unit)',
    description: 'Paket perawatan preventif komprehensif untuk perkantoran, ruko, atau instansi berkala.',
    basePrice: 550000,
    defaultCommission: 160000,
    estimatedMinutes: 180,
    iconName: 'Building2',
  },
];

export const mockUsers: User[] = [
  {
    id: 'usr-superadmin',
    username: 'superadmin',
    password: 'Adrian721+',
    name: 'Super Administrator',
    email: 'superadmin@koolfix.com',
    phone: '081288991122',
    role: 'SUPER_ADMIN',
    status: 'AKTIF',
    isPatentHidden: true,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    address: 'HQ KoolFix, Jl. Raya Casablanca No. 88, Jakarta Selatan',
    joinDate: '2026-01-01',
    lastLoginAt: '2026-08-19 12:00',
    lastLoginIp: '180.252.164.20 (Aktif)',
  },
  {
    id: 'usr-superadmin-temp',
    username: 'superadmintemp',
    password: 'password123',
    name: 'Super Admin (Sementara)',
    email: 'superadmin.temp@koolfix.com',
    phone: '081288991100',
    role: 'SUPER_ADMIN',
    status: 'AKTIF',
    isTemporarySuperAdmin: true,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    address: 'HQ KoolFix, Jl. Raya Casablanca No. 88, Jakarta Selatan',
    joinDate: '2026-01-01',
    lastLoginAt: '2026-08-19 12:00',
  },
];

export const mockACUnits: ACUnit[] = [];

export const mockInventory: InventoryItem[] = [];

export const mockServiceOrders: ServiceOrder[] = [];

export const mockAttendanceRecords: AttendanceRecord[] = [];

export const mockFinancialTransactions: FinancialTransaction[] = [];

export const initialCompanyProfile: CompanyProfile = {
  name: 'KoolFix Aircon Solution',
  tagline: 'Layanan Profesional Servis, Cuci & Reparasi AC Bergaransi',
  logoUrl: '',
  personInCharge: 'Super Administrator',
  personInChargeTitle: 'Penanggung Jawab Utama & Direktur Teknis',
  address: 'HQ KoolFix, Jl. Raya Casablanca No. 88, Jakarta Selatan',
  phone: '0812-8899-1122',
  email: 'superadmin@koolfix.com',
  website: 'www.koolfix.com',
  taxIdentificationNumber: '01.234.567.8-012.000',
  bankAccountDetails: 'Bank BCA: 8820-192-881 a/n KoolFix Solusi Mandiri',
};

export const mockProductPackages: ProductPackage[] = [];
