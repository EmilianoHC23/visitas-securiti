
import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Detectar si estamos en móvil
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Cerrar el menú móvil cuando la pantalla se hace más grande
    useEffect(() => {
        if (!isMobile) {
            setMobileMenuOpen(false);
        }
    }, [isMobile]);

    // Prevenir scroll del body cuando el menú móvil está abierto
    useEffect(() => {
        if (mobileMenuOpen && isMobile) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        
        return () => {
            document.body.style.overflow = '';
        };
    }, [mobileMenuOpen, isMobile]);

    const handleToggleSidebar = () => {
        if (isMobile) {
            setMobileMenuOpen(!mobileMenuOpen);
        } else {
            setSidebarCollapsed(!sidebarCollapsed);
        }
    };

    const closeMobileMenu = () => {
        if (isMobile) {
            setMobileMenuOpen(false);
        }
    };

    return (
        <div className="container-fluid min-vh-100 d-flex p-0 bg-light" style={{ height: '100vh', position: 'relative' }}>
            {/* Backdrop para móvil */}
            {isMobile && mobileMenuOpen && (
                <div
                    onClick={closeMobileMenu}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        zIndex: 1040,
                        transition: 'opacity 0.3s ease',
                    }}
                />
            )}

            {/* Sidebar */}
            <Sidebar 
                collapsed={sidebarCollapsed} 
                isMobile={isMobile}
                mobileMenuOpen={mobileMenuOpen}
                onCloseMobile={closeMobileMenu}
            />

            {/* Right column: Header on top, content below */}
            <div 
                className="d-flex flex-column flex-grow-1 min-vh-0 min-w-0" 
                style={{ 
                    flex: 1, 
                    minHeight: 0, 
                    overflowX: 'hidden',
                    width: isMobile ? '100%' : undefined,
                    marginLeft: isMobile ? 0 : undefined
                }}
            >
                <Header 
                    sidebarCollapsed={sidebarCollapsed} 
                    setSidebarCollapsed={handleToggleSidebar}
                    isMobile={isMobile}
                    mobileMenuOpen={mobileMenuOpen}
                />
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
