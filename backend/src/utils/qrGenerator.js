const QRCode = require('qrcode');

/**
 * Genera un código QR para una invitación de acceso
 * @param {Object} access - Objeto del acceso
 * @param {Object} invitedUser - Usuario invitado
 * @returns {Promise<String>} - QR code en formato base64
 */
async function generateAccessInvitationQR(access, invitedUser) {
  try {
    const qrData = {
      type: 'access-invitation',
      accessId: access._id.toString(),
      accessCode: access.accessCode,
      guestName: invitedUser.name,
      guestEmail: invitedUser.email || '',
      guestPhone: invitedUser.phone || '',
      eventName: access.eventName,
      eventDate: access.startDate,
      location: access.location || '',
      createdAt: new Date().toISOString()
    };

    // Generar QR en formato base64
    const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      width: 300,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error al generar QR:', error);
    throw new Error('Error al generar código QR');
  }
}

/**
 * Genera un código QR simple con el código de acceso
 * @param {String} accessCode - Código del acceso
 * @returns {Promise<String>} - QR code en formato base64
 */
async function generateSimpleAccessQR(accessCode) {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(accessCode, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      width: 300
    });

    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error al generar QR simple:', error);
    throw new Error('Error al generar código QR');
  }
}

module.exports = {
  generateAccessInvitationQR,
  generateSimpleAccessQR
};
