
import React from 'react';
import { HashRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { LoginPage } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { VisitsPage } from './pages/visits/VisitsPage';
import { UserManagementPage } from './pages/users/UserManagementPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { CompanyConfigPage } from './pages/settings/CompanyConfigPage';
import { AccessCodesPage } from './pages/access/AccessCodesPage';
import { BlacklistPage } from './pages/blacklist/BlacklistPage';
import { UserRole } from './types';
import { VisitorRegistrationPage } from './pages/register/VisitorRegistrationPage';
import { UserRegistrationPage } from './pages/register/UserRegistrationPage';
import { RedeemPage } from './pages/redeem/RedeemPage';

const PublicRegistrationWrapper: React.FC = () => {
    const { qrCode } = useParams<{ qrCode: string }>();
    return <VisitorRegistrationPage accessCode={qrCode} />;
};


const AppRoutes: React.FC = () => {
    const { isAuthenticated, user, loading } = useAuth();
    
    if (loading) {
        return <div className="flex justify-center items-center h-screen">Cargando...</div>;
    }

    if (!isAuthenticated) {
        return (
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<VisitorRegistrationPage />} />
                <Route path="/register/user" element={<UserRegistrationPage />} />
                <Route path="/redeem/:accessCode" element={<RedeemPage />} />
                <Route path="/public/:qrCode" element={<PublicRegistrationWrapper />} />
                <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
        );
    }
    
    return (
        <DashboardLayout>
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/visits" element={<VisitsPage />} />
                
                {(user?.role === UserRole.ADMIN || user?.role === UserRole.RECEPTION) && (
                    <>
                        <Route path="/access-codes" element={<AccessCodesPage />} />
                        <Route path="/blacklist" element={<BlacklistPage />} />
                    </>
                )}
                
                {user?.role === UserRole.ADMIN && (
                    <>
                        <Route path="/users" element={<UserManagementPage />} />
                        <Route path="/reports" element={<ReportsPage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="/settings/company" element={<CompanyConfigPage />} />
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
        <HashRouter>
            <AppRoutes />
        </HashRouter>
    </AuthProvider>
  );
};

export default App;