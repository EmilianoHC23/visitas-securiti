
import React from 'react';

const Toggle: React.FC<{ label: string; enabled: boolean; onToggle: () => void }> = ({ label, enabled, onToggle }) => (
    <div className="flex items-center justify-between">
        <span className="text-gray-700">{label}</span>
        <button
            onClick={onToggle}
            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-securiti-blue-500 ${
                enabled ? 'bg-securiti-blue-600' : 'bg-gray-300'
            }`}
        >
            <span
                className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ${
                    enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
            />
        </button>
    </div>
);

export const SettingsPage: React.FC = () => {
    const [autoApprove, setAutoApprove] = React.useState(false);
    const [requirePhoto, setRequirePhoto] = React.useState(true);

    const registrationUrl = `${window.location.origin}${window.location.pathname}#/register`;

    return (
        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-gray-800 mb-6">Configuración General</h2>
                    <div className="space-y-6">
                        <Toggle 
                            label="Aprobación automática de visitas" 
                            enabled={autoApprove}
                            onToggle={() => setAutoApprove(!autoApprove)}
                        />
                        <Toggle 
                            label="Requerir foto del visitante" 
                            enabled={requirePhoto}
                            onToggle={() => setRequirePhoto(!requirePhoto)}
                        />
                         <div className="pt-4">
                            <button className="px-5 py-2 font-semibold text-white bg-securiti-blue-600 rounded-lg shadow-md hover:bg-securiti-blue-700 transition-colors">
                                Guardar Cambios
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div>
                 <div className="bg-white p-6 rounded-lg shadow-md text-center">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">QR de Auto-Registro</h2>
                    <div className="flex justify-center">
                         <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(registrationUrl)}`}
                            alt="QR Code para auto-registro de visitas"
                            className="w-48 h-48"
                        />
                    </div>
                    <p className="text-sm text-gray-500 mt-4">
                        Los visitantes pueden escanear este código para registrar su llegada.
                    </p>
                    <button className="mt-4 w-full px-4 py-2 text-sm font-semibold text-securiti-blue-600 border border-securiti-blue-600 rounded-lg hover:bg-securiti-blue-50 transition-colors">
                        Descargar QR
                    </button>
                </div>
            </div>
        </div>
    );
};