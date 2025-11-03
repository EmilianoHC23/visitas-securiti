
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { LoginPage } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { VisitsPage } from './pages/visits/VisitsPage';
import { AgendaPage } from './pages/visits/AgendaPage';
import { UserManagementPage } from './pages/users/UserManagementPage';
import ReportsPage from './pages/reports/ReportsPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { EmailTestPage } from './pages/settings/EmailTestPage';
import { AccessCodesPage } from './pages/access/AccessCodesPage';
import { BlacklistPage } from './pages/blacklist/BlacklistPage';
import { UserRole } from './types';
import { VisitorRegistrationPage } from './pages/register/VisitorRegistrationPage';
import { UserRegistrationPage } from './pages/register/UserRegistrationPage';
import { VisitConfirmationPage } from './pages/visits/VisitConfirmationPage';
import { RedeemPage } from './pages/redeem/RedeemPage';
import { PublicRegistrationPage } from './pages/public-registration/PublicRegistrationPage';
import { PublicLandingPage } from './pages/public/PublicLandingPage';
import { PublicVisitRegistrationPage } from './pages/public/PublicVisitRegistrationPage';
import { PublicAccessListPage } from './pages/public/PublicAccessListPage';
import PublicPreRegistrationPage from './pages/public/PublicPreRegistrationPage';
import RegistrationSuccessPage from './pages/public/RegistrationSuccessPage';
import { SelfRegistrationLandingPage } from './pages/public/SelfRegistrationLandingPage';
import { SelfRegisterVisitPage } from './pages/public/SelfRegisterVisitPage';
import { SelfRegisterSuccessPage } from './pages/public/SelfRegisterSuccessPage';
import { ToastProvider } from './components/common/Toast';

const PublicRegistrationWrapper: React.FC = () => {
    // qrCode route param is handled inside VisitorRegistrationPage if needed
    return <VisitorRegistrationPage />;
};


const AppRoutes: React.FC = () => {
    const { isAuthenticated, user, initializing } = useAuth();

    // Only block rendering while we're performing the initial auth check on app startup.
    if (initializing) {
        return <div className="flex justify-center items-center h-screen">Cargando...</div>;
    }

    if (!isAuthenticated) {
        return (
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<VisitorRegistrationPage />} />
                <Route path="/register/user" element={<UserRegistrationPage />} />
                <Route path="/visit-confirmation" element={<VisitConfirmationPage />} />
                <Route path="/redeem/:accessCode" element={<RedeemPage />} />
                <Route path="/public/:qrCode" element={<PublicRegistrationWrapper />} />
                {/* Rutas públicas de auto-registro */}
                <Route path="/public" element={<PublicLandingPage />} />
                <Route path="/public/visit-registration" element={<PublicVisitRegistrationPage />} />
                <Route path="/public/access-list" element={<PublicAccessListPage />} />
                <Route path="/public/register/:accessId" element={<PublicPreRegistrationPage />} />
                <Route path="/public/registration-success/:accessId" element={<RegistrationSuccessPage />} />
                {/* Rutas de self-registration con QR */}
                <Route path="/public/self-register" element={<SelfRegistrationLandingPage />} />
                <Route path="/public/self-register/visit" element={<SelfRegisterVisitPage />} />
                <Route path="/public/self-register/success" element={<SelfRegisterSuccessPage />} />
                <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
        );
    }
    
    return (
        <DashboardLayout>
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/visits" element={<VisitsPage />} />
                <Route path="/agenda" element={<AgendaPage />} />
                
                {(user?.role === UserRole.ADMIN || user?.role === UserRole.RECEPTION) && (
                    <>
                        <Route path="/access-codes" element={<AccessCodesPage />} />
                        <Route path="/public-registration" element={<PublicRegistrationPage />} />
                        <Route path="/blacklist" element={<BlacklistPage />} />
                    </>
                )}
                
                {user?.role === UserRole.ADMIN && (
                    <>
                        <Route path="/users" element={<UserManagementPage />} />
                        <Route path="/reports" element={<ReportsPage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="/settings/email-test" element={<EmailTestPage />} />
                    </>
                )}
                
                {/* Public routes available to authenticated users */}
                <Route path="/register" element={<VisitorRegistrationPage />} />
                <Route path="/public/:qrCode" element={<PublicRegistrationWrapper />} />
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </DashboardLayout>
    );
};

const App: React.FC = () => {
  return (
        <AuthProvider>
            <ToastProvider>
                <BrowserRouter>
                    <AppRoutes />
                </BrowserRouter>
            </ToastProvider>
        </AuthProvider>
  );
};

export default App;