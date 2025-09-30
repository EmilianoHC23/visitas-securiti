import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import * as api from '../../services/api';

interface PublicRegistrationPageProps {
  qrCode?: string;
}

export const PublicRegistrationPage: React.FC<PublicRegistrationPageProps> = ({ qrCode }) => {
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [hosts, setHosts] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    visitorName: '',
    visitorCompany: '',
    visitorEmail: '',
    visitorPhone: '',
    hostId: '',
    reason: '',
    visitorPhoto: ''
  });

  useEffect(() => {
    if (qrCode) {
      loadCompanyInfo();
    }
  }, [qrCode]);

  const loadCompanyInfo = async () => {
    if (!qrCode) return;

    try {
      setLoading(true);
      const [company, hostsList] = await Promise.all([
        api.getPublicCompanyInfo(qrCode),
        api.getPublicHosts(qrCode) // This will need the companyId
      ]);
      
      setCompanyInfo(company);
      setHosts(hostsList);
    } catch (error) {
      console.error('Error loading company info:', error);
      alert('Error al cargar la información de la empresa');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyInfo) return;

    try {
      setSubmitting(true);
      await api.submitPublicVisit({
        companyId: companyInfo._id,
        ...formData
      });
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting visit:', error);
      alert('Error al registrar la visita. Por favor intente nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!qrCode) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Código QR Requerido</h2>
          <p className="text-gray-600">
            Esta página requiere un código QR válido para registrar su visita.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando información...</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">¡Visita Registrada!</h2>
          <p className="text-gray-600 mb-6">
            Su visita ha sido registrada exitosamente. El anfitrión será notificado de su llegada.
          </p>
          <div className="text-sm text-gray-500">
            <p><strong>Empresa:</strong> {companyInfo?.name}</p>
            <p><strong>Visitante:</strong> {formData.visitorName}</p>
            <p><strong>Anfitrión:</strong> {hosts.find(h => h._id === formData.hostId)?.name}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!companyInfo) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Código QR Inválido</h2>
          <p className="text-gray-600">
            El código QR proporcionado no es válido o ha expirado.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full">
        {/* Header */}
        <div className="bg-blue-600 text-white p-6 rounded-t-lg">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Registro de Visitantes</h1>
            <p className="text-blue-100">{companyInfo.name}</p>
          </div>
        </div>

        {/* Form */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información del Visitante */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Información del Visitante</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    value={formData.visitorName}
                    onChange={(e) => handleInputChange('visitorName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Empresa/Organización
                  </label>
                  <input
                    type="text"
                    value={formData.visitorCompany}
                    onChange={(e) => handleInputChange('visitorCompany', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.visitorEmail}
                    onChange={(e) => handleInputChange('visitorEmail', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={formData.visitorPhone}
                    onChange={(e) => handleInputChange('visitorPhone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Información de la Visita */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Información de la Visita</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Persona a Visitar *
                  </label>
                  <select
                    value={formData.hostId}
                    onChange={(e) => handleInputChange('hostId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleccione una persona</option>
                    {hosts.map((host) => (
                      <option key={host._id} value={host._id}>
                        {host.name} - {host.department || 'Sin departamento'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motivo de la Visita *
                  </label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) => handleInputChange('reason', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Breve descripción del motivo de su visita"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Políticas y Términos */}
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="text-sm font-semibold text-gray-800 mb-2">Políticas de Visitantes</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Debe portar identificación oficial durante su permanencia</li>
                <li>• Siga las instrucciones del personal de seguridad</li>
                <li>• Registre su salida al finalizar la visita</li>
                <li>• Respete las políticas de confidencialidad de la empresa</li>
              </ul>
            </div>

            {/* Submit */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Registrando Visita...' : 'Registrar Visita'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};