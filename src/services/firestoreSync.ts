import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
  query,
  limit,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  User,
  ServiceOrder,
  InventoryItem,
  InventoryTransaction,
  AttendanceRecord,
  FinancialTransaction,
  CompanyProfile,
  ServiceCategory,
  ProductPackage,
  ACUnit,
  RoleDefaultPermissions,
  SalaryConfig,
} from '../types';

// Collections mapping
export const COLLECTIONS = {
  USERS: 'users',
  SERVICE_ORDERS: 'serviceOrders',
  INVENTORY: 'inventory',
  INVENTORY_TRX: 'inventoryTransactions',
  ATTENDANCE: 'attendanceRecords',
  FINANCE: 'financialTransactions',
  COMPANY_PROFILE: 'companyProfile',
  CATEGORIES: 'serviceCategories',
  PACKAGES: 'productPackages',
  AC_UNITS: 'acUnits',
  SYSTEM_SETTINGS: 'systemSettings',
};

// Helper to sanitize data for Firestore: recursively removes undefined fields and converts them safely
export function cleanForFirestore<T>(data: T): T {
  if (data === undefined) {
    return undefined as any;
  }
  if (data === null) {
    return null as any;
  }
  if (Array.isArray(data)) {
    return data
      .map(item => cleanForFirestore(item))
      .filter(item => item !== undefined) as any;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        const cleanedValue = cleanForFirestore(value);
        if (cleanedValue !== undefined) {
          cleaned[key] = cleanedValue;
        }
      }
    }
    return cleaned as T;
  }
  return data;
}

// Seed initial data if Firestore database is empty
export async function seedInitialDataIfEmpty(initialData: {
  users: User[];
  serviceOrders: ServiceOrder[];
  inventory: InventoryItem[];
  inventoryTransactions: InventoryTransaction[];
  attendanceRecords: AttendanceRecord[];
  financialTransactions: FinancialTransaction[];
  companyProfile: CompanyProfile;
  serviceCategories: ServiceCategory[];
  productPackages: ProductPackage[];
  acUnits: ACUnit[];
  roleDefaultPermissions: RoleDefaultPermissions;
  globalSalaryConfig: SalaryConfig;
}): Promise<void> {
  try {
    const ordersSnap = await getDocs(query(collection(db, COLLECTIONS.SERVICE_ORDERS), limit(1)));
    if (!ordersSnap.empty) {
      // Data already seeded
      return;
    }

    console.log('⚡ Initializing Firestore cloud database with initial starter data...');
    const batch = writeBatch(db);

    // 1. Company Profile
    batch.set(doc(db, COLLECTIONS.COMPANY_PROFILE, 'default'), cleanForFirestore(initialData.companyProfile));

    // 2. System Settings
    batch.set(doc(db, COLLECTIONS.SYSTEM_SETTINGS, 'permissions'), cleanForFirestore({ value: initialData.roleDefaultPermissions }));
    batch.set(doc(db, COLLECTIONS.SYSTEM_SETTINGS, 'salaryConfig'), cleanForFirestore({ value: initialData.globalSalaryConfig }));

    // 3. Users
    initialData.users.forEach(u => {
      batch.set(doc(db, COLLECTIONS.USERS, u.id), cleanForFirestore(u));
    });

    // 4. Service Categories
    initialData.serviceCategories.forEach(c => {
      batch.set(doc(db, COLLECTIONS.CATEGORIES, c.id), cleanForFirestore(c));
    });

    // 5. Product Packages
    initialData.productPackages.forEach(p => {
      batch.set(doc(db, COLLECTIONS.PACKAGES, p.id), cleanForFirestore(p));
    });

    // 6. AC Units
    initialData.acUnits.forEach(u => {
      batch.set(doc(db, COLLECTIONS.AC_UNITS, u.id), cleanForFirestore(u));
    });

    // 7. Inventory Items
    initialData.inventory.forEach(item => {
      batch.set(doc(db, COLLECTIONS.INVENTORY, item.id), cleanForFirestore(item));
    });

    // 8. Inventory Transactions
    initialData.inventoryTransactions.forEach(trx => {
      batch.set(doc(db, COLLECTIONS.INVENTORY_TRX, trx.id), cleanForFirestore(trx));
    });

    // 9. Attendance
    initialData.attendanceRecords.forEach(att => {
      batch.set(doc(db, COLLECTIONS.ATTENDANCE, att.id), cleanForFirestore(att));
    });

    // 10. Finance
    initialData.financialTransactions.forEach(fin => {
      batch.set(doc(db, COLLECTIONS.FINANCE, fin.id), cleanForFirestore(fin));
    });

    // 11. Service Orders
    initialData.serviceOrders.forEach(o => {
      batch.set(doc(db, COLLECTIONS.SERVICE_ORDERS, o.id), cleanForFirestore(o));
    });

    await batch.commit();
    console.log('✅ Firestore cloud database successfully seeded & synchronized!');
  } catch (error) {
    console.error('Error seeding initial Firestore data:', error);
  }
}

// ----------------- REAL-TIME SUBSCRIBERS -----------------

export function subscribeToCompanyProfile(onUpdate: (profile: CompanyProfile) => void) {
  const profileDoc = doc(db, COLLECTIONS.COMPANY_PROFILE, 'default');
  return onSnapshot(
    profileDoc,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as CompanyProfile);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, COLLECTIONS.COMPANY_PROFILE);
    }
  );
}

export function subscribeToCollection<T>(
  collectionName: string,
  onUpdate: (items: T[]) => void
) {
  const colRef = collection(db, collectionName);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items = snapshot.docs.map((docSnap) => docSnap.data() as T);
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, collectionName);
    }
  );
}

export function subscribeToSystemSettings(
  onUpdatePerms: (perms: RoleDefaultPermissions) => void,
  onUpdateSalary: (config: SalaryConfig) => void
) {
  const permsDoc = doc(db, COLLECTIONS.SYSTEM_SETTINGS, 'permissions');
  const salaryDoc = doc(db, COLLECTIONS.SYSTEM_SETTINGS, 'salaryConfig');

  const unsub1 = onSnapshot(
    permsDoc,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data?.value) onUpdatePerms(data.value);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'systemSettings/permissions');
    }
  );

  const unsub2 = onSnapshot(
    salaryDoc,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data?.value) onUpdateSalary(data.value);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'systemSettings/salaryConfig');
    }
  );

  return () => {
    unsub1();
    unsub2();
  };
}

// ----------------- WRITE OPERATIONS -----------------

export async function saveCompanyProfileCloud(profile: CompanyProfile) {
  try {
    const cleaned = cleanForFirestore(profile);
    await setDoc(doc(db, COLLECTIONS.COMPANY_PROFILE, 'default'), cleaned, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'companyProfile/default');
  }
}

export async function saveSystemSettingCloud(settingId: string, value: any) {
  try {
    const cleaned = cleanForFirestore({ value });
    await setDoc(doc(db, COLLECTIONS.SYSTEM_SETTINGS, settingId), cleaned, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `systemSettings/${settingId}`);
  }
}

export async function saveDocCloud<T extends { id: string }>(collectionName: string, item: T) {
  try {
    const cleaned = cleanForFirestore(item);
    await setDoc(doc(db, collectionName, item.id), cleaned, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${collectionName}/${item.id}`);
  }
}

export async function updateDocCloud(collectionName: string, id: string, updates: Record<string, any>) {
  try {
    const cleaned = cleanForFirestore(updates);
    await updateDoc(doc(db, collectionName, id), cleaned);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${collectionName}/${id}`);
  }
}

export async function deleteDocCloud(collectionName: string, id: string) {
  try {
    await deleteDoc(doc(db, collectionName, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${collectionName}/${id}`);
  }
}
