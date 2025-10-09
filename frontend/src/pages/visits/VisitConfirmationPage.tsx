import React from 'react';
import { useSearchParams } from 'react-router-dom';

export const VisitConfirmationPage: React.FC = () => {
  const [params] = useSearchParams();
  const result = params.get('result');
  const action = params.get('action');

  const title = result === 'approved' || action === 'approve'
    ? 'Visita aprobada correctamente'
    : result === 'rejected' || action === 'reject'
    ? 'Visita rechazada'
    : 'Acción registrada';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow max-w-md w-full text-center">
        <h1 className="text-2xl font-semibold mb-4">{title}</h1>
        <p className="text-gray-600">Puedes cerrar esta página.</p>
      </div>
    </div>
  );
};
