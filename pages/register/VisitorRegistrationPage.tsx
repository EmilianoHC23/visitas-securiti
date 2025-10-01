import React, { useState, useEffect, useRef } from 'react';
import { User } from '../../types';
import * as api from '../../services/api';

type Step = 'form' | 'photo' | 'success';

export const VisitorRegistrationPage: React.FC = () => {
    const [step, setStep] = useState<Step>('form');
    const [hosts, setHosts] = useState<User[]>([]);
    const [visitorName, setVisitorName] = useState('');
    const [visitorCompany, setVisitorCompany] = useState('');
    const [hostId, setHostId] = useState('');
    const [reason, setReason] = useState('');
    const [visitorPhoto, setVisitorPhoto] = useState('');
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        api.getHostsPublic()
            .then(setHosts)
            .catch(() => setError('No se pudieron cargar los anfitriones.'));
    }, []);
    
     const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    };

    const startCamera = async () => {
        try {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } else {
                 setError("Tu navegador no soporta el acceso a la cámara.");
            }
        } catch (err) {
            console.error(err);
            setError("No se pudo acceder a la cámara. Por favor, revisa los permisos.");
            setStep('form'); // Go back to form if camera fails
        }
    };
    
    useEffect(() => {
        if (step === 'photo') {
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [step]);
    
    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!visitorName || !visitorCompany || !hostId || !reason) {
            setError("Por favor, completa todos los campos.");
            return;
        }
        setStep('photo');
    };
    
    const handleTakePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            const photoDataUrl = canvas.toDataURL('image/jpeg');
            setVisitorPhoto(photoDataUrl);
            stopCamera();
        }
    };
    
    const handleFinalSubmit = async () => {
        if (!visitorPhoto) {
            setError("Por favor, tómate una foto para continuar.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await api.selfRegisterVisit({ visitorName, visitorCompany, hostId, reason, visitorPhoto });
            setStep('success');
        } catch (err) {
            setError("Ocurrió un error al registrar tu visita. Inténtalo de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    const renderContent = () => {
        switch (step) {
            case 'form':
                return (
                    <form onSubmit={handleFormSubmit} className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-800 text-center">Registro de Visitante</h2>
                        {error && <div role="alert" aria-live="polite" className="p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}
                        
                        <div>
                            <label htmlFor="visitorName" className="sr-only">Nombre Completo</label>
                            <input id="visitorName" type="text" placeholder="Nombre Completo" value={visitorName} onChange={e => setVisitorName(e.target.value)} className="w-full p-3 border border-gray-300 rounded-md focus:ring-securiti-blue-500 focus:border-securiti-blue-500" required />
                        </div>
                        
                        <div>
                            <label htmlFor="visitorCompany" className="sr-only">Empresa</label>
                            <input id="visitorCompany" type="text" placeholder="Empresa" value={visitorCompany} onChange={e => setVisitorCompany(e.target.value)} className="w-full p-3 border border-gray-300 rounded-md focus:ring-securiti-blue-500 focus:border-securiti-blue-500" required />
                        </div>

                        <div>
                            <label htmlFor="hostId" className="sr-only">¿A quién visitas?</label>
                            <select id="hostId" value={hostId} onChange={e => setHostId(e.target.value)} className="w-full p-3 border border-gray-300 rounded-md bg-white focus:ring-securiti-blue-500 focus:border-securiti-blue-500" required>
                                <option value="" disabled>¿A quién visitas?</option>
                                {hosts.map(host => <option key={host._id} value={host._id}>{host.firstName} {host.lastName}</option>)}
                            </select>
                        </div>
                        
                        <div>
                             <label htmlFor="reason" className="sr-only">Motivo de la visita</label>
                            <textarea id="reason" placeholder="Motivo de la visita" value={reason} onChange={e => setReason(e.target.value)} className="w-full p-3 border border-gray-300 rounded-md focus:ring-securiti-blue-500 focus:border-securiti-blue-500" required />
                        </div>
                        
                        <button type="submit" className="w-full py-3 bg-securiti-blue-600 text-white font-bold rounded-md hover:bg-securiti-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-securiti-blue-500">Siguiente</button>
                    </form>
                );
            case 'photo':
                return (
                     <div className="flex flex-col items-center">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Tómate una Foto</h2>
                        {error && <div role="alert" aria-live="polite" className="p-3 mb-4 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}
                        <div className="w-full max-w-sm bg-gray-200 rounded-md overflow-hidden aspect-square mb-4 relative shadow-inner">
                            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" aria-label="Vista previa de la cámara" />
                             {visitorPhoto && <img src={visitorPhoto} alt="Tu foto" className="absolute top-0 left-0 w-full h-full object-cover" />}
                        </div>
                        <canvas ref={canvasRef} className="hidden" aria-hidden="true"></canvas>
                        
                        {!visitorPhoto ? (
                            <button onClick={handleTakePhoto} className="w-full py-3 bg-securiti-blue-500 text-white font-bold rounded-md hover:bg-securiti-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-securiti-blue-500">Tomar Foto</button>
                        ) : (
                             <div className="w-full space-y-3">
                                <button onClick={handleFinalSubmit} disabled={loading} className="w-full py-3 bg-green-500 text-white font-bold rounded-md hover:bg-green-600 transition-colors disabled:bg-green-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                                    {loading ? 'Registrando...' : 'Finalizar Registro'}
                                </button>
                                 <button onClick={() => { setVisitorPhoto(''); startCamera(); }} className="w-full py-2 bg-gray-200 text-gray-700 font-bold rounded-md hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400">Tomar de Nuevo</button>
                            </div>
                        )}
                         <button onClick={() => { setStep('form'); setVisitorPhoto(''); }} className="mt-4 text-sm text-gray-500 hover:underline">Volver al formulario</button>
                    </div>
                );
            case 'success':
                return (
                    <div className="text-center" role="status">
                        <svg className="mx-auto h-16 w-16 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h2 className="mt-4 text-2xl sm:text-3xl font-bold text-gray-800">¡Registro Exitoso!</h2>
                        <p className="mt-2 text-gray-600">
                            Gracias, {visitorName}. Hemos notificado a tu anfitrión de tu llegada. Por favor, toma asiento.
                        </p>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="max-w-md w-full bg-white p-6 sm:p-8 rounded-xl shadow-lg space-y-6">
                <div className="flex justify-center">
                    <img 
                        src="/logo.png" 
                        alt="Visitas SecuriTI Logo" 
                        className="h-16 w-auto"
                    />
                </div>
                {renderContent()}
            </div>
        </div>
    );
};