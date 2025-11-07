import React, { useState, useEffect } from 'react';
import { Download, QrCode, Check } from 'lucide-react';
import * as api from '../../services/api';
import { jsPDF } from 'jspdf';

export const PublicRegistrationPage: React.FC = () => {
  const [qrData, setQrData] = useState<{ qrCode: string; qrUrl: string; publicUrl: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const handleDownloadQR = async () => {
    if (!qrData?.qrUrl) return;
    
    try {
      // Crear un nuevo PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Fondo degradado moderno (simulado con rectángulos)
      pdf.setFillColor(249, 250, 251); // gray-50
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');

      // Banda decorativa superior con degradado
      pdf.setFillColor(31, 41, 55); // gray-900
      pdf.rect(0, 0, pageWidth, 80, 'F');
      
      // Detalles decorativos - líneas diagonales sutiles
      pdf.setDrawColor(55, 65, 81); // gray-700
      pdf.setLineWidth(0.5);
      for (let i = 0; i < 15; i++) {
        pdf.line(i * 15, 0, i * 15 + 40, 80);
      }

      // Cargar el logo
      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';
      logoImg.src = '/logo.png';
      
      await new Promise((resolve, reject) => {
        logoImg.onload = resolve;
        logoImg.onerror = reject;
      });

      // Agregar logo centrado con mejor calidad
      const logoSize = 35;
      const logoX = (pageWidth - logoSize) / 2;
      const logoY = 18;
      
      // Círculo de fondo blanco para el logo
      pdf.setFillColor(255, 255, 255);
      const circleRadius = 22;
      pdf.circle(pageWidth/2, logoY + logoSize/2, circleRadius, 'F');
      
      // Agregar logo con mejor resolución
      pdf.addImage(logoImg, 'PNG', logoX, logoY, logoSize, logoSize);

      // Nombre del sistema debajo del logo
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255); // Texto blanco
      const nombreSistema = 'Visitas SecuriTI';
      const nombreWidth = pdf.getTextWidth(nombreSistema);
      pdf.text(nombreSistema, (pageWidth - nombreWidth) / 2, logoY + logoSize + 12);

      // Contenedor principal moderno con bordes redondeados (simulado)
      const cardY = 105;
      const cardPadding = 15;
      const cardWidth = pageWidth - (cardPadding * 2);
      
      // Sombra del contenedor
      pdf.setFillColor(200, 200, 200);
      pdf.roundedRect(cardPadding + 1, cardY + 1, cardWidth, 165, 5, 5, 'F');
      
      // Contenedor principal
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(cardPadding, cardY, cardWidth, 165, 5, 5, 'F');

      // Título principal con estilo moderno
      pdf.setFontSize(32);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(31, 41, 55); // gray-900
      const titulo = '¡Haz tu registro!';
      const tituloWidth = pdf.getTextWidth(titulo);
      pdf.text(titulo, (pageWidth - tituloWidth) / 2, cardY + 20);

      // Línea decorativa debajo del título
      const lineWidth = 60;
      const lineX = (pageWidth - lineWidth) / 2;
      pdf.setDrawColor(59, 130, 246); // blue-500
      pdf.setLineWidth(2);
      pdf.line(lineX, cardY + 25, lineX + lineWidth, cardY + 25);

      // Subtítulo/instrucciones con mejor espaciado
      pdf.setFontSize(13);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(107, 114, 128); // gray-500
      const instruccion1 = 'Escanea con la cámara de tu celular';
      const instruccion2 = 'el código QR para registrar tu visita';
      const inst1Width = pdf.getTextWidth(instruccion1);
      const inst2Width = pdf.getTextWidth(instruccion2);
      pdf.text(instruccion1, (pageWidth - inst1Width) / 2, cardY + 38);
      pdf.text(instruccion2, (pageWidth - inst2Width) / 2, cardY + 46);

      // Cargar y agregar el código QR
      const qrImg = new Image();
      qrImg.src = qrData.qrUrl;
      
      await new Promise((resolve, reject) => {
        qrImg.onload = resolve;
        qrImg.onerror = reject;
      });

      const qrSize = 70;
      const qrX = (pageWidth - qrSize) / 2;
      const qrY = cardY + 58;
      
      // Contenedor del QR con sombra y borde
      const qrPadding = 8;
      
      // Sombra del QR
      pdf.setFillColor(220, 220, 220);
      pdf.roundedRect(qrX - qrPadding + 1, qrY - qrPadding + 1, qrSize + qrPadding * 2, qrSize + qrPadding * 2, 3, 3, 'F');
      
      // Fondo blanco para el QR con bordes redondeados
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(qrX - qrPadding, qrY - qrPadding, qrSize + qrPadding * 2, qrSize + qrPadding * 2, 3, 3, 'F');
      
      // Borde decorativo azul
      pdf.setDrawColor(59, 130, 246); // blue-500
      pdf.setLineWidth(1.5);
      pdf.roundedRect(qrX - qrPadding, qrY - qrPadding, qrSize + qrPadding * 2, qrSize + qrPadding * 2, 3, 3, 'S');
      
      // Agregar QR
      pdf.addImage(qrImg, 'PNG', qrX, qrY, qrSize, qrSize);

      // Badge "Escaneame" con fondo
      const badgeY = qrY + qrSize + qrPadding + 10;
      const badgeText = 'ESCANÉAME';
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      const badgeTextWidth = pdf.getTextWidth(badgeText);
      const badgePadding = 8;
      const badgeWidth = badgeTextWidth + badgePadding * 2;
      const badgeX = (pageWidth - badgeWidth) / 2;
      
      // Fondo del badge con degradado (simulado)
      pdf.setFillColor(59, 130, 246); // blue-500
      pdf.roundedRect(badgeX, badgeY - 8, badgeWidth, 12, 6, 6, 'F');
      
      // Texto del badge
      pdf.setTextColor(255, 255, 255);
      pdf.text(badgeText, (pageWidth - badgeTextWidth) / 2, badgeY);

      // Footer con información adicional
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(156, 163, 175); // gray-400
      const footerText = 'Sistema de Gestión de Visitas';
      const footerWidth = pdf.getTextWidth(footerText);
      pdf.text(footerText, (pageWidth - footerWidth) / 2, pageHeight - 15);

      // Guardar el PDF
      pdf.save('QR-Auto-Registro.pdf');
    } catch (error) {
      console.error('Error generando PDF:', error);
      // Fallback: descargar solo la imagen
      const link = document.createElement('a');
      link.href = qrData.qrUrl;
      link.download = 'QR-Auto-Registro.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className={`text-center ${isMobile ? 'py-12' : 'py-20'} bg-white rounded-2xl shadow-xl border border-gray-200`}>
            <div className={`inline-block animate-spin rounded-full ${isMobile ? 'h-12 w-12 border-4' : 'h-16 w-16 border-4'} border-gray-200 border-t-gray-900`}></div>
            <p className={`${isMobile ? 'mt-4 text-base' : 'mt-6 text-lg'} text-gray-600 font-medium`}>Cargando QR institucional...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 sm:p-8">
            <div className="text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl sm:text-3xl">⚠️</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Error al cargar</h2>
              <p className="text-gray-600 mb-6 text-sm sm:text-base">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 sm:px-6 sm:py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold text-sm sm:text-base"
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className={isMobile ? "mb-4" : "mb-8"}>
          <div className={`flex items-center ${isMobile ? 'gap-3' : 'gap-4'} mb-3`}>
            <div className={`${isMobile ? 'w-12 h-12' : 'w-14 h-14'} bg-gradient-to-br from-gray-900 to-gray-700 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0`}>
              <QrCode className={`${isMobile ? 'w-6 h-6' : 'w-7 h-7'} text-white`} />
            </div>
            <div className="min-w-0">
              <h1 className={`${isMobile ? 'text-xl' : 'text-3xl sm:text-4xl'} font-bold text-gray-900`}>
                {isMobile ? 'Auto-registro' : 'QR de Auto-Registro'}
              </h1>
              <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm sm:text-base'} mt-1`}>
                {isMobile ? 'Código QR para visitantes' : 'Código QR para que visitantes se registren automáticamente'}
              </p>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className={isMobile ? "p-4" : "p-6 sm:p-8 lg:p-10"}>
            {/* QR Code Section */}
            <div className={`bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl ${isMobile ? 'p-4 mb-4' : 'p-8 mb-6'}`}>
              <div className="flex flex-col items-center">
                {/* QR Display */}
                <div className={`bg-white ${isMobile ? 'p-4' : 'p-6'} rounded-2xl shadow-md border-2 border-gray-300 ${isMobile ? 'mb-4' : 'mb-6'}`}>
                  {qrData?.qrUrl && (
                    <img 
                      src={qrData.qrUrl} 
                      alt="QR Code para auto-registro" 
                      className={isMobile ? "w-48 h-48" : "w-64 h-64"}
                    />
                  )}
                </div>

                {/* Download Button */}
                <button
                  onClick={handleDownloadQR}
                  className={`${isMobile ? 'w-full px-4 py-3 text-sm' : 'px-8 py-4 text-base'} bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all font-bold shadow-xl hover:shadow-2xl flex items-center justify-center gap-3`}
                >
                  <Download className={isMobile ? "w-4 h-4" : "w-5 h-5"} />
                  Descargar QR
                </button>
              </div>
            </div>

            {/* Instructions Section */}
            <div className={`bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200 rounded-2xl ${isMobile ? 'p-4' : 'p-6'}`}>
              <div className={`flex items-center ${isMobile ? 'gap-2 mb-3' : 'gap-3 mb-4'}`}>
                <div className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <Check className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-white`} />
                </div>
                <h2 className={`${isMobile ? 'text-base' : 'text-xl'} font-bold text-gray-900`}>Instrucciones de Uso</h2>
              </div>
              
              <p className={`text-gray-700 ${isMobile ? 'mb-3 text-sm' : 'mb-4'} font-medium`}>
                Imprime este código QR para que visitantes se registren automáticamente.
              </p>

              <div className={`bg-white border-2 border-gray-200 rounded-xl ${isMobile ? 'p-3' : 'p-4'}`}>
                <h3 className={`font-bold text-gray-900 ${isMobile ? 'mb-2 text-sm' : 'mb-3'}`}>Pasos:</h3>
                <ol className={`${isMobile ? 'space-y-2.5' : 'space-y-2'} text-gray-700 ${isMobile ? 'text-sm' : ''}`}>
                  <li className="flex items-start gap-3">
                    <span className={`flex-shrink-0 ${isMobile ? 'w-5 h-5 text-[10px]' : 'w-6 h-6 text-xs'} bg-gray-900 text-white rounded-full flex items-center justify-center font-bold`}>1</span>
                    <span className="flex-1">Descarga e imprime el código QR</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className={`flex-shrink-0 ${isMobile ? 'w-5 h-5 text-[10px]' : 'w-6 h-6 text-xs'} bg-gray-900 text-white rounded-full flex items-center justify-center font-bold`}>2</span>
                    <span className="flex-1">Colócalo en recepción para que visitantes lo escaneen</span>
                  </li>
                </ol>
              </div>

              {/* Additional Tips */}
              <div className={`${isMobile ? 'mt-3 p-3' : 'mt-4 p-4'} bg-yellow-50 border border-yellow-200 rounded-xl`}>
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-yellow-800`}>
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