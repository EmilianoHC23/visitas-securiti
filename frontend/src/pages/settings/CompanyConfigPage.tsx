import React, { useState, useEffect } from 'react';
import { Company } from '../../types';
import * as api from '../../services/api';

export const CompanyConfigPage: React.FC = () => {
  const [config, setConfig] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [qrInfo, setQrInfo] = useState<{ qrCode: string; qrUrl: string; publicUrl: string } | null>(null);

  useEffect(() => {
    loadConfig();
    loadQRInfo();
  }, []);

  const loadConfig = async () => {
    try {
      const companyConfig = await api.getCompanyConfig();
      setConfig(companyConfig);
    } catch (error) {
      console.error('Error loading company config:', error);
      alert('Error al cargar la configuración de empresa');
    } finally {
      setLoading(false);
    }
  };

  const loadQRInfo = async () => {
    try {
      const qr = await api.getCompanyQR();
      setQrInfo(qr);
    } catch (error) {
      console.error('Error loading QR info:', error);
      // QR info is optional, don't show error to user
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;

    try {
      setSaving(true);
      const updatedConfig = await api.updateCompanyConfig(config);
      setConfig(updatedConfig);
      alert('Configuración guardada exitosamente');
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    if (!config) return;

    if (field.startsWith('settings.')) {
      const settingField = field.replace('settings.', '');
      setConfig({
        ...config,
        settings: {
          ...config.settings,
          [settingField]: value
        }
      });
    } else {
      setConfig({
        ...config,
        [field]: value
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
              <p className="mt-4 text-gray-600">Cargando configuración...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!config) {
    return <div className="p-6">Error al cargar la configuración</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Configuración de la Empresa</h2>
        
        <form onSubmit={handleSave} className="space-y-6">
          {/* Información Básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la Empresa
              </label>
              <input
                type="text"
                value={config.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email de Notificaciones
              </label>
              <input
                type="email"
                value={config.settings.notificationEmail || ''}
                onChange={(e) => handleInputChange('settings.notificationEmail', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="notificaciones@empresa.com"
              />
            </div>
          </div>

          {/* Configuraciones de Sistema */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Configuraciones del Sistema</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autoApproval"
                  checked={config.settings.autoApproval}
                  onChange={(e) => handleInputChange('settings.autoApproval', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="autoApproval" className="ml-2 block text-sm text-gray-700">
                  <strong>Aprobación Automática</strong> - Las visitas se aprueban automáticamente sin necesidad de confirmación del anfitrión
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="requirePhoto"
                  checked={config.settings.requirePhoto}
                  onChange={(e) => handleInputChange('settings.requirePhoto', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="requirePhoto" className="ml-2 block text-sm text-gray-700">
                  <strong>Requerir Foto</strong> - Los visitantes deben proporcionar una foto al registrarse
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enableSelfRegister"
                  checked={config.settings.enableSelfRegister}
                  onChange={(e) => handleInputChange('settings.enableSelfRegister', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="enableSelfRegister" className="ml-2 block text-sm text-gray-700">
                  <strong>Habilitar Auto-registro</strong> - Los visitantes pueden registrarse usando el código QR
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Guardando...' : 'Guardar Configuración'}
            </button>
          </div>
        </form>
      </div>

      {/* QR Code Section */}
      {qrInfo && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Código QR para Auto-registro</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Los visitantes pueden usar este código QR para registrarse automáticamente:
              </p>
              <div className="bg-gray-100 p-4 rounded-md">
                <p className="font-mono text-sm break-all">{qrInfo.publicUrl}</p>
              </div>
            </div>
            <div className="text-center">
              <div className="inline-block p-4 bg-white border-2 border-gray-300 rounded-lg">
                <div className="w-32 h-32 bg-gray-200 flex items-center justify-center rounded">
                  <span className="text-gray-500 text-xs">QR Code</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Código: {qrInfo.qrCode}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};