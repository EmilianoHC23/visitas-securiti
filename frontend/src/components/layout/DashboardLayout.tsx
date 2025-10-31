
import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    return (
        <div className="container-fluid min-vh-100 d-flex p-0 bg-light" style={{ height: '100vh' }}>
            {/* Left column: Sidebar full height */}
            <Sidebar collapsed={sidebarCollapsed} />

            {/* Right column: Header on top, content below */}
            <div className="d-flex flex-column flex-grow-1 min-vh-0 min-w-0" style={{ flex: 1, minHeight: 0, overflowX: 'hidden' }}>
                <Header sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed} />
                <main
                    className="flex-grow-1 p-4 bg-light min-w-0"
                    style={{ overflowY: 'auto', height: '100%', maxHeight: '100%', overflowX: 'hidden' }}
                >
                    {children}
                </main>
            </div>
        </div>
    );
};
