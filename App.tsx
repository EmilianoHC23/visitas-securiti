
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { LoginPage } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { VisitsPage } from './pages/visits/VisitsPage';
import { UserManagementPage } from './pages/users/UserManagementPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { UserRole } from './types';
import { VisitorRegistrationPage } from './pages/register/VisitorRegistrationPage';


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
                <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
        );
    }
    
    return (
        <DashboardLayout>
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/visits" element={<VisitsPage />} />
                
                {user?.role === UserRole.ADMIN && (
                    <>
                        <Route path="/users" element={<UserManagementPage />} />
                        <Route path="/reports" element={<ReportsPage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                    </>
                )}
                {/*  The register route is also available for logged in users, maybe for testing */}
                <Route path="/register" element={<VisitorRegistrationPage />} />
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