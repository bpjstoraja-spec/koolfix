import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  User, 
  UserRole, 
  UserAccountStatus,
  AppFeatureId,
  FeatureDefinition,
  RoleDefaultPermissions,
  SalaryConfig, 
  ServiceCategory, 
  ProductPackage,
  ACUnit, 
  ServiceOrder, 
  ServiceStatus, 
  InventoryItem, 
  InventoryTransaction, 
  AttendanceRecord, 
  FinancialTransaction, 
  CustomerReview, 
  TechnicalReport, 
  TechnicianDailyEarnings,
  SparePartUsed,
  AssignedTechnician,
  CompanyProfile
} from '../types';
import { 
  mockUsers, 
  initialSalaryConfig, 
  serviceCategories as initialServiceCategories, 
  mockProductPackages,
  mockACUnits, 
  mockInventory, 
  mockServiceOrders, 
  mockAttendanceRecords, 
  mockFinancialTransactions,
  systemFeatureDefinitions,
  defaultRolePermissions,
  initialCompanyProfile
} from '../data/mockData';
import { 
  seedInitialDataIfEmpty,
  COLLECTIONS,
  subscribeToCompanyProfile,
  subscribeToCollection,
  subscribeToSystemSettings,
  saveCompanyProfileCloud,
  saveSystemSettingCloud,
  saveDocCloud,
  updateDocCloud,
  deleteDocCloud,
  cleanForFirestore
} from '../services/firestoreSync';
import { testFirestoreConnection } from '../firebase';

interface AppContextType {
  // Cloud Synchronization Status
  isCloudSynced: boolean;
  cloudSyncStatus: 'connected' | 'syncing' | 'offline';

  // Company Profile (Managed by Super Admin)
  companyProfile: CompanyProfile;
  updateCompanyProfile: (profile: Partial<CompanyProfile>) => void;
  resetCompanyProfile: () => void;

  // Authentication & Session
  isAuthenticated: boolean;
  currentUser: User;
  setCurrentUser: (user: User) => void;
  login: (identifier: string, password: string) => { success: boolean; message: string };
  quickLoginAs: (userId: string) => void;
  logout: () => void;
  registerUser: (userData: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: UserRole;
    companyName?: string;
    address?: string;
    taxIdentificationNumber?: string;
  }) => { success: boolean; message: string };

  switchRole: (role: UserRole, userId?: string) => void;
  
  // User & Access Control Management (Super Admin)
  users: User[];
  addUser: (user: Omit<User, 'id' | 'joinDate'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  setUserAccountStatus: (userId: string, status: UserAccountStatus) => void;
  resetUserPassword: (userId: string, customPassword?: string) => { success: boolean; temporaryPassword?: string };
  updateUserPermissions: (userId: string, permissions: Partial<Record<AppFeatureId, boolean>>) => void;
  lockAllUserSessions: (exceptUserId?: string) => void;
  updateTechnicianSalaryConfig: (technicianId: string, config: SalaryConfig) => void;
  
  // Feature Permissions Matrix (Super Admin)
  systemFeatureDefinitions: FeatureDefinition[];
  roleDefaultPermissions: RoleDefaultPermissions;
  updateRoleDefaultPermissions: (role: UserRole, permissions: Record<AppFeatureId, boolean>) => void;
  resetPermissionsToDefaults: () => void;
  hasPermission: (featureId: AppFeatureId, targetUser?: User) => boolean;

  globalSalaryConfig: SalaryConfig;
  updateGlobalSalaryConfig: (config: SalaryConfig) => void;
  
  // Services & Products Master Data
  serviceCategories: ServiceCategory[];
  addServiceCategory: (cat: Omit<ServiceCategory, 'id'>) => void;
  updateServiceCategory: (id: string, updates: Partial<ServiceCategory>) => void;
  deleteServiceCategory: (id: string) => void;

  productPackages: ProductPackage[];
  addProductPackage: (pkg: Omit<ProductPackage, 'id'>) => void;
  updateProductPackage: (id: string, updates: Partial<ProductPackage>) => void;
  deleteProductPackage: (id: string) => void;
  
  acUnits: ACUnit[];
  addACUnit: (unit: Omit<ACUnit, 'id'>) => ACUnit;
  updateACUnit: (id: string, updates: Partial<ACUnit>) => void;
  deleteACUnit: (id: string) => void;
  
  serviceOrders: ServiceOrder[];
  createServiceOrder: (orderData: Partial<ServiceOrder>) => ServiceOrder;
  updateServiceOrder: (id: string, updates: Partial<ServiceOrder>) => void;
  deleteServiceOrder: (id: string) => void;
  assignTechnician: (orderId: string, technicianId: string, scheduledDate: string, timeSlot: string) => void;
  assignTechnicians: (
    orderId: string, 
    assignments: { technicianId: string; roleInJob?: 'LEAD' | 'ASSISTANT' | 'MEMBER'; commissionSharePercent?: number }[], 
    scheduledDate: string, 
    timeSlot: string
  ) => void;
  updateOrderStatus: (orderId: string, status: ServiceStatus) => void;
  completeTechnicianJob: (
    orderId: string, 
    report: TechnicalReport, 
    partsUsed: SparePartUsed[], 
    paymentDetails: {
      paymentMethod: 'TUNAI' | 'TRANSFER_BANK' | 'QRIS' | 'TEMPO_KANTOR';
      paymentAmountReceived?: number;
      paymentProofPhoto?: string;
      paymentNotes?: string;
    } | ('TUNAI' | 'TRANSFER_BANK' | 'QRIS' | 'TEMPO_KANTOR')
  ) => void;
  verifyOrderPayment: (
    orderId: string, 
    newPaymentStatus: 'LUNAS' | 'DITOLAK' | 'BELUM_BAYAR', 
    adminNotes?: string
  ) => void;
  updateTechnicalReport: (orderId: string, report: Partial<TechnicalReport>) => void;
  deleteTechnicalReport: (orderId: string) => void;
  submitCustomerReview: (orderId: string, review: Omit<CustomerReview, 'id' | 'orderId' | 'createdAt'>) => void;
  
  inventory: InventoryItem[];
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'lastRestockedAt'>) => void;
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => void;
  deleteInventoryItem: (id: string) => void;
  restockItem: (itemId: string, quantity: number, unitPurchasePrice: number, supplier: string, notes?: string) => void;
  
  inventoryTransactions: InventoryTransaction[];
  
  attendanceRecords: AttendanceRecord[];
  clockIn: (technicianId: string, location?: { latitude: number; longitude: number; addressName: string; accuracyMeters?: number }, photoUrl?: string) => void;
  clockOut: (technicianId: string, location?: { latitude: number; longitude: number; addressName: string }) => void;
  addAttendanceRecord: (record: Omit<AttendanceRecord, 'id'>) => void;
  updateAttendanceRecord: (id: string, updates: Partial<AttendanceRecord>) => void;
  deleteAttendanceRecord: (id: string) => void;
  
  financialTransactions: FinancialTransaction[];
  addFinancialExpense: (expense: Omit<FinancialTransaction, 'id' | 'transactionNumber' | 'type'>) => void;
  addFinancialTransaction: (trx: Omit<FinancialTransaction, 'id' | 'transactionNumber'>) => void;
  updateFinancialTransaction: (id: string, updates: Partial<FinancialTransaction>) => void;
  deleteFinancialTransaction: (id: string) => void;
  
  // Computed helpers
  calculateCommissionForOrder: (order: ServiceOrder, tech: User) => number;
  getTechnicianDailyEarnings: (technicianId: string, dateStr: string) => TechnicianDailyEarnings;
  getTechnicianMonthlyEarnings: (technicianId: string, yearMonth: string) => {
    attendanceDays: number;
    totalAttendanceAllowance: number;
    completedJobsCount: number;
    totalCommissions: number;
    baseSalary: number;
    totalMonthlyEarnings: number;
    dailyLogs: TechnicianDailyEarnings[];
  };
  
  notification: { message: string; type: 'success' | 'info' | 'warning' | 'error' } | null;
  showNotification: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  clearNotification: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  IS_AUTH: 'koolfix_is_authenticated_v1',
  USERS: 'koolfix_users_v1',
  CURRENT_USER_ID: 'koolfix_current_uid_v1',
  ROLE_PERMS: 'koolfix_role_permissions_v1',
  SALARY_CONFIG: 'koolfix_salary_cfg_v1',
  CATEGORIES: 'koolfix_categories_v1',
  AC_UNITS: 'koolfix_ac_units_v1',
  ORDERS: 'koolfix_orders_v1',
  INVENTORY: 'koolfix_inventory_v1',
  INV_TRX: 'koolfix_inv_trx_v1',
  ATTENDANCE: 'koolfix_attendance_v1',
  FINANCE: 'koolfix_finance_v1',
  COMPANY_PROFILE: 'koolfix_company_profile_v2',
  PACKAGES: 'koolfix_packages_v1',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Company Profile State (Super Admin configurable)
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.COMPANY_PROFILE);
    return saved ? JSON.parse(saved) : initialCompanyProfile;
  });

  // Authentication & Users
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.IS_AUTH);
    return saved !== null ? JSON.parse(saved) : false; // Enforce explicit login by default
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USERS);
    let list: User[] = saved ? JSON.parse(saved) : mockUsers;
    // Guarantee patented superadmin account exists and has exact credentials
    const hasSuperAdmin = list.some(u => u.username === 'superadmin' || u.id === 'usr-superadmin');
    if (!hasSuperAdmin) {
      list = [...mockUsers, ...list];
    } else {
      list = list.map(u => (u.username === 'superadmin' || u.id === 'usr-superadmin') ? {
        ...u,
        username: 'superadmin',
        password: 'Adrian721+',
        role: 'SUPER_ADMIN',
        status: 'AKTIF'
      } : u);
    }
    return list;
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    return saved || 'usr-superadmin';
  });

  const [roleDefaultPermissions, setRoleDefaultPermissions] = useState<RoleDefaultPermissions>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ROLE_PERMS);
    return saved ? JSON.parse(saved) : defaultRolePermissions;
  });

  const [globalSalaryConfig, setGlobalSalaryConfig] = useState<SalaryConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SALARY_CONFIG);
    return saved ? JSON.parse(saved) : initialSalaryConfig;
  });

  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    return saved ? JSON.parse(saved) : initialServiceCategories;
  });

  const [productPackages, setProductPackages] = useState<ProductPackage[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PACKAGES);
    return saved ? JSON.parse(saved) : mockProductPackages;
  });

  const [acUnits, setAcUnits] = useState<ACUnit[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AC_UNITS);
    return saved ? JSON.parse(saved) : mockACUnits;
  });

  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
    return saved ? JSON.parse(saved) : mockServiceOrders;
  });

  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.INVENTORY);
    return saved ? JSON.parse(saved) : mockInventory;
  });

  const [inventoryTransactions, setInventoryTransactions] = useState<InventoryTransaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.INV_TRX);
    return saved ? JSON.parse(saved) : [
      {
        id: 'trx-inv-1',
        itemId: 'inv-1',
        itemName: 'Freon Refrigerant R32 Daikin Original (13.6 kg)',
        type: 'MASUK',
        quantity: 5,
        unitPrice: 650000,
        totalAmount: 3250000,
        notes: 'Restock bulanan dari supplier',
        performedBy: 'Budi Santoso',
        createdAt: '2026-08-10 14:00',
      },
      {
        id: 'trx-inv-2',
        itemId: 'inv-4',
        itemName: 'Kapasitor Kompresor 35 uF 450VAC Shizuki',
        type: 'KELUAR',
        quantity: 1,
        unitPrice: 110000,
        totalAmount: 110000,
        referenceOrderId: 'ord-001',
        referenceOrderNumber: 'ORD-2026-0816-01',
        notes: 'Dipakai pada servis Ibu Ratna Dewi',
        performedBy: 'Agus Pratama',
        createdAt: '2026-08-16 10:45',
      },
    ];
  });

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    return saved ? JSON.parse(saved) : mockAttendanceRecords;
  });

  const [financialTransactions, setFinancialTransactions] = useState<FinancialTransaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.FINANCE);
    return saved ? JSON.parse(saved) : mockFinancialTransactions;
  });

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'warning' | 'error' } | null>(null);
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(true);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'connected' | 'syncing' | 'offline'>('connected');
  const isInitialMount = useRef(true);

  // Initial Firestore Connectivity & Real-Time Cloud Listeners
  useEffect(() => {
    let unsubs: (() => void)[] = [];

    const initializeCloudSync = async () => {
      try {
        setCloudSyncStatus('syncing');
        const isConnected = await testFirestoreConnection();
        if (!isConnected) {
          setCloudSyncStatus('offline');
          setIsCloudSynced(false);
          return;
        }

        // Seed initial data to cloud if collections are empty
        await seedInitialDataIfEmpty({
          users: mockUsers,
          serviceOrders: mockServiceOrders,
          inventory: mockInventory,
          inventoryTransactions: [
            {
              id: 'trx-inv-1',
              itemId: 'inv-1',
              itemName: 'Freon Refrigerant R32 Daikin Original (13.6 kg)',
              type: 'MASUK',
              quantity: 5,
              unitPrice: 650000,
              totalAmount: 3250000,
              notes: 'Restock bulanan dari supplier',
              performedBy: 'Budi Santoso',
              createdAt: '2026-08-10 14:00',
            },
            {
              id: 'trx-inv-2',
              itemId: 'inv-4',
              itemName: 'Kapasitor Kompresor 35 uF 450VAC Shizuki',
              type: 'KELUAR',
              quantity: 1,
              unitPrice: 110000,
              totalAmount: 110000,
              referenceOrderId: 'ord-001',
              referenceOrderNumber: 'ORD-2026-0816-01',
              notes: 'Dipakai pada servis Ibu Ratna Dewi',
              performedBy: 'Agus Pratama',
              createdAt: '2026-08-16 10:45',
            },
          ],
          attendanceRecords: mockAttendanceRecords,
          financialTransactions: mockFinancialTransactions,
          companyProfile: initialCompanyProfile,
          serviceCategories: initialServiceCategories,
          productPackages: mockProductPackages,
          acUnits: mockACUnits,
          roleDefaultPermissions: defaultRolePermissions,
          globalSalaryConfig: initialSalaryConfig,
        });

        // Set up real-time onSnapshot listeners
        const unsubProfile = subscribeToCompanyProfile((profile) => {
          setCompanyProfile(profile);
        });
        unsubs.push(unsubProfile);

        const unsubSettings = subscribeToSystemSettings(
          (perms) => setRoleDefaultPermissions(perms),
          (salary) => setGlobalSalaryConfig(salary)
        );
        unsubs.push(unsubSettings);

        const unsubUsers = subscribeToCollection<User>(COLLECTIONS.USERS, (cloudUsers) => {
          if (cloudUsers && Array.isArray(cloudUsers) && cloudUsers.length > 0) {
            setUsers(prev => {
              const userMap = new Map<string, User>();
              // Keep current local/state users
              prev.forEach(u => {
                if (u && u.id) userMap.set(u.id, u);
              });
              // Merge/update with cloud users
              cloudUsers.forEach(u => {
                if (u && u.id) {
                  const existing = userMap.get(u.id);
                  userMap.set(u.id, {
                    ...existing,
                    ...u,
                    // Ensure essential fields exist
                    name: u.name || existing?.name || 'Pengguna',
                    email: u.email || existing?.email || '',
                    phone: u.phone || existing?.phone || '',
                    username: u.username || existing?.username || (u.email ? u.email.split('@')[0] : (u.name ? u.name.toLowerCase().replace(/\s+/g, '') : '')),
                    role: u.role || existing?.role || 'PELANGGAN_UMUM',
                    status: u.status || existing?.status || 'AKTIF',
                    password: u.password || existing?.password || (u.role === 'SUPER_ADMIN' ? 'Adrian721+' : 'password123'),
                  });
                }
              });

              const mergedList = Array.from(userMap.values());
              // Ensure patented Super Admin always exists
              const hasSuperAdmin = mergedList.some(u => u.username === 'superadmin' || u.id === 'usr-superadmin');
              if (!hasSuperAdmin) {
                mergedList.unshift(mockUsers[0]);
              }
              return mergedList;
            });
          }
        });
        unsubs.push(unsubUsers);

        const unsubCats = subscribeToCollection<ServiceCategory>(COLLECTIONS.CATEGORIES, (data) => {
          if (data) setServiceCategories(data);
        });
        unsubs.push(unsubCats);

        const unsubPackages = subscribeToCollection<ProductPackage>(COLLECTIONS.PACKAGES, (data) => {
          if (data) setProductPackages(data);
        });
        unsubs.push(unsubPackages);

        const unsubAC = subscribeToCollection<ACUnit>(COLLECTIONS.AC_UNITS, (data) => {
          if (data) setAcUnits(data);
        });
        unsubs.push(unsubAC);

        const unsubOrders = subscribeToCollection<ServiceOrder>(COLLECTIONS.SERVICE_ORDERS, (data) => {
          if (data) setServiceOrders(data);
        });
        unsubs.push(unsubOrders);

        const unsubInv = subscribeToCollection<InventoryItem>(COLLECTIONS.INVENTORY, (data) => {
          if (data) setInventory(data);
        });
        unsubs.push(unsubInv);

        const unsubInvTrx = subscribeToCollection<InventoryTransaction>(COLLECTIONS.INVENTORY_TRX, (data) => {
          if (data) setInventoryTransactions(data);
        });
        unsubs.push(unsubInvTrx);

        const unsubAtt = subscribeToCollection<AttendanceRecord>(COLLECTIONS.ATTENDANCE, (data) => {
          if (data) setAttendanceRecords(data);
        });
        unsubs.push(unsubAtt);

        const unsubFin = subscribeToCollection<FinancialTransaction>(COLLECTIONS.FINANCE, (data) => {
          if (data) setFinancialTransactions(data);
        });
        unsubs.push(unsubFin);

        setIsCloudSynced(true);
        setCloudSyncStatus('connected');
      } catch (err) {
        console.error('Firestore cloud sync initialization error:', err);
        setCloudSyncStatus('offline');
        setIsCloudSynced(false);
      }
    };

    initializeCloudSync();

    return () => {
      unsubs.forEach(unsub => {
        try { unsub(); } catch (e) { /* ignore */ }
      });
    };
  }, []);

  // Sync state changes to localStorage for offline cache
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.IS_AUTH, JSON.stringify(isAuthenticated)); }, [isAuthenticated]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, currentUserId); }, [currentUserId]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.ROLE_PERMS, JSON.stringify(roleDefaultPermissions)); }, [roleDefaultPermissions]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.SALARY_CONFIG, JSON.stringify(globalSalaryConfig)); }, [globalSalaryConfig]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(serviceCategories)); }, [serviceCategories]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.PACKAGES, JSON.stringify(productPackages)); }, [productPackages]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.AC_UNITS, JSON.stringify(acUnits)); }, [acUnits]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(serviceOrders)); }, [serviceOrders]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory)); }, [inventory]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.INV_TRX, JSON.stringify(inventoryTransactions)); }, [inventoryTransactions]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendanceRecords)); }, [attendanceRecords]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.FINANCE, JSON.stringify(financialTransactions)); }, [financialTransactions]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.COMPANY_PROFILE, JSON.stringify(companyProfile)); }, [companyProfile]);

  const currentUser = users.find(u => u.id === currentUserId) || users[0];

  const updateCompanyProfile = (updates: Partial<CompanyProfile>) => {
    const updated = {
      ...companyProfile,
      ...updates,
    };
    setCompanyProfile(updated);
    saveCompanyProfileCloud(updated);
    showNotification('Profil & identitas perusahaan berhasil diperbarui dan tersinkron ke cloud!', 'success');
  };

  const resetCompanyProfile = () => {
    setCompanyProfile(initialCompanyProfile);
    saveCompanyProfileCloud(initialCompanyProfile);
    showNotification('Profil perusahaan dikembalikan ke konfigurasi standar.', 'info');
  };

  const showNotification = (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(prev => prev?.message === message ? null : prev);
    }, 4000);
  };

  const clearNotification = () => setNotification(null);

  const setCurrentUser = (user: User) => {
    setCurrentUserId(user.id);
  };

  // Login authentication
  const login = (identifier: string, password: string): { success: boolean; message: string } => {
    const rawId = (identifier || '').trim();
    const cleanId = rawId.toLowerCase();
    const cleanDigits = rawId.replace(/[^0-9]/g, '');
    const cleanPass = (password || '').trim();

    if (!rawId || !cleanPass) {
      return { success: false, message: 'Harap masukkan identitas akun dan kata sandi.' };
    }

    const user = users.find(u => {
      if (!u) return false;

      // 1. Match Email (exact match or username prefix before @)
      if (u.email) {
        const uEmail = u.email.trim().toLowerCase();
        if (uEmail === cleanId) return true;
        const prefix = uEmail.split('@')[0];
        if (prefix && prefix === cleanId) return true;
      }

      // 2. Match Username (exact case-insensitive)
      if (u.username) {
        const uUsername = u.username.trim().toLowerCase();
        if (uUsername === cleanId) return true;
      }

      // 3. Match Full Name or Normalized Name (case-insensitive)
      if (u.name) {
        const uName = u.name.trim().toLowerCase();
        if (uName === cleanId) return true;
        if (uName.replace(/\s+/g, '') === cleanId.replace(/\s+/g, '')) return true;
      }

      // 4. Match Phone number (supports formatted 08xx, +628xx, dashes, spaces)
      if (u.phone) {
        const uPhoneTrim = u.phone.trim();
        if (uPhoneTrim === rawId) return true;
        const uDigits = uPhoneTrim.replace(/[^0-9]/g, '');
        if (cleanDigits.length >= 7 && uDigits.length >= 7) {
          if (cleanDigits === uDigits) return true;
          const normClean = cleanDigits.startsWith('62') ? '0' + cleanDigits.slice(2) : cleanDigits;
          const normUDigits = uDigits.startsWith('62') ? '0' + uDigits.slice(2) : uDigits;
          if (normClean === normUDigits) return true;
        }
      }

      // 5. Match User ID
      if (u.id && u.id.toLowerCase() === cleanId) return true;

      return false;
    });

    if (!user) {
      return { 
        success: false, 
        message: 'Akun tidak ditemukan. Anda dapat login menggunakan Email, Username, No. WhatsApp, atau Nama Lengkap.' 
      };
    }

    if (user.status === 'DITANGGUHKAN' || user.status === 'TERKUNCI' || user.status === 'NONAKTIF') {
      return { 
        success: false, 
        message: `Akun Anda sedang ${user.status.toLowerCase()} oleh Super Admin. Silakan hubungi administrator.` 
      };
    }

    // Check password
    const validPassword = (user.password || (user.role === 'SUPER_ADMIN' ? 'Adrian721+' : 'password123')).trim();
    if (cleanPass !== validPassword) {
      return { success: false, message: 'Kata sandi salah. Silakan periksa kembali kata sandi Anda.' };
    }

    // Update last login
    const nowStr = new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' });
    const updatedUser: User = { 
      ...user, 
      lastLoginAt: nowStr,
      lastLoginIp: '180.252.164.20 (Aktif)'
    };

    setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
    saveDocCloud(COLLECTIONS.USERS, cleanForFirestore(updatedUser));

    setCurrentUserId(user.id);
    setIsAuthenticated(true);
    showNotification(`Selamat datang kembali, ${user.name}!`, 'success');
    return { success: true, message: 'Login berhasil' };
  };

  // Quick 1-click login for demo/testing
  const quickLoginAs = (userId: string) => {
    const match = users.find(u => u.id === userId);
    if (match) {
      setCurrentUserId(match.id);
      setIsAuthenticated(true);
      showNotification(`Login sebagai: ${match.name} (${match.role})`, 'info');
    }
  };

  // Logout session
  const logout = () => {
    setIsAuthenticated(false);
    showNotification('Anda telah berhasil keluar dari sesi.', 'info');
  };

  // Register customer or new user
  const registerUser = (userData: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: UserRole;
    companyName?: string;
    address?: string;
    taxIdentificationNumber?: string;
  }): { success: boolean; message: string } => {
    const rawEmail = userData.email.trim().toLowerCase();
    const rawName = userData.name.trim();
    const rawPhone = userData.phone.trim();
    const rawPass = userData.password.trim();
    const rawUsername = rawEmail.split('@')[0] || rawName.toLowerCase().replace(/\s+/g, '');

    const existing = users.find(u => 
      (u.email && u.email.trim().toLowerCase() === rawEmail) ||
      (u.username && u.username.trim().toLowerCase() === rawUsername)
    );
    if (existing) {
      return { success: false, message: 'Email atau username sudah terdaftar. Silakan gunakan email lain atau login.' };
    }

    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: rawName,
      email: rawEmail,
      phone: rawPhone,
      username: rawUsername,
      password: rawPass,
      role: userData.role,
      status: 'AKTIF',
      avatar: `https://images.unsplash.com/photo-${userData.role === 'PELANGGAN_KANTOR' ? '1486406146926-c627a92ad1ab' : '1535713875002-d1d0cf377fde'}?w=150&auto=format&fit=crop&q=80`,
      joinDate: new Date().toISOString().split('T')[0],
      lastLoginAt: new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }),
      lastLoginIp: '180.252.164.20 (Web Registrasi)',
      ...(userData.companyName?.trim() ? { companyName: userData.companyName.trim() } : {}),
      ...(userData.taxIdentificationNumber?.trim() ? { taxIdentificationNumber: userData.taxIdentificationNumber.trim() } : {}),
      ...(userData.address?.trim() ? { address: userData.address.trim() } : {}),
    };

    const cleaned = cleanForFirestore(newUser);
    setUsers(prev => [cleaned, ...prev]);
    saveDocCloud(COLLECTIONS.USERS, cleaned);
    setCurrentUserId(cleaned.id);
    setIsAuthenticated(true);
    showNotification(`Akun ${cleaned.name} berhasil dibuat!`, 'success');
    return { success: true, message: 'Registrasi berhasil' };
  };

  // Permission evaluation helper
  const hasPermission = (featureId: AppFeatureId, targetUser?: User): boolean => {
    const user = targetUser || currentUser;
    if (!user) return false;

    // If account is suspended or locked, deny all
    if (user.status === 'DITANGGUHKAN' || user.status === 'TERKUNCI' || user.status === 'NONAKTIF') {
      return false;
    }

    // Super Admin by default has all permissions
    if (user.role === 'SUPER_ADMIN') {
      // Check if super admin explicitly turned off a custom permission for testing
      if (user.customPermissions?.[featureId] !== undefined) {
        return user.customPermissions[featureId]!;
      }
      return true;
    }

    // 1. Check user-specific custom permission override
    if (user.customPermissions && user.customPermissions[featureId] !== undefined) {
      return !!user.customPermissions[featureId];
    }

    // 2. Check role default permissions
    const rolePerms = roleDefaultPermissions[user.role];
    if (rolePerms && rolePerms[featureId] !== undefined) {
      return !!rolePerms[featureId];
    }

    return false;
  };

  // Update permissions for a whole role (Super Admin control)
  const updateRoleDefaultPermissions = (role: UserRole, permissions: Record<AppFeatureId, boolean>) => {
    const updated = {
      ...roleDefaultPermissions,
      [role]: permissions,
    };
    setRoleDefaultPermissions(updated);
    saveSystemSettingCloud('permissions', updated);
    showNotification(`Matrix izin untuk role ${role} berhasil diperbarui dan tersinkron!`, 'success');
  };

  // Reset all role permissions to factory defaults
  const resetPermissionsToDefaults = () => {
    setRoleDefaultPermissions(defaultRolePermissions);
    saveSystemSettingCloud('permissions', defaultRolePermissions);
    // Also reset custom user overrides
    setUsers(prev => prev.map(u => {
      const updatedUser = { ...u, customPermissions: undefined };
      saveDocCloud(COLLECTIONS.USERS, updatedUser);
      return updatedUser;
    }));
    showNotification('Seluruh hak akses role dan pengguna dikembalikan ke setelan standar.', 'info');
  };

  // Update specific permissions for an individual user (Super Admin override)
  const updateUserPermissions = (userId: string, permissions: Partial<Record<AppFeatureId, boolean>>) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const updated = { ...u, customPermissions: permissions };
        saveDocCloud(COLLECTIONS.USERS, updated);
        return updated;
      }
      return u;
    }));
    showNotification('Hak akses khusus pengguna berhasil disimpan ke cloud!', 'success');
  };

  // Account status control by Super Admin (Aktif / Ditangguhkan / Terkunci)
  const setUserAccountStatus = (userId: string, status: UserAccountStatus) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const updated = { ...u, status };
        saveDocCloud(COLLECTIONS.USERS, updated);
        return updated;
      }
      return u;
    }));
    showNotification(`Status akun diperbarui menjadi: ${status}`, 'success');
  };

  // Reset user password by Super Admin
  const resetUserPassword = (userId: string, customPassword?: string): { success: boolean; temporaryPassword?: string } => {
    const tempPass = customPassword?.trim() || `koolfix${Math.floor(1000 + Math.random() * 9000)}`;
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const updated = {
          ...u,
          password: tempPass,
          isPasswordTemporary: true,
        };
        saveDocCloud(COLLECTIONS.USERS, updated);
        return updated;
      }
      return u;
    }));
    showNotification(`Kata sandi akun berhasil direset!`, 'success');
    return { success: true, temporaryPassword: tempPass };
  };

  // Lock all user sessions (Super Admin security measure)
  const lockAllUserSessions = (exceptUserId?: string) => {
    const targetExcept = exceptUserId || currentUserId;
    setUsers(prev => prev.map(u => {
      if (u.id !== targetExcept && u.role !== 'SUPER_ADMIN') {
        const updated = { ...u, status: 'DITANGGUHKAN' as UserAccountStatus };
        saveDocCloud(COLLECTIONS.USERS, updated);
        return updated;
      }
      return u;
    }));
    showNotification('Sesi seluruh anggota dan user berhasil ditangguhkan untuk audit keamanan.', 'warning');
  };

  const switchRole = (role: UserRole, targetUserId?: string) => {
    if (targetUserId) {
      const match = users.find(u => u.id === targetUserId);
      if (match) {
        setCurrentUserId(match.id);
        setIsAuthenticated(true);
        showNotification(`Beralih ke akun: ${match.name} (${role})`, 'info');
        return;
      }
    }
    const match = users.find(u => u.role === role);
    if (match) {
      setCurrentUserId(match.id);
      setIsAuthenticated(true);
      showNotification(`Beralih ke peran: ${role} (${match.name})`, 'info');
    }
  };

  // User Management
  const addUser = (userData: Omit<User, 'id' | 'joinDate'>) => {
    const rawEmail = (userData.email || '').trim();
    const rawName = (userData.name || '').trim();
    const rawPhone = (userData.phone || '').trim();
    const rawUsername = (userData.username || (rawEmail ? rawEmail.split('@')[0] : rawName.replace(/\s+/g, '').toLowerCase())).trim().toLowerCase();
    const rawPassword = (userData.password || 'password123').trim();

    const newUser: User = {
      ...userData,
      id: `usr-${Date.now()}`,
      name: rawName,
      email: rawEmail,
      phone: rawPhone,
      username: rawUsername,
      password: rawPassword,
      status: userData.status || 'AKTIF',
      joinDate: new Date().toISOString().split('T')[0],
      technicianSalaryConfig: userData.role === 'TEKNISI' ? (userData.technicianSalaryConfig || globalSalaryConfig) : undefined,
      ...(userData.companyName?.trim() ? { companyName: userData.companyName.trim() } : {}),
      ...(userData.taxIdentificationNumber?.trim() ? { taxIdentificationNumber: userData.taxIdentificationNumber.trim() } : {}),
      ...(userData.address?.trim() ? { address: userData.address.trim() } : {}),
    };

    const cleaned = cleanForFirestore(newUser);
    setUsers(prev => [cleaned, ...prev]);
    saveDocCloud(COLLECTIONS.USERS, cleaned);
    showNotification(`Pengguna ${cleaned.name} berhasil ditambahkan ke database!`, 'success');
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(u => {
      if (u.id === id) {
        const updated = { ...u, ...updates };
        saveDocCloud(COLLECTIONS.USERS, updated);
        return updated;
      }
      return u;
    }));
    showNotification('Data pengguna berhasil diperbarui di cloud', 'success');
  };

  const deleteUser = (id: string) => {
    const target = users.find(u => u.id === id);
    if (id === currentUser.id) {
      showNotification('Tidak dapat menghapus akun yang sedang aktif digunakan!', 'error');
      return;
    }
    setUsers(prev => prev.filter(u => u.id !== id));
    deleteDocCloud(COLLECTIONS.USERS, id);
    showNotification(`Pengguna ${target?.name || id} berhasil dihapus dari cloud database`, 'warning');
  };

  const updateTechnicianSalaryConfig = (technicianId: string, config: SalaryConfig) => {
    setUsers(prev => prev.map(u => {
      if (u.id === technicianId) {
        const updated = { ...u, technicianSalaryConfig: config };
        saveDocCloud(COLLECTIONS.USERS, updated);
        return updated;
      }
      return u;
    }));
    showNotification('Konfigurasi penggajian teknisi berhasil disimpan ke cloud!', 'success');
  };

  const updateGlobalSalaryConfig = (config: SalaryConfig) => {
    setGlobalSalaryConfig(config);
    saveSystemSettingCloud('salaryConfig', config);
    showNotification('Pengaturan skema komisi & gaji global diperbarui di cloud', 'success');
  };

  // Service Categories
  const addServiceCategory = (cat: Omit<ServiceCategory, 'id'>) => {
    const newCat: ServiceCategory = {
      ...cat,
      id: `srv-${Date.now()}`,
    };
    setServiceCategories(prev => [...prev, newCat]);
    saveDocCloud(COLLECTIONS.CATEGORIES, newCat);
    showNotification(`Layanan "${cat.name}" ditambahkan ke database`, 'success');
  };

  const updateServiceCategory = (id: string, updates: Partial<ServiceCategory>) => {
    setServiceCategories(prev => prev.map(c => {
      if (c.id === id) {
        const updated = { ...c, ...updates };
        saveDocCloud(COLLECTIONS.CATEGORIES, updated);
        return updated;
      }
      return c;
    }));
    showNotification('Data layanan diperbarui di database', 'success');
  };

  const deleteServiceCategory = (id: string) => {
    const target = serviceCategories.find(c => c.id === id);
    setServiceCategories(prev => prev.filter(c => c.id !== id));
    deleteDocCloud(COLLECTIONS.CATEGORIES, id);
    showNotification(`Kategori Layanan "${target?.name || id}" berhasil dihapus`, 'warning');
  };

  // Product Packages
  const addProductPackage = (pkg: Omit<ProductPackage, 'id'>) => {
    const newPkg: ProductPackage = {
      ...pkg,
      id: `pkg-${Date.now()}`,
    };
    setProductPackages(prev => [...prev, newPkg]);
    saveDocCloud(COLLECTIONS.PACKAGES, newPkg);
    showNotification(`Paket Bundling "${pkg.name}" berhasil dibuat di database!`, 'success');
  };

  const updateProductPackage = (id: string, updates: Partial<ProductPackage>) => {
    setProductPackages(prev => prev.map(p => {
      if (p.id === id) {
        const updated = { ...p, ...updates };
        saveDocCloud(COLLECTIONS.PACKAGES, updated);
        return updated;
      }
      return p;
    }));
    showNotification('Data paket bundling berhasil diperbarui', 'success');
  };

  const deleteProductPackage = (id: string) => {
    const target = productPackages.find(p => p.id === id);
    setProductPackages(prev => prev.filter(p => p.id !== id));
    deleteDocCloud(COLLECTIONS.PACKAGES, id);
    showNotification(`Paket Bundling "${target?.name || id}" berhasil dihapus`, 'warning');
  };

  // AC Units
  const addACUnit = (unitData: Omit<ACUnit, 'id'>): ACUnit => {
    const newUnit: ACUnit = {
      ...unitData,
      id: `ac-${Date.now()}`,
    };
    setAcUnits(prev => [newUnit, ...prev]);
    saveDocCloud(COLLECTIONS.AC_UNITS, newUnit);
    showNotification(`Unit AC "${newUnit.brand} ${newUnit.capacityPK}" berhasil didaftarkan ke cloud`, 'success');
    return newUnit;
  };

  const updateACUnit = (id: string, updates: Partial<ACUnit>) => {
    setAcUnits(prev => prev.map(u => {
      if (u.id === id) {
        const updated = { ...u, ...updates };
        saveDocCloud(COLLECTIONS.AC_UNITS, updated);
        return updated;
      }
      return u;
    }));
    showNotification('Data unit AC diperbarui', 'success');
  };

  const deleteACUnit = (id: string) => {
    setAcUnits(prev => prev.filter(u => u.id !== id));
    deleteDocCloud(COLLECTIONS.AC_UNITS, id);
    showNotification('Unit AC dihapus dari daftar cloud', 'info');
  };

  // Calculate technician commission for a service order based on tech's salary config
  const calculateCommissionForOrder = (order: ServiceOrder, tech: User): number => {
    const config = tech.technicianSalaryConfig || globalSalaryConfig;
    if (!config.enableCommission) return 0;

    if (config.commissionType === 'PERCENTAGE_OF_ORDER') {
      const pct = config.defaultCommissionPercentage || 30;
      return Math.round((order.totalServicePrice * pct) / 100);
    }

    // Nominal per service category
    let totalComm = 0;
    order.serviceItems.forEach(item => {
      const customComm = config.serviceCommissions?.find(sc => sc.serviceCategoryId === item.categoryId);
      if (customComm) {
        totalComm += customComm.commissionAmount * item.unitCount;
      } else {
        const cat = serviceCategories.find(c => c.id === item.categoryId);
        totalComm += (cat?.defaultCommission || 25000) * item.unitCount;
      }
    });
    return totalComm;
  };

  // Service Orders
  const createServiceOrder = (orderData: Partial<ServiceOrder>): ServiceOrder => {
    const today = new Date();
    const dateCode = today.toISOString().slice(0, 10).replace(/-/g, '');
    const randNum = Math.floor(10 + Math.random() * 90);
    const orderNumber = `ORD-${dateCode}-${randNum}`;

    const totalServicePrice = orderData.serviceItems?.reduce((sum, item) => sum + item.totalPrice, 0) || 0;
    const totalSparePartsPrice = orderData.sparePartsUsed?.reduce((sum, part) => sum + part.totalPrice, 0) || 0;
    const discount = orderData.discountAmount || 0;
    const grandTotal = Math.max(0, totalServicePrice + totalSparePartsPrice - discount);

    let commission = 0;
    let assignedTechs: AssignedTechnician[] | undefined = orderData.assignedTechnicians;

    if (!assignedTechs && orderData.technicianId) {
      const tech = users.find(u => u.id === orderData.technicianId);
      if (tech) {
        commission = calculateCommissionForOrder({ ...orderData, totalServicePrice } as ServiceOrder, tech);
        assignedTechs = [
          {
            technicianId: tech.id,
            technicianName: tech.name,
            technicianPhone: tech.phone,
            avatar: tech.avatar,
            roleInJob: 'LEAD',
            commissionSharePercent: 100,
            commissionEarned: commission,
          }
        ];
      }
    } else if (assignedTechs && assignedTechs.length > 0) {
      commission = assignedTechs.reduce((sum, t) => sum + (t.commissionEarned || 0), 0);
    }

    const leadTech = assignedTechs?.find(t => t.roleInJob === 'LEAD') || assignedTechs?.[0];

    const newOrder: ServiceOrder = {
      id: `ord-${Date.now()}`,
      orderNumber,
      customerId: orderData.customerId || currentUser.id,
      customerName: orderData.customerName || currentUser.name,
      customerPhone: orderData.customerPhone || currentUser.phone,
      customerAddress: orderData.customerAddress || currentUser.address || '',
      customerType: orderData.customerType || (currentUser.role === 'PELANGGAN_KANTOR' ? 'KANTOR' : 'UMUM'),
      companyName: orderData.companyName || currentUser.companyName,
      technicianId: leadTech?.technicianId || orderData.technicianId,
      technicianName: leadTech?.technicianName || orderData.technicianName,
      technicianPhone: leadTech?.technicianPhone || orderData.technicianPhone,
      assignedTechnicians: assignedTechs,
      scheduledDate: orderData.scheduledDate || today.toISOString().split('T')[0],
      scheduledTimeSlot: orderData.scheduledTimeSlot || '09:00 - 11:00',
      serviceItems: orderData.serviceItems || [],
      acUnitsDetails: orderData.acUnitsDetails || [],
      totalServicePrice,
      sparePartsUsed: orderData.sparePartsUsed || [],
      totalSparePartsPrice,
      discountAmount: discount,
      grandTotal,
      status: orderData.status || 'MENUNGGU_KONFIRMASI',
      paymentStatus: orderData.paymentStatus || 'BELUM_BAYAR',
      paymentMethod: orderData.paymentMethod,
      customerNotes: orderData.customerNotes,
      technicianCommissionEarned: commission,
      createdAt: today.toISOString().replace('T', ' ').slice(0, 16),
      updatedAt: today.toISOString().replace('T', ' ').slice(0, 16),
    };

    setServiceOrders(prev => [newOrder, ...prev]);
    saveDocCloud(COLLECTIONS.SERVICE_ORDERS, newOrder);
    showNotification(`Pesanan Servis #${orderNumber} berhasil dibuat dan tersinkron ke cloud!`, 'success');
    return newOrder;
  };

  const updateServiceOrder = (id: string, updates: Partial<ServiceOrder>) => {
    setServiceOrders(prev => prev.map(o => {
      if (o.id === id) {
        const updated = {
          ...o,
          ...updates,
          updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        };
        saveDocCloud(COLLECTIONS.SERVICE_ORDERS, updated);
        return updated;
      }
      return o;
    }));
  };

  const deleteServiceOrder = (id: string) => {
    const target = serviceOrders.find(o => o.id === id);
    setServiceOrders(prev => prev.filter(o => o.id !== id));
    deleteDocCloud(COLLECTIONS.SERVICE_ORDERS, id);
    showNotification(`Pesanan / Proyek ${target?.orderNumber || id} berhasil dihapus dari cloud database`, 'warning');
  };

  const updateTechnicalReport = (orderId: string, reportUpdates: Partial<TechnicalReport>) => {
    setServiceOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const existing = o.technicalReport || {
          cleaningDoneIndoor: false,
          cleaningDoneOutdoor: false,
          drainageChecked: false,
          electricalChecked: false,
          notes: '',
          beforePhotos: [],
          afterPhotos: [],
        };
        const updated = {
          ...o,
          technicalReport: {
            ...existing,
            ...reportUpdates,
            completedAt: reportUpdates.completedAt || existing.completedAt || new Date().toISOString().replace('T', ' ').slice(0, 16),
          },
          updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        };
        saveDocCloud(COLLECTIONS.SERVICE_ORDERS, updated);
        return updated;
      }
      return o;
    }));
    showNotification('Laporan teknis servis berhasil diperbarui di cloud!', 'success');
  };

  const deleteTechnicalReport = (orderId: string) => {
    setServiceOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const { technicalReport, ...rest } = o;
        const updated = {
          ...rest,
          updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        };
        saveDocCloud(COLLECTIONS.SERVICE_ORDERS, updated);
        return updated;
      }
      return o;
    }));
    showNotification('Laporan teknis berhasil dihapus / di-reset di cloud', 'warning');
  };

  // Assign multiple technicians to a single service order
  const assignTechnicians = (
    orderId: string, 
    assignments: { 
      technicianId: string; 
      roleInJob?: 'LEAD' | 'ASSISTANT' | 'MEMBER'; 
      commissionPercentageOfService?: number;
      commissionSharePercent?: number; 
    }[], 
    scheduledDate: string, 
    timeSlot: string
  ) => {
    if (!assignments || assignments.length === 0) return;

    setServiceOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const isMultiple = assignments.length > 1;
        
        const mappedTechs: AssignedTechnician[] = assignments.map((a, idx) => {
          const userTech = users.find(u => u.id === a.technicianId);
          const isLead = a.roleInJob === 'LEAD' || idx === 0;

          let pctOfService = a.commissionPercentageOfService ?? a.commissionSharePercent;
          if (pctOfService === undefined) {
            if (!isMultiple) {
              pctOfService = 30;
            } else {
              pctOfService = isLead ? 25 : 15;
            }
          }

          // Directly calculate commission from Nilai Pengerjaan (totalServicePrice)
          const techCommission = Math.round((o.totalServicePrice * pctOfService) / 100);

          return {
            technicianId: a.technicianId,
            technicianName: userTech?.name || 'Teknisi KoolFix',
            technicianPhone: userTech?.phone || '',
            avatar: userTech?.avatar,
            roleInJob: a.roleInJob || (isLead ? 'LEAD' : 'ASSISTANT'),
            commissionPercentageOfService: pctOfService,
            commissionSharePercent: pctOfService,
            commissionEarned: techCommission,
          };
        });

        const leadTech = mappedTechs.find(t => t.roleInJob === 'LEAD') || mappedTechs[0];
        const totalCommission = mappedTechs.reduce((sum, t) => sum + (t.commissionEarned || 0), 0);

        const updated: ServiceOrder = {
          ...o,
          technicianId: leadTech.technicianId,
          technicianName: leadTech.technicianName,
          technicianPhone: leadTech.technicianPhone,
          assignedTechnicians: mappedTechs,
          scheduledDate,
          scheduledTimeSlot: timeSlot,
          status: 'DITUGASKAN',
          technicianCommissionEarned: totalCommission,
          updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        };
        saveDocCloud(COLLECTIONS.SERVICE_ORDERS, updated);
        return updated;
      }
      return o;
    }));

    const techNames = assignments.map(a => users.find(u => u.id === a.technicianId)?.name).filter(Boolean).join(', ');
    showNotification(`Penugasan ${assignments.length} teknisi (${techNames}) dengan perhitungan porsi dari nilai pengerjaan berhasil disimpan ke cloud!`, 'success');
  };

  // Backward compatible single technician assign
  const assignTechnician = (orderId: string, technicianId: string, scheduledDate: string, timeSlot: string) => {
    assignTechnicians(
      orderId,
      [{ technicianId, roleInJob: 'LEAD', commissionSharePercent: 100 }],
      scheduledDate,
      timeSlot
    );
  };

  const updateOrderStatus = (orderId: string, status: ServiceStatus) => {
    setServiceOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const updated = {
          ...o,
          status,
          updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        };
        saveDocCloud(COLLECTIONS.SERVICE_ORDERS, updated);
        return updated;
      }
      return o;
    }));
    showNotification(`Status pengerjaan diperbarui menjadi: ${status.replace(/_/g, ' ')}`, 'info');
  };

  // Complete job with full technical inspection report, spare parts deduction, technician payment submission & multi-technician commission calculation
  const completeTechnicianJob = (
    orderId: string, 
    report: TechnicalReport, 
    partsUsed: SparePartUsed[], 
    paymentDetails: {
      paymentMethod: 'TUNAI' | 'TRANSFER_BANK' | 'QRIS' | 'TEMPO_KANTOR';
      paymentAmountReceived?: number;
      paymentProofPhoto?: string;
      paymentNotes?: string;
    } | ('TUNAI' | 'TRANSFER_BANK' | 'QRIS' | 'TEMPO_KANTOR')
  ) => {
    const targetOrder = serviceOrders.find(o => o.id === orderId);
    if (!targetOrder) return;

    const leadTech = users.find(u => u.id === targetOrder.technicianId) || currentUser;
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);

    const paymentMethodVal = typeof paymentDetails === 'string' ? paymentDetails : paymentDetails.paymentMethod;
    const paymentAmountVal = typeof paymentDetails === 'object' ? paymentDetails.paymentAmountReceived : undefined;
    const paymentProofVal = typeof paymentDetails === 'object' ? paymentDetails.paymentProofPhoto : undefined;
    const paymentNotesVal = typeof paymentDetails === 'object' ? paymentDetails.paymentNotes : undefined;

    // 1. Calculate spare parts total
    const totalSpareParts = partsUsed.reduce((sum, p) => sum + p.totalPrice, 0);
    const grandTotal = Math.max(0, targetOrder.totalServicePrice + totalSpareParts - targetOrder.discountAmount);

    // 2. Deduct inventory & record stock out transactions
    if (partsUsed.length > 0) {
      setInventory(prevInv => {
        const updated = [...prevInv];
        partsUsed.forEach(part => {
          const itemIdx = updated.findIndex(i => i.id === part.inventoryItemId);
          if (itemIdx >= 0) {
            updated[itemIdx] = {
              ...updated[itemIdx],
              stock: Math.max(0, updated[itemIdx].stock - part.quantity),
            };
            saveDocCloud(COLLECTIONS.INVENTORY, updated[itemIdx]);
          }
        });
        return updated;
      });

      const newInvTrx: InventoryTransaction[] = partsUsed.map(part => {
        const itemTrx: InventoryTransaction = {
          id: `trx-inv-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          itemId: part.inventoryItemId,
          itemName: part.name,
          type: 'KELUAR',
          quantity: part.quantity,
          unitPrice: part.unitPrice,
          totalAmount: part.totalPrice,
          referenceOrderId: targetOrder.id,
          referenceOrderNumber: targetOrder.orderNumber,
          notes: `Digunakan pada pekerjaan servis ${targetOrder.customerName}`,
          performedBy: leadTech.name,
          createdAt: nowStr,
        };
        saveDocCloud(COLLECTIONS.INVENTORY_TRX, itemTrx);
        return itemTrx;
      });
      setInventoryTransactions(prev => [...newInvTrx, ...prev]);
    }

    // 3. Calculate technician commission(s) for all assigned technicians (Directly from Nilai Pengerjaan / totalServicePrice)
    let updatedAssignedTechs: AssignedTechnician[] | undefined = undefined;
    let totalCalculatedCommission = 0;

    if (targetOrder.assignedTechnicians && targetOrder.assignedTechnicians.length > 0) {
      const isMultiple = targetOrder.assignedTechnicians.length > 1;
      updatedAssignedTechs = targetOrder.assignedTechnicians.map((at, idx) => {
        let pct = at.commissionPercentageOfService ?? at.commissionSharePercent;
        if (pct === undefined) {
          if (!isMultiple) {
            pct = 30;
          } else {
            pct = at.roleInJob === 'LEAD' || idx === 0 ? 25 : 15;
          }
        }
        // Direct calculation from Nilai Pengerjaan (totalServicePrice)
        const commEarned = Math.round((targetOrder.totalServicePrice * pct) / 100);
        return {
          ...at,
          commissionPercentageOfService: pct,
          commissionSharePercent: pct,
          commissionEarned: commEarned,
        };
      });
      totalCalculatedCommission = updatedAssignedTechs.reduce((sum, t) => sum + (t.commissionEarned || 0), 0);
    } else {
      totalCalculatedCommission = calculateCommissionForOrder({ ...targetOrder, totalServicePrice: targetOrder.totalServicePrice }, leadTech);
      updatedAssignedTechs = [
        {
          technicianId: leadTech.id,
          technicianName: leadTech.name,
          technicianPhone: leadTech.phone,
          avatar: leadTech.avatar,
          roleInJob: 'LEAD',
          commissionPercentageOfService: 30,
          commissionSharePercent: 100,
          commissionEarned: totalCalculatedCommission,
        }
      ];
    }

    // 4. Update service order with 'MENUNGGU_VERIFIKASI' status for Admin Verification
    const updatedOrder: ServiceOrder = {
      ...targetOrder,
      sparePartsUsed: partsUsed,
      totalSparePartsPrice: totalSpareParts,
      grandTotal,
      status: 'SELESAI',
      paymentStatus: 'MENUNGGU_VERIFIKASI',
      paymentMethod: paymentMethodVal,
      paymentAmountReceived: paymentAmountVal ?? grandTotal,
      paymentProofPhoto: paymentProofVal,
      paymentNotes: paymentNotesVal,
      technicalReport: {
        ...report,
        completedAt: nowStr,
      },
      assignedTechnicians: updatedAssignedTechs,
      technicianCommissionEarned: totalCalculatedCommission,
      updatedAt: nowStr,
    };

    setServiceOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
    saveDocCloud(COLLECTIONS.SERVICE_ORDERS, updatedOrder);

    // 5. Update all assigned technicians total completed jobs count
    const assignedIds = updatedAssignedTechs.map(t => t.technicianId);
    setUsers(prev => prev.map(u => {
      if (assignedIds.includes(u.id)) {
        const updatedUser = { ...u, totalJobsCompleted: (u.totalJobsCompleted || 0) + 1 };
        saveDocCloud(COLLECTIONS.USERS, updatedUser);
        return updatedUser;
      }
      return u;
    }));

    showNotification(`Pengerjaan #${targetOrder.orderNumber} selesai! Metode pembayaran (${paymentMethodVal}) telah dicatat dan tersinkron ke cloud.`, 'success');
  };

  // Admin Payment Verification
  const verifyOrderPayment = (
    orderId: string, 
    newPaymentStatus: 'LUNAS' | 'DITOLAK' | 'BELUM_BAYAR', 
    adminNotes?: string
  ) => {
    const target = serviceOrders.find(o => o.id === orderId);
    if (!target) return;
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);

    let updatedTarget: ServiceOrder | null = null;
    setServiceOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const updated = {
          ...o,
          paymentStatus: newPaymentStatus,
          paymentVerifiedBy: currentUser.name,
          paymentVerifiedAt: nowStr,
          paymentAdminNotes: adminNotes || o.paymentAdminNotes,
          updatedAt: nowStr,
        };
        updatedTarget = updated;
        saveDocCloud(COLLECTIONS.SERVICE_ORDERS, updated);
        return updated;
      }
      return o;
    }));

    if (newPaymentStatus === 'LUNAS') {
      // Record in Financial cashbook if not already recorded
      const alreadyRecorded = financialTransactions.some(f => f.referenceOrderId === target.id && f.type === 'PEMASUKAN');
      if (!alreadyRecorded) {
        const newFinTrx: FinancialTransaction = {
          id: `trx-${Date.now()}`,
          transactionNumber: `TRX-${Date.now().toString().slice(-6)}`,
          date: nowStr,
          type: 'PEMASUKAN',
          category: 'PENDAPATAN_SERVIS',
          amount: target.paymentAmountReceived ?? target.grandTotal,
          paymentMethod: (target.paymentMethod as 'TUNAI' | 'TRANSFER_BANK' | 'QRIS') || 'TUNAI',
          referenceOrderId: target.id,
          referenceOrderNumber: target.orderNumber,
          description: `Pembayaran Selesai Servis AC #${target.orderNumber} - ${target.customerName} [Diverifikasi Admin: ${currentUser.name}]`,
          recordedBy: currentUser.name,
        };
        setFinancialTransactions(prev => [newFinTrx, ...prev]);
        saveDocCloud(COLLECTIONS.FINANCE, newFinTrx);
      }
      showNotification(`Pembayaran order #${target.orderNumber} berhasil diverifikasi LUNAS oleh ${currentUser.name}!`, 'success');
    } else if (newPaymentStatus === 'DITOLAK') {
      showNotification(`Status pembayaran order #${target.orderNumber} ditolak / diminta perbaikan bukti.`, 'warning');
    } else {
      showNotification(`Status pembayaran order #${target.orderNumber} diubah menjadi Belum Bayar.`, 'info');
    }
  };

  // Submit Review
  const submitCustomerReview = (orderId: string, reviewData: Omit<CustomerReview, 'id' | 'orderId' | 'createdAt'>) => {
    const order = serviceOrders.find(o => o.id === orderId);
    if (!order) return;

    const newReview: CustomerReview = {
      ...reviewData,
      id: `rev-${Date.now()}`,
      orderId,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };

    setServiceOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const updated = { ...o, review: newReview };
        saveDocCloud(COLLECTIONS.SERVICE_ORDERS, updated);
        return updated;
      }
      return o;
    }));

    // Update technician rating average for all assigned technicians
    const targetTechIds = order.assignedTechnicians && order.assignedTechnicians.length > 0
      ? order.assignedTechnicians.map(t => t.technicianId)
      : (order.technicianId ? [order.technicianId] : []);

    if (targetTechIds.length > 0) {
      targetTechIds.forEach(tId => {
        const techOrders = serviceOrders.filter(o => 
          (o.technicianId === tId || o.assignedTechnicians?.some(at => at.technicianId === tId)) && 
          o.review
        );
        const allRatings = [...techOrders.map(o => o.review!.rating), newReview.rating];
        const avg = (allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length).toFixed(1);

        setUsers(prev => prev.map(u => {
          if (u.id === tId) {
            const updatedUser = { ...u, rating: parseFloat(avg) };
            saveDocCloud(COLLECTIONS.USERS, updatedUser);
            return updatedUser;
          }
          return u;
        }));
      });
    }

    showNotification('Terima kasih atas ulasan & penilaian Anda untuk tim teknisi KoolFix!', 'success');
  };

  // Inventory Methods
  const addInventoryItem = (itemData: Omit<InventoryItem, 'id' | 'lastRestockedAt'>) => {
    const newItem: InventoryItem = {
      ...itemData,
      id: `inv-${Date.now()}`,
      lastRestockedAt: new Date().toISOString().split('T')[0],
    };
    setInventory(prev => [newItem, ...prev]);
    saveDocCloud(COLLECTIONS.INVENTORY, newItem);

    // Record restock transaction if initial stock > 0
    if (newItem.stock > 0) {
      const trx: InventoryTransaction = {
        id: `trx-inv-${Date.now()}`,
        itemId: newItem.id,
        itemName: newItem.name,
        type: 'MASUK',
        quantity: newItem.stock,
        unitPrice: newItem.purchasePrice,
        totalAmount: newItem.stock * newItem.purchasePrice,
        notes: 'Stok awal penambahan barang baru',
        performedBy: currentUser.name,
        createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      };
      setInventoryTransactions(prev => [trx, ...prev]);
      saveDocCloud(COLLECTIONS.INVENTORY_TRX, trx);
    }
    showNotification(`Komponen "${newItem.name}" ditambahkan ke inventaris cloud`, 'success');
  };

  const updateInventoryItem = (id: string, updates: Partial<InventoryItem>) => {
    setInventory(prev => prev.map(i => {
      if (i.id === id) {
        const updated = { ...i, ...updates };
        saveDocCloud(COLLECTIONS.INVENTORY, updated);
        return updated;
      }
      return i;
    }));
    showNotification('Data suku cadang berhasil diperbarui di cloud', 'success');
  };

  const deleteInventoryItem = (id: string) => {
    const target = inventory.find(i => i.id === id);
    setInventory(prev => prev.filter(i => i.id !== id));
    deleteDocCloud(COLLECTIONS.INVENTORY, id);
    showNotification(`Item suku cadang "${target?.name || id}" berhasil dihapus dari database cloud`, 'warning');
  };

  const restockItem = (itemId: string, quantity: number, unitPurchasePrice: number, supplier: string, notes?: string) => {
    const item = inventory.find(i => i.id === itemId);
    if (!item) return;

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const totalAmount = quantity * unitPurchasePrice;

    setInventory(prev => prev.map(i => {
      if (i.id === itemId) {
        const updated = {
          ...i,
          stock: i.stock + quantity,
          purchasePrice: unitPurchasePrice,
          supplier: supplier || i.supplier,
          lastRestockedAt: nowStr.split(' ')[0],
        };
        saveDocCloud(COLLECTIONS.INVENTORY, updated);
        return updated;
      }
      return i;
    }));

    // Record in inventory transaction
    const invTrx: InventoryTransaction = {
      id: `trx-inv-${Date.now()}`,
      itemId,
      itemName: item.name,
      type: 'MASUK',
      quantity,
      unitPrice: unitPurchasePrice,
      totalAmount,
      notes: notes || `Restock dari ${supplier}`,
      performedBy: currentUser.name,
      createdAt: nowStr,
    };
    setInventoryTransactions(prev => [invTrx, ...prev]);
    saveDocCloud(COLLECTIONS.INVENTORY_TRX, invTrx);

    // Record in financial expense
    const finTrx: FinancialTransaction = {
      id: `trx-fin-${Date.now()}`,
      transactionNumber: `TRX-${Date.now().toString().slice(-6)}`,
      date: nowStr,
      type: 'PENGELUARAN',
      category: 'PEMBELIAN_STOK',
      amount: totalAmount,
      paymentMethod: 'TRANSFER_BANK',
      description: `Pembelian Restok ${item.name} (${quantity} ${item.unit})`,
      recordedBy: currentUser.name,
    };
    setFinancialTransactions(prev => [finTrx, ...prev]);
    saveDocCloud(COLLECTIONS.FINANCE, finTrx);

    showNotification(`Restok ${quantity} ${item.unit} ${item.name} berhasil dicatat & tersinkron ke cloud!`, 'success');
  };

  // Attendance Clock-in/Clock-out with Geotag & Allowance
  const clockIn = (
    technicianId: string, 
    location?: { latitude: number; longitude: number; addressName: string; accuracyMeters?: number },
    photoUrl?: string
  ) => {
    const tech = users.find(u => u.id === technicianId);
    if (!tech) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toTimeString().split(' ')[0];

    // Check if already clocked in today
    const existing = attendanceRecords.find(a => a.technicianId === technicianId && a.date === todayStr);
    if (existing) {
      showNotification('Anda sudah melakukan absensi masuk hari ini!', 'warning');
      return;
    }

    const config = tech.technicianSalaryConfig || globalSalaryConfig;
    const allowance = config.enableAttendanceAllowance ? config.attendanceAllowancePerDay : 0;

    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}`,
      technicianId,
      technicianName: tech.name,
      date: todayStr,
      clockInTime: timeStr,
      clockInLocation: location || {
        latitude: -6.229746,
        longitude: 106.829518,
        addressName: 'KoolFix Dispatch & Station Jakarta',
        accuracyMeters: 10,
      },
      clockInPhoto: photoUrl,
      status: 'HADIR',
      allowanceEarned: allowance,
      notes: 'Presensi harian via Geotag & Timestamp',
    };

    setAttendanceRecords(prev => [newRecord, ...prev]);
    saveDocCloud(COLLECTIONS.ATTENDANCE, newRecord);
    showNotification(`Presensi Masuk Berhasil! ${allowance > 0 ? `Uang kehadiran Rp ${allowance.toLocaleString('id-ID')} tercatat di cloud.` : ''}`, 'success');
  };

  const clockOut = (
    technicianId: string, 
    location?: { latitude: number; longitude: number; addressName: string }
  ) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toTimeString().split(' ')[0];

    setAttendanceRecords(prev => prev.map(a => {
      if (a.technicianId === technicianId && a.date === todayStr) {
        const updated = {
          ...a,
          clockOutTime: timeStr,
          clockOutLocation: location || {
            latitude: -6.229746,
            longitude: 106.829518,
            addressName: 'KoolFix Dispatch Jakarta',
          },
        };
        saveDocCloud(COLLECTIONS.ATTENDANCE, updated);
        return updated;
      }
      return a;
    }));
    showNotification('Presensi Pulang Berhasil. Data tersinkron ke cloud!', 'success');
  };

  const addAttendanceRecord = (record: Omit<AttendanceRecord, 'id'>) => {
    const newRecord: AttendanceRecord = {
      ...record,
      id: `att-${Date.now()}`,
    };
    setAttendanceRecords(prev => [newRecord, ...prev]);
    saveDocCloud(COLLECTIONS.ATTENDANCE, newRecord);
    showNotification(`Catatan presensi untuk ${record.technicianName} berhasil ditambahkan ke database cloud!`, 'success');
  };

  const updateAttendanceRecord = (id: string, updates: Partial<AttendanceRecord>) => {
    setAttendanceRecords(prev => prev.map(a => {
      if (a.id === id) {
        const updated = { ...a, ...updates };
        saveDocCloud(COLLECTIONS.ATTENDANCE, updated);
        return updated;
      }
      return a;
    }));
    showNotification('Data presensi berhasil diperbarui di cloud', 'success');
  };

  const deleteAttendanceRecord = (id: string) => {
    setAttendanceRecords(prev => prev.filter(a => a.id !== id));
    deleteDocCloud(COLLECTIONS.ATTENDANCE, id);
    showNotification('Catatan presensi berhasil dihapus dari cloud database', 'warning');
  };

  // Financial Expense & Income
  const addFinancialExpense = (expense: Omit<FinancialTransaction, 'id' | 'transactionNumber' | 'type'>) => {
    const newTrx: FinancialTransaction = {
      ...expense,
      id: `trx-${Date.now()}`,
      transactionNumber: `TRX-OUT-${Date.now().toString().slice(-6)}`,
      type: 'PENGELUARAN',
    };
    setFinancialTransactions(prev => [newTrx, ...prev]);
    saveDocCloud(COLLECTIONS.FINANCE, newTrx);
    showNotification(`Pengeluaran Rp ${expense.amount.toLocaleString('id-ID')} dicatat ke kas cloud`, 'success');
  };

  const addFinancialTransaction = (trx: Omit<FinancialTransaction, 'id' | 'transactionNumber'>) => {
    const newTrx: FinancialTransaction = {
      ...trx,
      id: `trx-${Date.now()}`,
      transactionNumber: `TRX-${trx.type === 'PEMASUKAN' ? 'IN' : 'OUT'}-${Date.now().toString().slice(-6)}`,
    };
    setFinancialTransactions(prev => [newTrx, ...prev]);
    saveDocCloud(COLLECTIONS.FINANCE, newTrx);
    showNotification(`Transaksi kas (${trx.type}) sebesar Rp ${trx.amount.toLocaleString('id-ID')} dicatat ke kas cloud`, 'success');
  };

  const updateFinancialTransaction = (id: string, updates: Partial<FinancialTransaction>) => {
    setFinancialTransactions(prev => prev.map(t => {
      if (t.id === id) {
        const updated = { ...t, ...updates };
        saveDocCloud(COLLECTIONS.FINANCE, updated);
        return updated;
      }
      return t;
    }));
    showNotification('Transaksi kas berhasil diperbarui di cloud', 'success');
  };

  const deleteFinancialTransaction = (id: string) => {
    setFinancialTransactions(prev => prev.filter(t => t.id !== id));
    deleteDocCloud(COLLECTIONS.FINANCE, id);
    showNotification('Transaksi kas berhasil dihapus dari jurnal cloud', 'warning');
  };

  // Helper to extract a technician's specific commission on an order
  const getTechCommissionForOrder = (order: ServiceOrder, techId: string): number => {
    if (order.assignedTechnicians && order.assignedTechnicians.length > 0) {
      const match = order.assignedTechnicians.find(t => t.technicianId === techId);
      if (match && typeof match.commissionEarned === 'number') {
        return match.commissionEarned;
      }
      if (match && typeof match.commissionSharePercent === 'number') {
        return Math.round(((order.technicianCommissionEarned || 0) * match.commissionSharePercent) / 100);
      }
    }
    if (order.technicianId === techId) {
      return order.technicianCommissionEarned || 0;
    }
    return 0;
  };

  // Technician Daily Earnings Calculation (Transparent & Real-time)
  const getTechnicianDailyEarnings = (technicianId: string, dateStr: string): TechnicianDailyEarnings => {
    const tech = users.find(u => u.id === technicianId);
    const config = tech?.technicianSalaryConfig || globalSalaryConfig;

    // 1. Attendance allowance
    const att = attendanceRecords.find(a => a.technicianId === technicianId && a.date === dateStr && a.status === 'HADIR');
    const attendanceAllowance = att ? att.allowanceEarned : 0;

    // 2. Base salary daily portion (if daily or divided from monthly)
    let dailyBaseSalaryPortion = 0;
    if (config.enableBaseSalary) {
      if (config.baseSalaryPeriod === 'HARIAN') {
        dailyBaseSalaryPortion = config.baseSalaryAmount;
      } else {
        // Assume 25 working days / month
        dailyBaseSalaryPortion = Math.round(config.baseSalaryAmount / 25);
      }
    }

    // 3. Completed jobs on that date (supports multi-technician assigned jobs)
    const completedJobsToday = serviceOrders.filter(o => 
      (o.technicianId === technicianId || o.assignedTechnicians?.some(t => t.technicianId === technicianId)) && 
      o.status === 'SELESAI' && 
      (o.scheduledDate === dateStr || o.technicalReport?.completedAt?.startsWith(dateStr))
    );

    const jobBreakdown = completedJobsToday.map(job => {
      const serviceNames = job.serviceItems.map(s => `${s.categoryName} (${s.unitCount}x)`).join(', ');
      const myCommission = getTechCommissionForOrder(job, technicianId);
      const teamSuffix = job.assignedTechnicians && job.assignedTechnicians.length > 1
        ? ` (Tim: ${job.assignedTechnicians.length} Teknisi)`
        : '';
      return {
        orderId: job.id,
        orderNumber: job.orderNumber,
        customerName: `${job.customerName}${teamSuffix}`,
        serviceNames,
        orderAmount: job.grandTotal,
        commissionEarned: myCommission,
      };
    });

    const totalJobCommissions = jobBreakdown.reduce((sum, j) => sum + j.commissionEarned, 0);
    const totalEarningsToday = attendanceAllowance + dailyBaseSalaryPortion + totalJobCommissions;

    return {
      date: dateStr,
      attendanceAllowance,
      jobsCompletedCount: completedJobsToday.length,
      totalJobCommissions,
      dailyBaseSalaryPortion,
      totalEarningsToday,
      jobBreakdown,
    };
  };

  const getTechnicianMonthlyEarnings = (technicianId: string, yearMonth: string) => {
    const tech = users.find(u => u.id === technicianId);
    const config = tech?.technicianSalaryConfig || globalSalaryConfig;

    // Filter attendance in that month
    const monthlyAttendance = attendanceRecords.filter(a => 
      a.technicianId === technicianId && 
      a.date.startsWith(yearMonth) && 
      a.status === 'HADIR'
    );
    const attendanceDays = monthlyAttendance.length;
    const totalAttendanceAllowance = monthlyAttendance.reduce((sum, a) => sum + a.allowanceEarned, 0);

    // Filter completed jobs in that month (supports multi-technician assigned jobs)
    const monthlyJobs = serviceOrders.filter(o => 
      (o.technicianId === technicianId || o.assignedTechnicians?.some(t => t.technicianId === technicianId)) && 
      o.status === 'SELESAI' && 
      o.scheduledDate.startsWith(yearMonth)
    );
    const completedJobsCount = monthlyJobs.length;
    const totalCommissions = monthlyJobs.reduce((sum, o) => sum + getTechCommissionForOrder(o, technicianId), 0);

    const baseSalary = config.enableBaseSalary ? config.baseSalaryAmount : 0;
    const totalMonthlyEarnings = baseSalary + totalAttendanceAllowance + totalCommissions;

    // Generate daily logs
    const daysInMonth = new Date(parseInt(yearMonth.split('-')[0]), parseInt(yearMonth.split('-')[1]), 0).getDate();
    const dailyLogs: TechnicianDailyEarnings[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = `${yearMonth}-${d < 10 ? '0' + d : d}`;
      dailyLogs.push(getTechnicianDailyEarnings(technicianId, dayStr));
    }

    return {
      attendanceDays,
      totalAttendanceAllowance,
      completedJobsCount,
      totalCommissions,
      baseSalary,
      totalMonthlyEarnings,
      dailyLogs,
    };
  };

  return (
    <AppContext.Provider value={{
      companyProfile,
      updateCompanyProfile,
      resetCompanyProfile,
      isAuthenticated,
      currentUser,
      setCurrentUser,
      login,
      quickLoginAs,
      logout,
      registerUser,
      switchRole,
      users,
      addUser,
      updateUser,
      deleteUser,
      setUserAccountStatus,
      resetUserPassword,
      updateUserPermissions,
      lockAllUserSessions,
      updateTechnicianSalaryConfig,
      systemFeatureDefinitions,
      roleDefaultPermissions,
      updateRoleDefaultPermissions,
      resetPermissionsToDefaults,
      hasPermission,
      globalSalaryConfig,
      updateGlobalSalaryConfig,
      serviceCategories,
      addServiceCategory,
      updateServiceCategory,
      deleteServiceCategory,
      productPackages,
      addProductPackage,
      updateProductPackage,
      deleteProductPackage,
      acUnits,
      addACUnit,
      updateACUnit,
      deleteACUnit,
      serviceOrders,
      createServiceOrder,
      updateServiceOrder,
      deleteServiceOrder,
      assignTechnician,
      assignTechnicians,
      updateOrderStatus,
      completeTechnicianJob,
      verifyOrderPayment,
      updateTechnicalReport,
      deleteTechnicalReport,
      submitCustomerReview,
      inventory,
      addInventoryItem,
      updateInventoryItem,
      deleteInventoryItem,
      restockItem,
      inventoryTransactions,
      attendanceRecords,
      clockIn,
      clockOut,
      addAttendanceRecord,
      updateAttendanceRecord,
      deleteAttendanceRecord,
      financialTransactions,
      addFinancialExpense,
      addFinancialTransaction,
      updateFinancialTransaction,
      deleteFinancialTransaction,
      calculateCommissionForOrder,
      getTechnicianDailyEarnings,
      getTechnicianMonthlyEarnings,
      notification,
      showNotification,
      clearNotification,
      isCloudSynced,
      cloudSyncStatus,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
