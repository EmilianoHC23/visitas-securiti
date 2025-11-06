import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, ArrowLeft, Building2, ChevronRight } from 'lucide-react';
import * as api from '../../services/api';

interface CompanyInfo {
  name: string;
  logo?: string | null;
}

interface AccessEvent {
  _id: string;
  eventName: string;
  location?: string;
  eventImage?: string;
  startDate: string;
  endDate: string;
  creatorId?: {
    firstName: string;
    lastName: string;
  };
  settings?: {
    enablePreRegistration?: boolean;
  };
}

export const SelfRegisterEventListPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [accesses, setAccesses] = useState<AccessEvent[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [config, accessesData] = await Promise.all([
        api.getPublicCompanyConfig(),
        api.getActiveAccesses()
      ]);
      
      setCompanyInfo({
        name: config.name || 'Empresa',
        logo: config.logo || null
      });
      
      // Filtrar solo accesos con pre-registro habilitado
      const filteredAccesses = accessesData.filter((access: any) => access.settings?.enablePreRegistration === true);
      setAccesses(filteredAccesses as any);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('No se pudo cargar la información');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAccess = (accessId: string) => {
    navigate(`/public/self-register/event/${accessId}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Cargando eventos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/public/self-register')}
              className="px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-semibold"
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/public/self-register')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver
          </button>

          <div className="text-center mb-6">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full ring-2 ring-gray-800" style={{ background: 'linear-gradient(135deg, #111827 0%, #374151 100%)' }}>
              <div className="w-full h-full rounded-full flex items-center justify-center overflow-hidden">
                {companyInfo?.logo ? (
                  <img
                    src={companyInfo.logo}
                    alt={companyInfo.name}
                    className="w-16 h-16 object-contain"
                  />
                ) : (
                  <Building2 className="w-8 h-8 text-white" />
                )}
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Selecciona a dónde te diriges</h1>
            <p className="text-gray-600 mt-2">Elige el evento o acceso al que deseas asistir</p>
          </div>
        </div>

        {/* Lista de Accesos/Eventos */}
        <div className="space-y-4">
          {accesses.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-8 text-center">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No hay eventos disponibles</h3>
              <p className="text-gray-600 mb-6">Actualmente no hay eventos o accesos con pre-registro abierto</p>
              <button
                onClick={() => navigate('/public/self-register')}
                className="px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-semibold"
              >
                Volver al inicio
              </button>
            </div>
          ) : (
            accesses.map((access) => (
              <button
                key={access._id}
                onClick={() => handleSelectAccess(access._id)}
                className="w-full bg-white rounded-2xl shadow-xl border-2 border-gray-200 overflow-hidden hover:border-gray-900 hover:shadow-2xl transition-all group"
              >
                <div className="flex flex-col sm:flex-row">
                  {/* Imagen del evento */}
                  <div className="sm:w-48 h-48 sm:h-auto bg-gray-100 flex-shrink-0 overflow-hidden">
                    {access.eventImage ? (
                      <img
                        src={access.eventImage}
                        alt={access.eventName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                        <Calendar className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Información del evento */}
                  <div className="flex-1 p-6 text-left">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-gray-700 transition-colors">
                        {access.eventName}
                      </h3>
                      <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-gray-900 group-hover:translate-x-1 transition-all flex-shrink-0 ml-2" />
                    </div>

                    <div className="space-y-2">
                      {/* Fecha */}
                      <div className="flex items-center text-gray-600">
                        <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="text-sm">
                          {formatDate(access.startDate)}
                          {access.endDate && access.endDate !== access.startDate && ` - ${formatDate(access.endDate)}`}
                        </span>
                      </div>

                      {/* Ubicación */}
                      {access.location && (
                        <div className="flex items-center text-gray-600">
                          <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span className="text-sm">{access.location}</span>
                        </div>
                      )}

                      {/* Anfitrión */}
                      <div className="flex items-center text-gray-600">
                        <Users className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="text-sm">
                          Anfitrión: {access.creatorId.firstName} {access.creatorId.lastName}
                        </span>
                      </div>
                    </div>

                    {/* Badge de disponible */}
                    <div className="mt-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                        Pre-registro disponible
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
