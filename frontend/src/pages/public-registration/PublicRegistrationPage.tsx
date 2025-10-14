import React, { useState, useEffect } from 'react';
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

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Enlace copiado al portapapeles');
    } catch {
      // Fallback
      window.prompt('Copia este enlace:', text);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-securiti-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando QR institucional...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="mb-4">
              <svg className="mx-auto h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error al cargar</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-securiti-blue-600 text-white rounded-md hover:bg-securiti-blue-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Auto-registro de Visitantes</h2>
          <p className="text-gray-600 mt-2">
            QR institucional para que los visitantes se registren de forma autónoma
          </p>
        </div>

        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-8">
            {/* QR Code Display */}
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Código QR Institucional</h3>
              {qrData?.qrUrl && (
                <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg shadow-sm">
                  <img 
                    src={qrData.qrUrl} 
                    alt="QR Code para auto-registro" 
                    className="w-64 h-64 mx-auto"
                  />
                </div>
              )}
              <div className="mt-4 space-y-2">
                <p className="text-sm text-gray-600">
                  Los visitantes pueden escanear este código para acceder al formulario de registro
                </p>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Imprimir QR
                  </button>
                  <button
                    onClick={() => qrData?.qrUrl && window.open(qrData.qrUrl, '_blank')}
                    className="px-4 py-2 bg-securiti-blue-100 text-securiti-blue-700 rounded-md hover:bg-securiti-blue-200 transition-colors"
                  >
                    Descargar QR
                  </button>
                </div>
              </div>
            </div>

            {/* Instructions and Links */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Instrucciones de Uso</h3>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Para Visitantes:</h4>
                  <ol className="text-sm text-blue-800 space-y-1">
                    <li>1. Escanea el código QR con tu teléfono</li>
                    <li>2. Completa el formulario de registro</li>
                    <li>3. Tómate una foto para el gafete</li>
                    <li>4. Espera la aprobación del anfitrión</li>
                  </ol>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Para Personal de Recepción:</h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Coloca el QR en un lugar visible</li>
                    <li>• Los registros aparecerán en "Visitas"</li>
                    <li>• Puedes aprobar/rechazar desde el dashboard</li>
                  </ul>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-800 mb-2">Enlace Directo:</h4>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={qrData?.publicUrl || ''}
                      readOnly
                      className="flex-1 px-3 py-2 border rounded-md bg-gray-50 text-sm"
                    />
                    <button
                      onClick={() => qrData?.publicUrl && copyToClipboard(qrData.publicUrl)}
                      className="px-4 py-2 bg-securiti-blue-600 text-white rounded-md hover:bg-securiti-blue-700 transition-colors"
                    >
                      Copiar
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    También puedes compartir este enlace directo para registro
                  </p>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-800 mb-2">Vista Previa:</h4>
                  <button
                    onClick={() => qrData?.publicUrl && window.open(qrData.publicUrl, '_blank')}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Probar Formulario
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-2">Tips de Implementación:</h4>
            <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
              <div>
                <strong>Ubicación:</strong> Coloca el QR en la entrada principal, recepción o áreas de espera
              </div>
              <div>
                <strong>Tamaño:</strong> Imprime el QR de al menos 5x5 cm para fácil escaneado
              </div>
              <div>
                <strong>Instrucciones:</strong> Agrega texto explicativo junto al QR para guiar a los visitantes
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};