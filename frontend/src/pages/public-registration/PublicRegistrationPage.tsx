import React, { useState, useEffect } from 'react';
import { Download, QrCode, Check } from 'lucide-react';
import * as api from '../../services/api';

export const PublicRegistrationPage: React.FC = () => {
  const [qrData, setQrData] = useState<{ qrCode: string; qrUrl: string; publicUrl: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadQRData = async () => {
      try {
        setLoading(true);
        const data = await api.getCompanyQR();
        setQrData(data);
      } catch (err: any) {
        console.error('Error cargando QR institucional:', err);
        setError(err?.message || 'No se pudo cargar el QR institucional');
      } finally {
        setLoading(false);
      }
    };
    loadQRData();
  }, []);

  const handleDownloadQR = () => {
    if (!qrData?.qrUrl) return;
    
    const link = document.createElement('a');
    link.href = qrData.qrUrl;
    link.download = 'QR-Auto-Registro.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
              <p className="mt-4 text-gray-600">Cargando QR institucional...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⚠️</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Error al cargar</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold"
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-14 h-14 bg-gradient-to-br from-gray-900 to-gray-700 rounded-2xl flex items-center justify-center shadow-lg">
              <QrCode className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">QR de Auto-Registro</h1>
              <p className="text-gray-600 text-sm sm:text-base mt-1">Código QR para que visitantes se registren automáticamente</p>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="p-6 sm:p-8 lg:p-10">
            {/* QR Code Section */}
            <div className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl p-8 mb-6">
              <div className="flex flex-col items-center">
                {/* QR Display */}
                <div className="bg-white p-6 rounded-2xl shadow-md border-2 border-gray-300 mb-6">
                  {qrData?.qrUrl && (
                    <img 
                      src={qrData.qrUrl} 
                      alt="QR Code para auto-registro" 
                      className="w-64 h-64"
                    />
                  )}
                </div>

                {/* Download Button */}
                <button
                  onClick={handleDownloadQR}
                  className="px-8 py-4 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all font-bold shadow-xl hover:shadow-2xl flex items-center gap-3 text-base"
                >
                  <Download className="w-5 h-5" />
                  Descargar QR
                </button>
              </div>
            </div>

            {/* Instructions Section */}
            <div className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Instrucciones de Uso</h2>
              </div>
              
              <p className="text-gray-700 mb-4 font-medium">
                Imprime este código QR para que visitantes se registren automáticamente.
              </p>

              <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
                <h3 className="font-bold text-gray-900 mb-3">Pasos:</h3>
                <ol className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                    <span>Descarga e imprime el código QR</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                    <span>Colócalo en recepción para que visitantes lo escaneen</span>
                  </li>
                </ol>
              </div>

              {/* Additional Tips */}
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                <p className="text-sm text-yellow-800">
                  <strong>💡 Tip:</strong> Para mejor escaneado, imprime el QR de al menos 10×10 cm y colócalo en un lugar visible y bien iluminado.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};