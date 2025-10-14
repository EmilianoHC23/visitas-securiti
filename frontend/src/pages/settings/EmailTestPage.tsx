import React, { useState, useEffect } from 'react';
import * as api from '../../services/api';

export const EmailTestPage: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const testSMTP = async () => {
    try {
      setTesting(true);
      setError(null);
      setResult(null);
      
      const response = await api.testSMTPConfig();
      setResult('✅ Configuración SMTP correcta. Email de prueba enviado exitosamente.');
    } catch (err: any) {
      console.error('Error testing SMTP:', err);
      setError(`❌ Error en configuración SMTP: ${err?.message || 'Error desconocido'}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Prueba de Configuración de Email</h2>
        
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">¿Qué hace esta prueba?</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Verifica la configuración SMTP del servidor</li>
              <li>• Envía un email de prueba usando Nodemailer</li>
              <li>• Confirma que los emails de invitaciones funcionarán correctamente</li>
            </ul>
          </div>

          <div className="text-center">
            <button
              onClick={testSMTP}
              disabled={testing}
              className="px-6 py-3 bg-securiti-blue-600 text-white rounded-md hover:bg-securiti-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {testing ? 'Probando configuración...' : 'Probar Configuración SMTP'}
            </button>
          </div>

          {result && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800">{result}</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
              <div className="mt-2 text-sm text-red-600">
                <p>Posibles causas:</p>
                <ul className="list-disc pl-5 mt-1">
                  <li>Variables de entorno SMTP no configuradas</li>
                  <li>Credenciales de email incorrectas</li>
                  <li>Servidor SMTP bloqueado o no accesible</li>
                  <li>Puerto SMTP incorrecto</li>
                </ul>
              </div>
            </div>
          )}

          <div className="border-t pt-4">
            <h3 className="font-medium text-gray-800 mb-2">Configuración Actual:</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• Los emails se envían automáticamente al crear accesos con invitados</p>
              <p>• Los emails incluyen el enlace de pre-registro</p>
              <p>• Los anfitriones reciben notificaciones de nuevas visitas</p>
              <p>• Las confirmaciones se envían a los visitantes registrados</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};