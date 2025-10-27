import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Download, Mail, Calendar, MapPin } from 'lucide-react';

const RegistrationSuccessPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { qrCode, invitedUser, accessInfo } = location.state || {};

  const handleDownloadQR = () => {
    if (!qrCode) return;
    
    const link = document.createElement('a');
    link.href = qrCode;
    link.download = `QR-${invitedUser?.name?.replace(/\s/g, '_') || 'acceso'}.png`;
    link.click();
  };

  if (!qrCode || !accessInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Información no disponible</h2>
          <p className="text-gray-600 mb-6">No se pudo cargar la información de registro.</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            Ir al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">¡Registro exitoso!</h1>
          <p className="text-lg text-gray-600">
            Tu código QR de acceso ha sido generado
          </p>
        </div>

        {/* QR Code Display */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">Tu código QR de acceso</h2>
          
          <div className="flex flex-col items-center">
            {qrCode && (
              <div className="bg-white p-4 rounded-lg border-4 border-gray-200 mb-6">
                <img 
                  src={qrCode} 
                  alt="QR Code" 
                  className="w-64 h-64"
                />
              </div>
            )}

            <button
              onClick={handleDownloadQR}
              className="flex items-center px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              <Download className="w-5 h-5 mr-2" />
              Descargar código QR
            </button>
          </div>
        </div>

        {/* Event Information */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Detalles del evento</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{accessInfo.eventName}</h3>
            </div>

            <div className="flex items-start text-gray-700">
              <Calendar className="w-5 h-5 mr-3 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Fecha y hora</p>
                <p className="text-sm">
                  {new Date(accessInfo.startDate).toLocaleString('es-MX', {
                    dateStyle: 'long',
                    timeStyle: 'short'
                  })}
                </p>
              </div>
            </div>

            {accessInfo.location && (
              <div className="flex items-start text-gray-700">
                <MapPin className="w-5 h-5 mr-3 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Ubicación</p>
                  <p className="text-sm">{accessInfo.location}</p>
                </div>
              </div>
            )}

            {invitedUser?.email && (
              <div className="flex items-start text-gray-700">
                <Mail className="w-5 h-5 mr-3 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Confirmación enviada a</p>
                  <p className="text-sm">{invitedUser.email}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-3">Instrucciones importantes:</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Descarga o guarda una captura de tu código QR</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Presenta este código QR a tu llegada para acceder</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Si proporcionaste un email, recibirás una copia del código QR</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Llega unos minutos antes de la hora programada</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RegistrationSuccessPage;
