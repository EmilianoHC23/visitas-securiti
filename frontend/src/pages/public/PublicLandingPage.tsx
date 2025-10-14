import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const PublicLandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedOption, setSelectedOption] = useState<'visit' | 'access' | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-securiti-blue-50 to-securiti-blue-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header con Logo */}
        <div className="text-center mb-8">
          <div className="inline-block mb-4">
            <img 
              src="/logo.png" 
              alt="SecuriTI Logo" 
              className="h-20 w-auto mx-auto"
            />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Bienvenido a <span className="text-securiti-blue-600">SecuriTI</span>
          </h1>
          <p className="text-lg text-gray-600">
            Sistema de Gestión de Visitas
          </p>
        </div>

        {/* Opciones principales */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Opción: Registrar Visita */}
          <button
            onClick={() => navigate('/public/visit-registration')}
            className="group bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 text-left border-2 border-transparent hover:border-securiti-blue-500"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-securiti-blue-100 rounded-lg group-hover:bg-securiti-blue-200 transition-colors">
                <svg className="w-8 h-8 text-securiti-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <svg className="w-6 h-6 text-gray-400 group-hover:text-securiti-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Registrar Visita</h3>
            <p className="text-gray-600">
              Primera vez visitando o no tienes un código de acceso. Completa el formulario de registro.
            </p>
            <div className="mt-4 flex items-center text-sm text-securiti-blue-600 font-medium">
              <span>Comenzar registro</span>
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </button>

          {/* Opción: Accesos/Eventos */}
          <button
            onClick={() => navigate('/public/access-list')}
            className="group bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 text-left border-2 border-transparent hover:border-green-500"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <svg className="w-6 h-6 text-gray-400 group-hover:text-green-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Accesos/Eventos</h3>
            <p className="text-gray-600">
              Tienes un acceso programado o fuiste invitado a un evento. Selecciona tu acceso.
            </p>
            <div className="mt-4 flex items-center text-sm text-green-600 font-medium">
              <span>Ver accesos disponibles</span>
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </button>
        </div>

        {/* Información adicional */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Seguro</h4>
              <p className="text-sm text-gray-600">Tus datos están protegidos</p>
            </div>
            <div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Rápido</h4>
              <p className="text-sm text-gray-600">Proceso de registro ágil</p>
            </div>
            <div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Fácil</h4>
              <p className="text-sm text-gray-600">Interfaz intuitiva y amigable</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-600">
          <p>¿Necesitas ayuda? Contacta a recepción</p>
          <p className="mt-1">© 2024 SecuriTI - Sistema de Gestión de Visitas</p>
        </div>
      </div>
    </div>
  );
};
