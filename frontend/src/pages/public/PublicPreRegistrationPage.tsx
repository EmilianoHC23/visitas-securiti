import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, Mail, Phone, Building2, User, CheckCircle } from 'lucide-react';

const isDevelopment = import.meta.env.VITE_ENVIRONMENT === 'development';
const API_BASE_URL = isDevelopment 
  ? import.meta.env.VITE_API_URL || 'http://localhost:3001'
  : ''; // Ruta relativa en producción (sin /api, se agrega abajo)

interface AccessInfo {
  _id: string;
  eventName: string;
  type: string;
  startDate: string;
  endDate: string;
  location?: string;
  eventImage?: string;
  additionalInfo?: string;
  status: string;
  settings: {
    enablePreRegistration?: boolean;
  };
}

const PublicPreRegistrationPage: React.FC = () => {
  const { accessId } = useParams<{ accessId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [access, setAccess] = useState<AccessInfo | null>(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: ''
  });

  useEffect(() => {
    loadAccessInfo();
  }, [accessId]);

  const loadAccessInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/access/${accessId}/public-info`);
      
      if (!response.ok) {
        throw new Error('Failed to load access info');
      }
      
      const data = await response.json();
      
      if (!data.settings?.enablePreRegistration) {
        setError('Este acceso no permite pre-registro público');
        return;
      }
      
      if (data.status !== 'active') {
        setError('Este acceso ya no está disponible');
        return;
      }

      setAccess(data);
    } catch (err) {
      console.error('Error loading access:', err);
      setError('No se pudo cargar la información del acceso');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || (!formData.email && !formData.phone)) {
      setError('Por favor completa al menos nombre y email o teléfono');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const response = await fetch(`${API_BASE_URL}/api/access/${accessId}/pre-register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al registrar');
      }

      const data = await response.json();
      
      // Redirect to confirmation page with registration data
      navigate(`/public/registration-success/${accessId}`, { 
        state: { 
          qrCode: data.qrCode,
          invitedUser: data.invitedUser,
          accessInfo: access
        } 
      });
    } catch (err: any) {
      console.error('Error submitting registration:', err);
      setError(err.message || 'Error al registrar. Por favor intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      reunion: 'Reunión',
      proyecto: 'Proyecto',
      evento: 'Evento',
      visita: 'Visita',
      otro: 'Otro'
    };
    return labels[type] || 'Otro';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando información...</p>
        </div>
      </div>
    );
  }

  if (error && !access) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso no disponible</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
          {access?.eventImage && (
            <img 
              src={access.eventImage} 
              alt={access.eventName}
              className="w-full h-48 object-cover"
            />
          )}
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{access?.eventName}</h1>
                <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                  {access && getTypeLabel(access.type)}
                </span>
              </div>
            </div>

            <div className="space-y-3 mt-6">
              <div className="flex items-center text-gray-700">
                <Calendar className="w-5 h-5 mr-3 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">Fecha y hora de inicio</p>
                  <p className="text-sm">
                    {access && new Date(access.startDate).toLocaleString('es-MX', {
                      dateStyle: 'long',
                      timeStyle: 'short'
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center text-gray-700">
                <Clock className="w-5 h-5 mr-3 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">Fecha y hora de fin</p>
                  <p className="text-sm">
                    {access && new Date(access.endDate).toLocaleString('es-MX', {
                      dateStyle: 'long',
                      timeStyle: 'short'
                    })}
                  </p>
                </div>
              </div>

              {access?.location && (
                <div className="flex items-center text-gray-700">
                  <MapPin className="w-5 h-5 mr-3 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Ubicación</p>
                    <p className="text-sm">{access.location}</p>
                  </div>
                </div>
              )}

              {access?.additionalInfo && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-1">Información adicional</p>
                  <p className="text-sm text-gray-600">{access.additionalInfo}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Registration Form */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Registra tu asistencia</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Nombre completo *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="Tu nombre completo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-2" />
                Teléfono
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="+52 123 456 7890"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building2 className="w-4 h-4 inline mr-2" />
                Empresa (opcional)
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="Nombre de tu empresa"
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-lg hover:shadow-xl"
              >
                {submitting ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Registrando...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Confirmar registro
                  </span>
                )}
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              * Al menos debes proporcionar nombre y email o teléfono
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PublicPreRegistrationPage;
