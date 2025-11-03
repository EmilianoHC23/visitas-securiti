import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Building2, Home } from 'lucide-react';
import * as api from '../../services/api';

interface CompanyInfo {
  name: string;
  logo?: string | null;
}

export const SelfRegisterSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);

  useEffect(() => {
    loadCompanyInfo();
  }, []);

  const loadCompanyInfo = async () => {
    try {
      const config = await api.getPublicCompanyConfig();
      setCompanyInfo({
        name: config.name || 'Empresa',
        logo: config.logo || null
      });
    } catch (err) {
      console.error('Error loading company info:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Company Logo */}
        <div className="text-center mb-8">
          {companyInfo?.logo ? (
            <img
              src={companyInfo.logo}
              alt={companyInfo.name}
              className="h-16 w-auto mx-auto object-contain"
            />
          ) : (
            <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto">
              <Building2 className="w-8 h-8 text-white" />
            </div>
          )}
        </div>

        {/* Success Card */}
        <div className="bg-white rounded-2xl shadow-2xl border-2 border-green-200 overflow-hidden">
          <div className="p-8 sm:p-10 text-center">
            {/* Success Icon */}
            <div className="mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              ¡Registro completado!
            </h1>

            {/* Message */}
            <p className="text-gray-600 text-lg mb-6">
              Tu visita ha sido registrada exitosamente.
            </p>

            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-8">
              <p className="text-green-800 font-semibold">
                Tu anfitrión ha sido notificado de tu llegada
              </p>
            </div>

            {/* Instructions */}
            <div className="text-left bg-gray-50 rounded-xl p-5 mb-8 border-2 border-gray-200">
              <h3 className="font-bold text-gray-900 mb-3 text-center">Próximos pasos:</h3>
              <ul className="space-y-2 text-gray-700 text-sm">
                <li className="flex items-start">
                  <span className="inline-block w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0 mt-0.5">1</span>
                  <span>Por favor espera en la recepción</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0 mt-0.5">2</span>
                  <span>El personal de recepción completará tu ingreso</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0 mt-0.5">3</span>
                  <span>Tu anfitrión será notificado cuando ingreses</span>
                </li>
              </ul>
            </div>

            {/* Action Button */}
            <button
              onClick={() => navigate('/public/self-register')}
              className="w-full px-6 py-4 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all font-bold shadow-xl hover:shadow-2xl flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              Volver al inicio
            </button>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-gray-600 text-sm mt-6">
          Gracias por registrar tu visita con {companyInfo?.name || 'nosotros'}
        </p>
      </div>
    </div>
  );
};
