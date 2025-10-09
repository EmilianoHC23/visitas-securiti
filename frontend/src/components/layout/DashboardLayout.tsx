
import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    return (
        <div className="container-fluid min-vh-100 d-flex flex-column p-0 bg-light" style={{ height: '100vh' }}>
            <Header sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed} />
            <div className="d-flex flex-row flex-grow-1 min-vh-0" style={{ flex: 1, minHeight: 0 }}>
                <Sidebar collapsed={sidebarCollapsed} />
                <main
                    className="flex-grow-1 p-4 bg-light"
                    style={{ overflowY: 'auto', height: '100%', maxHeight: '100%' }}
                >
                    {children}
                </main>
            </div>
        </div>
    );
};
