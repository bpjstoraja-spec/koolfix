import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { NotificationToast } from './components/common/NotificationToast';
import { CustomerBookingModal } from './components/services/CustomerBookingModal';
import { ServiceOrderDetailModal } from './components/services/ServiceOrderDetailModal';
import { DashboardView } from './components/dashboard/DashboardView';
import { ServiceOrdersList } from './components/services/ServiceOrdersList';
import { InventoryManager } from './components/inventory/InventoryManager';
import { PayrollManager } from './components/payroll/PayrollManager';
import { TechnicianEarningsView } from './components/payroll/TechnicianEarningsView';
import { AttendanceView } from './components/attendance/AttendanceView';
import { FinancialReportsView } from './components/finance/FinancialReportsView';
import { AccountManager } from './components/accounts/AccountManager';
import { FeatureControlManager } from './components/permissions/FeatureControlManager';
import { ProductManager } from './components/products/ProductManager';
import { LoginView } from './components/auth/LoginView';
import { AccessDeniedNotice } from './components/common/AccessDeniedNotice';
import { CompanyProfileModal } from './components/settings/CompanyProfileModal';
import { UserProfileModal } from './components/common/UserProfileModal';
import { MobileBottomNav } from './components/common/MobileBottomNav';

const AppContent: React.FC = () => {
  const { isAuthenticated, currentUser, serviceOrders, hasPermission } = useApp();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [showBookingModal, setShowBookingModal] = useState<boolean>(false);
  const [showCompanyProfileModal, setShowCompanyProfileModal] = useState<boolean>(false);
  const [showUserProfileModal, setShowUserProfileModal] = useState<boolean>(false);
  const [selectedOrderIdForDetail, setSelectedOrderIdForDetail] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Every time authentication state changes or a user logs in / out, default to Home / Dashboard view
  useEffect(() => {
    setActiveTab('dashboard');
  }, [isAuthenticated, currentUser?.id]);

  // If not authenticated, show the authentication/login portal
  if (!isAuthenticated) {
    return (
      <>
        <LoginView />
        <NotificationToast />
      </>
    );
  }

  const selectedOrder = serviceOrders.find(o => o.id === selectedOrderIdForDetail);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'feature_control':
        if (!hasPermission('feature_control_manage')) {
          return <AccessDeniedNotice featureId="feature_control_manage" onGoBack={() => setActiveTab('dashboard')} />;
        }
        return <FeatureControlManager />;

      case 'dashboard':
        if (!hasPermission('dashboard_view')) {
          return <AccessDeniedNotice featureId="dashboard_view" onGoBack={() => setActiveTab('services')} />;
        }
        return (
          <DashboardView
            onNavigateTab={tab => setActiveTab(tab)}
            onOpenBookingModal={() => setShowBookingModal(true)}
            onOpenJobDetail={orderId => setSelectedOrderIdForDetail(orderId)}
          />
        );

      case 'services':
        if (!hasPermission('services_view')) {
          return <AccessDeniedNotice featureId="services_view" onGoBack={() => setActiveTab('dashboard')} />;
        }
        return (
          <ServiceOrdersList
            onOpenBookingModal={() => setShowBookingModal(true)}
          />
        );

      case 'products':
        if (!hasPermission('products_view') && currentUser.role !== 'SUPER_ADMIN') {
          return <AccessDeniedNotice featureId="products_view" onGoBack={() => setActiveTab('dashboard')} />;
        }
        return <ProductManager />;

      case 'inventory':
        if (!hasPermission('inventory_view')) {
          return <AccessDeniedNotice featureId="inventory_view" onGoBack={() => setActiveTab('dashboard')} />;
        }
        return <InventoryManager />;

      case 'payroll':
        if (!hasPermission('payroll_manage')) {
          return <AccessDeniedNotice featureId="payroll_manage" onGoBack={() => setActiveTab('dashboard')} />;
        }
        return <PayrollManager />;

      case 'technician_earnings':
        if (!hasPermission('technician_earnings_view')) {
          return <AccessDeniedNotice featureId="technician_earnings_view" onGoBack={() => setActiveTab('dashboard')} />;
        }
        return <TechnicianEarningsView />;

      case 'attendance':
        if (!hasPermission('attendance_view') && !hasPermission('attendance_clockin')) {
          return <AccessDeniedNotice featureId="attendance_view" onGoBack={() => setActiveTab('dashboard')} />;
        }
        return <AttendanceView />;

      case 'finance':
        if (!hasPermission('finance_reports')) {
          return <AccessDeniedNotice featureId="finance_reports" onGoBack={() => setActiveTab('dashboard')} />;
        }
        return <FinancialReportsView />;

      case 'accounts':
        if (!hasPermission('accounts_view')) {
          return <AccessDeniedNotice featureId="accounts_view" onGoBack={() => setActiveTab('dashboard')} />;
        }
        return (
          <AccountManager 
            onNavigateToPermissions={() => setActiveTab('feature_control')} 
          />
        );

      default:
        return (
          <DashboardView
            onNavigateTab={tab => setActiveTab(tab)}
            onOpenBookingModal={() => setShowBookingModal(true)}
            onOpenJobDetail={orderId => setSelectedOrderIdForDetail(orderId)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col font-sans antialiased selection:bg-cyan-500 selection:text-black">
      {/* Top Header */}
      <Header 
        onOpenBookingModal={() => setShowBookingModal(true)} 
        onNavigateToPermissions={() => setActiveTab('feature_control')}
        onOpenCompanyProfile={() => setShowCompanyProfileModal(true)}
        onOpenUserProfile={() => setShowUserProfileModal(true)}
        onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
      />

      {/* Main App Container */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8 gap-4 sm:gap-8 pb-24 lg:pb-8">
        {/* Sidebar Navigation */}
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onOpenBookingModal={() => setShowBookingModal(true)} 
          onOpenCompanyProfile={() => setShowCompanyProfileModal(true)}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Dynamic Main Content Area */}
        <main className="flex-1 min-w-0 transition-all duration-200">
          {renderActiveView()}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        onOpenBookingModal={() => setShowBookingModal(true)}
      />

      {/* Footer banner */}
      <footer className="hidden lg:block py-4 border-t border-white/10 bg-[#0A0A0A] text-center text-xs text-white/40">
        <p className="font-bold text-white/70 uppercase tracking-widest text-[10px]">
          KOOLFIX ENTERPRISE RBAC • SISTEM MANAJEMEN SERVIS AC & KONTROL HAK AKSES
        </p>
        <p className="text-[10px] text-white/30 mt-0.5">
          Dikontrol Terpusat oleh Super Admin: Hak Akses Seluruh Fitur untuk Anggota, Admin, Teknisi, & Pelanggan
        </p>
      </footer>

      {/* Global Notifications */}
      <NotificationToast />

      {/* Super Admin Company Profile Modal */}
      <CompanyProfileModal 
        isOpen={showCompanyProfileModal} 
        onClose={() => setShowCompanyProfileModal(false)} 
      />

      {/* User Profile & Avatar Upload Modal */}
      <UserProfileModal
        isOpen={showUserProfileModal}
        onClose={() => setShowUserProfileModal(false)}
      />

      {/* Customer Booking Modal */}
      {showBookingModal && (
        <CustomerBookingModal onClose={() => setShowBookingModal(false)} />
      )}

      {/* Service Order Detail Modal */}
      {selectedOrder && (
        <ServiceOrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrderIdForDetail(null)}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
