import React, { useState, useEffect, useRef } from 'react';
import { User } from '../../types';
import * as api from '../../services/api';

type Step = 'form' | 'photo' | 'success';

interface VisitorRegistrationPageProps {
}

export const VisitorRegistrationPage: React.FC<VisitorRegistrationPageProps> = () => {
    const [step, setStep] = useState<Step>('form');
    const [hosts, setHosts] = useState<User[]>([]);
    const [visitorName, setVisitorName] = useState('');
    const [visitorCompany, setVisitorCompany] = useState('');
    const [visitorEmail, setVisitorEmail] = useState('');
    const [hostId, setHostId] = useState('');
    const [reason, setReason] = useState('');
    const [visitorPhoto, setVisitorPhoto] = useState('');
    const [showQRScanner, setShowQRScanner] = useState(false);
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const qrVideoRef = useRef<HTMLVideoElement>(null);

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

    const stopQRCamera = () => {
        if (qrVideoRef.current && qrVideoRef.current.srcObject) {
            const stream = qrVideoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            qrVideoRef.current.srcObject = null;
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

    const startQRScanner = async () => {
        try {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { facingMode: 'environment' } // Preferir cámara trasera
                });
                if (qrVideoRef.current) {
                    qrVideoRef.current.srcObject = stream;
                }
            } else {
                setError("Tu navegador no soporta el acceso a la cámara.");
            }
        } catch (err) {
            console.error(err);
            setError("No se pudo acceder a la cámara para escanear QR.");
        }
    };

    const handleQRScan = () => {
        // Placeholder para la funcionalidad de escaneo QR
        // Aquí se implementaría la lógica de escaneo cuando se integre una librería de QR
        setError("Funcionalidad de escaneo QR disponible próximamente");
    };
    
    useEffect(() => {
        if (step === 'photo') {
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [step]);

    useEffect(() => {
        if (showQRScanner) {
            startQRScanner();
        } else {
            stopQRCamera();
        }
        return () => stopQRCamera();
    }, [showQRScanner]);
    
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
            console.log('Enviando datos de visita:', { visitorName, visitorCompany, visitorEmail, hostId, reason, visitorPhoto: visitorPhoto.substring(0, 50) + '...' });
            const result = await api.selfRegisterVisit({ visitorName, visitorCompany, visitorEmail, hostId, reason, visitorPhoto });
            console.log('Visita registrada exitosamente:', result);
            
            setStep('success');
        } catch (err) {
            console.error('Error al registrar visita:', err);
            setError(`Error al registrar visita: ${err instanceof Error ? err.message : 'Error desconocido'}`);
        } finally {
            setLoading(false);
        }
    };

    const renderContent = () => {
        switch (step) {
            case 'form':
                return (
                    <div className="space-y-6">
                        {/* Header con título */}
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-[#1e3a8a] mb-2">Registrar visita</h2>
                        </div>

                        {/* Sección de foto del visitante */}
                        <div className="flex flex-col items-center py-6 border-b border-gray-200">
                            <p className="text-sm text-gray-600 mb-4">Toma la fotografía de tu visitante</p>
                            
                            <div className="relative mb-4">
                                <div className="w-32 h-32 rounded-full border-4 border-[#1e3a8a] flex items-center justify-center bg-gray-50">
                                    <svg className="w-16 h-16 text-[#1e3a8a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                            </div>

                            <p className="text-sm text-gray-500 mb-3">Si tu visita cuenta con invitación QR</p>
                            <button 
                                type="button" 
                                onClick={() => setShowQRScanner(!showQRScanner)}
                                className="text-cyan-500 hover:text-cyan-600 font-medium text-sm flex items-center gap-1 transition-colors"
                            >
                                {showQRScanner ? 'cerrar escáner' : 'escanea aquí'}
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm13-2h3v3h-3v-3zm0 5h3v3h-3v-3z"/>
                                </svg>
                            </button>
                        </div>

                        {/* Escáner QR */}
                        {showQRScanner && (
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="font-semibold text-gray-700">Escanear código QR</h3>
                                    <button 
                                        type="button"
                                        onClick={() => setShowQRScanner(false)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="relative aspect-square bg-black rounded-lg overflow-hidden mb-3">
                                    <video 
                                        ref={qrVideoRef} 
                                        autoPlay 
                                        playsInline 
                                        muted 
                                        className="w-full h-full object-cover"
                                    />
                                    {/* Overlay de esquinas para el escáner */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="relative w-64 h-64">
                                            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-cyan-400"></div>
                                            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-cyan-400"></div>
                                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-cyan-400"></div>
                                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-cyan-400"></div>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-xs text-center text-gray-500">
                                    Coloca el código QR dentro del marco
                                </p>
                            </div>
                        )}

                        {/* Formulario de registro */}
                        <form onSubmit={handleFormSubmit} className="space-y-5">
                            <div className="text-center pb-3 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-800">Formulario de registro</h3>
                            </div>

                            {error && <div role="alert" aria-live="polite" className="p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}
                            
                            <div>
                                <label htmlFor="visitorEmail" className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
                                <input 
                                    id="visitorEmail" 
                                    type="email" 
                                    placeholder="Ingresa el correo electrónico (Opcional)" 
                                    value={visitorEmail} 
                                    onChange={e => setVisitorEmail(e.target.value)} 
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all" 
                                />
                            </div>

                            <div>
                                <label htmlFor="visitorName" className="block text-sm font-medium text-gray-700 mb-1">Nombre del visitante<span className="text-red-500">*</span></label>
                                <input 
                                    id="visitorName" 
                                    type="text" 
                                    placeholder="Ingresa el nombre completo" 
                                    value={visitorName} 
                                    onChange={e => setVisitorName(e.target.value)} 
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all" 
                                    required 
                                />
                            </div>
                            
                            <div>
                                <label htmlFor="visitorCompany" className="block text-sm font-medium text-gray-700 mb-1">Empresa<span className="text-red-500">*</span></label>
                                <input 
                                    id="visitorCompany" 
                                    type="text" 
                                    placeholder="Empresa" 
                                    value={visitorCompany} 
                                    onChange={e => setVisitorCompany(e.target.value)} 
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all" 
                                    required 
                                />
                            </div>

                            <div>
                                <label htmlFor="hostId" className="block text-sm font-medium text-gray-700 mb-1">¿A quién visitas?<span className="text-red-500">*</span></label>
                                <select 
                                    id="hostId" 
                                    value={hostId} 
                                    onChange={e => setHostId(e.target.value)} 
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all" 
                                    required
                                >
                                    <option value="" disabled>Selecciona un anfitrión</option>
                                    {hosts.map(host => <option key={host._id} value={host._id}>{host.firstName} {host.lastName}{host.role === 'admin' ? ' (Administrador)' : ''}</option>)}
                                </select>
                            </div>
                            
                            <div>
                                <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">Motivo de la visita<span className="text-red-500">*</span></label>
                                <textarea 
                                    id="reason" 
                                    placeholder="Describe el motivo de tu visita" 
                                    value={reason} 
                                    onChange={e => setReason(e.target.value)} 
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all resize-none" 
                                    rows={3}
                                    required 
                                />
                            </div>
                            
                            <div className="flex gap-3 pt-4">
                                <button 
                                    type="button" 
                                    onClick={() => {
                                        setVisitorName('');
                                        setVisitorCompany('');
                                        setVisitorEmail('');
                                        setHostId('');
                                        setReason('');
                                        setError(null);
                                    }}
                                    className="flex-1 py-3 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    className="flex-1 py-3 bg-gray-300 text-gray-600 font-semibold rounded-lg hover:bg-gray-400 hover:text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
                                >
                                    Confirmar
                                </button>
                            </div>
                        </form>
                    </div>
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