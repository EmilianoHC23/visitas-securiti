import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Calendar, Building2 } from 'lucide-react';
import { LuClipboardPen } from 'react-icons/lu';
import * as api from '../../services/api';

interface CompanyInfo {
  name: string;
  logo?: string | null;
}

export const SelfRegistrationLandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCompanyInfo();
  }, []);

  const loadCompanyInfo = async () => {
    try {
      setLoading(true);
      const config = await api.getPublicCompanyConfig();
      setCompanyInfo({
        name: config.name || 'Empresa',
        logo: config.logo || null
      });
    } catch (err) {
      console.error('Error loading company info:', err);
      setError('No se pudo cargar la información de la empresa');
    } finally {
      setLoading(false);
    }
  };

  const handleVisitSelection = () => {
    navigate('/public/self-register/visit');
  };

  const handleEventSelection = () => {
    navigate('/public/self-register/events');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
              <p className="mt-4 text-gray-600">Cargando...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !companyInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border-2 border-gray-200">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Company Logo */}
        <div className="text-center mb-8">
          <div
            className="w-24 h-24 mx-auto mb-6 rounded-full ring-2 ring-gray-800"
            style={{ background: 'linear-gradient(135deg, #111827 0%, #374151 100%)' }}
          >
            <div className="w-full h-full rounded-full flex items-center justify-center overflow-hidden">
              {companyInfo?.logo ? (
                <img
                  src={companyInfo.logo}
                  alt={companyInfo.name}
                  className="w-16 h-16 object-contain"
                />
              ) : (
                <Building2 className="w-10 h-10 text-white" />
              )}
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Bienvenido a {companyInfo?.name || 'Nuestra Empresa'}
          </h1>
          <p className="text-xl text-gray-600">Comienza tu registro</p>
        </div>

        {/* Selection Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Visita Card */}
          <button
            onClick={handleVisitSelection}
            className="group bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-8 hover:border-gray-900 hover:shadow-2xl transition-all transform hover:scale-105"
          >
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-600 transition-colors">
              <LuClipboardPen className="w-8 h-8 text-blue-600 group-hover:text-white transition-colors" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Visita</h2>
            <p className="text-gray-600">
              Regístrate para una visita regular. Tu anfitrión será notificado de tu llegada.
            </p>
          </button>

          {/* Accesos/Eventos Card */}
          <button
            onClick={handleEventSelection}
            className="group bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-8 hover:border-gray-900 hover:shadow-2xl transition-all transform hover:scale-105"
          >
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-green-600 transition-colors">
              <Calendar className="w-8 h-8 text-green-600 group-hover:text-white transition-colors" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Accesos / Eventos</h2>
            <p className="text-gray-600">
              Pre-regístrate para un evento o acceso programado con invitación.
            </p>
          </button>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Selecciona una opción para continuar con tu registro
          </p>
        </div>
      </div>
    </div>
  );
};
