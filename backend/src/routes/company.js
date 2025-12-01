const express = require('express');
const Company = require('../models/Company');
const { auth, authorize } = require('../middleware/auth');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const router = express.Router();

// Configurar multer para recibir archivos en memoria
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB máximo
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen (jpeg, jpg, png, gif, webp)'));
    }
  }
});

// Get company configuration (PUBLIC - for self-registration pages)
router.get('/public-config', async (req, res) => {
  try {
    // Get the first active company (assuming single-tenant or default company)
    // You could also pass companyId as query param if multi-tenant
    const company = await Company.findOne({ isActive: true });
    
    if (!company) {
      return res.status(404).json({ message: 'No se encontró configuración de empresa' });
    }

    // Return only public-safe information
    res.json({
      name: company.name,
      logo: company.logo,
      address: company.address || '',
      email: company.email || '',
      phone: company.phone || ''
    });
  } catch (error) {
    console.error('Get public company config error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Get company configuration
router.get('/config', auth, async (req, res) => {
  try {
    console.log('User data:', req.user);
    console.log('Looking for company ID:', req.user.companyId);

    let company = await Company.findOne({ companyId: req.user.companyId });
    
    if (!company) {
      console.log('Company not found, creating default company');
      // Create default company if not exists
      company = new Company({
        companyId: req.user.companyId,
        name: 'Mi Empresa',
        settings: {
          autoApproval: false,
          autoCheckIn: false,
          requirePhoto: true,
          enableSelfRegister: true,
          notificationEmail: null
        }
      });
      await company.save();
      console.log('Default company created:', company);
    }

    res.json(company);
  } catch (error) {
    console.error('Get company config error:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
});

// Upload company logo to Imgur
router.post('/upload-logo', auth, authorize('admin'), upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No se ha subido ningún archivo' });
    }

    // Convertir buffer a base64 para Imgur
    const imageBase64 = req.file.buffer.toString('base64');

    // Subir a Imgur (usando API anónima - sin necesidad de client ID para testing)
    // Para producción, registra una app en https://api.imgur.com/oauth2/addclient
    const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID || 'client_id_here'; // Puedes usar uno público de prueba
    
    const response = await fetch('https://api.imgur.com/3/image', {
      method: 'POST',
      headers: {
        'Authorization': `Client-ID ${IMGUR_CLIENT_ID}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageBase64,
        type: 'base64',
        name: `logo-${req.user.companyId}-${Date.now()}`,
        title: `Logo de ${req.user.companyId}`
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error de Imgur:', errorData);
      throw new Error(`Imgur API error: ${errorData.data?.error || response.statusText}`);
    }

    const data = await response.json();
    const imgurUrl = data.data.link; // URL pública de Imgur

    // Actualizar el logo en la base de datos
    const updatedCompany = await Company.findOneAndUpdate(
      { companyId: req.user.companyId },
      { logo: imgurUrl },
      { new: true }
    );

    if (!updatedCompany) {
      return res.status(404).json({ message: 'Empresa no encontrada' });
    }

    console.log('✅ Logo subido exitosamente a Imgur:', imgurUrl);
    
    res.json({
      message: 'Logo subido exitosamente',
      logoUrl: imgurUrl,
      imgurData: {
        id: data.data.id,
        deleteHash: data.data.deletehash // Guárdalo si quieres poder eliminar la imagen después
      }
    });
  } catch (error) {
    console.error('Error al subir logo a Imgur:', error);
    res.status(500).json({ 
      message: 'Error al subir el logo', 
      error: error.message,
      hint: 'Verifica que IMGUR_CLIENT_ID esté configurado en las variables de entorno'
    });
  }
});

// Update company configuration (Admin only)
router.put('/config', auth, authorize('admin'), async (req, res) => {
  try {
    const { name, logo, settings, location, additionalInfo } = req.body;
    
    const updateData = {};
    
    if (name !== undefined) updateData.name = name;
    if (logo !== undefined) updateData.logo = logo;
    
    if (settings) {
      updateData.settings = {
        autoApproval: settings.autoApproval !== undefined ? settings.autoApproval : false,
        autoCheckIn: settings.autoCheckIn !== undefined ? settings.autoCheckIn : false,
        requirePhoto: settings.requirePhoto !== undefined ? settings.requirePhoto : true,
        enableSelfRegister: settings.enableSelfRegister !== undefined ? settings.enableSelfRegister : true,
        notificationEmail: settings.notificationEmail || null
      };
    }
    
    if (location) {
      updateData.location = {
        street: location.street || '',
        colony: location.colony || '',
        postalCode: location.postalCode || '',
        city: location.city || '',
        state: location.state || '',
        country: location.country || '',
        googleMapsUrl: location.googleMapsUrl || '',
        photo: location.photo || null,
        arrivalInstructions: location.arrivalInstructions || '',
        coordinates: location.coordinates || null
      };
    }
    
    if (additionalInfo) {
      updateData.additionalInfo = {
        phone: additionalInfo.phone || '',
        email: additionalInfo.email || '',
        website: additionalInfo.website || '',
        description: additionalInfo.description || ''
      };
    }
    
    const company = await Company.findOneAndUpdate(
      { companyId: req.user.companyId },
      updateData,
      { new: true, upsert: true }
    );

    res.json(company);
  } catch (error) {
    console.error('Update company config error:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
});

// Get company QR code
router.get('/qr-code', auth, async (req, res) => {
  try {
    console.log('Getting QR code for company:', req.user.companyId);
    
    let company = await Company.findOne({ companyId: req.user.companyId });
    
    if (!company) {
      console.log('Company not found for QR, creating default company');
      // Create default company if not exists
      company = new Company({
        companyId: req.user.companyId,
        name: 'Mi Empresa',
        settings: {
          autoApproval: false,
          autoCheckIn: false,
          requirePhoto: true,
          enableSelfRegister: true,
          notificationEmail: null
        }
      });
      await company.save();
    }

    // Generate QR URL for self-registration landing page
    const baseUrl = req.protocol + '://' + req.get('host');
    const publicUrl = `${baseUrl}/public/self-register`;
    
    // Generate QR code image from the URL
    const QRCode = require('qrcode');
    const qrCodeImage = await QRCode.toDataURL(publicUrl, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 2,
      width: 400,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    res.json({
      qrCode: company.qrCode,
      qrUrl: qrCodeImage, // Base64 image data
      publicUrl: publicUrl,
      companyName: company.name
    });
  } catch (error) {
    console.error('Get QR code error:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
});

/**
 * Endpoint público para servir logos de empresa con token JWT
 * GET /api/company/logo/:companyId/:token
 */
router.get('/logo/:companyId/:token', async (req, res) => {
  try {
    const { companyId, token } = req.params;
    
    console.log(`🏢 [COMPANY LOGO] Solicitud de logo para empresa: ${companyId}`);
    
    // Verificar el token JWT
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log(`✅ [COMPANY LOGO] Token válido:`, decoded);
    } catch (jwtError) {
      console.error('❌ [COMPANY LOGO] Token inválido o expirado:', jwtError.message);
      return res.status(401).json({ message: 'Token inválido o expirado' });
    }
    
    // Verificar que el token sea del tipo correcto
    if (decoded.type !== 'company-logo') {
      console.error('❌ [COMPANY LOGO] Tipo de token incorrecto:', decoded.type);
      return res.status(403).json({ message: 'Token no válido para este recurso' });
    }
    
    // Verificar que el companyId coincida
    if (decoded.companyId !== companyId) {
      console.error('❌ [COMPANY LOGO] CompanyId no coincide. Token:', decoded.companyId, 'URL:', companyId);
      return res.status(403).json({ message: 'Token no corresponde a esta empresa' });
    }
    
    // Buscar la empresa por _id (ObjectId) o por companyId (string tenant)
    let company = null;
    if (mongoose.Types.ObjectId.isValid(companyId)) {
      company = await Company.findById(companyId);
    }
    if (!company) {
      // Fallback: buscar por campo companyId (multi-tenant id)
      company = await Company.findOne({ companyId });
    }
    
    if (!company) {
      console.error('❌ [COMPANY LOGO] Empresa no encontrada:', companyId);
      return res.status(404).json({ message: 'Empresa no encontrada' });
    }
    
    // Verificar que la empresa tenga logo
    if (!company.logo) {
      console.log('⚠️ [COMPANY LOGO] Empresa sin logo configurado:', companyId);
      return res.status(404).json({ message: 'Logo no disponible' });
    }
    
    // Si el logo es Base64, servirlo directamente; si es URL, descargar y hacer proxy
    if (company.logo.startsWith('data:image')) {
      const matches = company.logo.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        console.error('❌ [COMPANY LOGO] Formato Base64 inválido');
        return res.status(400).json({ message: 'Formato de imagen inválido' });
      }
      const mimeType = `image/${matches[1]}`;
      const base64Data = matches[2];
      const imageBuffer = Buffer.from(base64Data, 'base64');
      console.log(`✅ [COMPANY LOGO] Logo Base64 servido. Tamaño: ${imageBuffer.length} bytes, Tipo: ${mimeType}`);
      res.set({
        'Content-Type': mimeType,
        'Content-Length': imageBuffer.length,
        'Cache-Control': 'public, max-age=604800',
        'ETag': `"${companyId}-${Date.now()}"`
      });
      return res.send(imageBuffer);
    } else if (company.logo.startsWith('http://') || company.logo.startsWith('https://')) {
      try {
        const fetch = (await import('node-fetch')).default;
        const resp = await fetch(company.logo);
        if (!resp.ok) {
          console.error('❌ [COMPANY LOGO] Error descargando logo URL:', resp.status, resp.statusText);
          return res.status(502).json({ message: 'No se pudo descargar el logo' });
        }
        const contentType = resp.headers.get('content-type') || 'image/png';
        const buffer = Buffer.from(await resp.arrayBuffer());
        console.log(`✅ [COMPANY LOGO] Logo URL proxied. Tamaño: ${buffer.length} bytes, Tipo: ${contentType}`);
        res.set({
          'Content-Type': contentType,
          'Content-Length': buffer.length,
          'Cache-Control': 'public, max-age=604800',
          'ETag': `"${companyId}-${Date.now()}"`
        });
        return res.send(buffer);
      } catch (proxyErr) {
        console.error('❌ [COMPANY LOGO] Proxy error:', proxyErr.message);
        return res.status(500).json({ message: 'Error al proxiar el logo', error: proxyErr.message });
      }
    } else {
      console.error('❌ [COMPANY LOGO] Formato de logo no soportado:', typeof company.logo);
      return res.status(400).json({ message: 'Formato de logo inválido' });
    }
    
  } catch (error) {
    console.error('❌ [COMPANY LOGO] Error al servir logo:', error);
    res.status(500).json({ message: 'Error al obtener logo', error: error.message });
  }
});

/**
 * Endpoint público para servir foto de ubicación de empresa con token JWT
 * GET /api/company/location-photo/:companyId/:token
 */
router.get('/location-photo/:companyId/:token', async (req, res) => {
  try {
    const { companyId, token } = req.params;
    
    console.log(`📍 [LOCATION PHOTO] Solicitud de foto de ubicación para empresa: ${companyId}`);
    
    // Verificar el token JWT
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log(`✅ [LOCATION PHOTO] Token válido:`, decoded);
    } catch (jwtError) {
      console.error('❌ [LOCATION PHOTO] Token inválido o expirado:', jwtError.message);
      return res.status(401).json({ message: 'Token inválido o expirado' });
    }
    
    // Verificar que el token sea del tipo correcto
    if (decoded.type !== 'location-photo') {
      console.error('❌ [LOCATION PHOTO] Tipo de token incorrecto:', decoded.type);
      return res.status(403).json({ message: 'Token no válido para este recurso' });
    }
    
    // Verificar que el companyId coincida
    if (decoded.companyId !== companyId) {
      console.error('❌ [LOCATION PHOTO] CompanyId no coincide. Token:', decoded.companyId, 'URL:', companyId);
      return res.status(403).json({ message: 'Token no corresponde a esta empresa' });
    }
    
    // Buscar la empresa por _id (ObjectId) o por companyId (string tenant)
    let company = null;
    if (mongoose.Types.ObjectId.isValid(companyId)) {
      company = await Company.findById(companyId);
    }
    if (!company) {
      // Fallback: buscar por campo companyId (multi-tenant id)
      company = await Company.findOne({ companyId });
    }
    
    if (!company) {
      console.error('❌ [LOCATION PHOTO] Empresa no encontrada:', companyId);
      return res.status(404).json({ message: 'Empresa no encontrada' });
    }
    
    // Verificar que la empresa tenga foto de ubicación
    if (!company.location?.photo) {
      console.log('⚠️ [LOCATION PHOTO] Empresa sin foto de ubicación configurada:', companyId);
      return res.status(404).json({ message: 'Foto de ubicación no disponible' });
    }
    
    // Verificar que la foto sea Base64
    if (!company.location.photo.startsWith('data:image')) {
      console.error('❌ [LOCATION PHOTO] Foto no es Base64:', companyId);
      return res.status(400).json({ message: 'Formato de foto inválido' });
    }
    
    // Extraer tipo MIME y datos Base64
    const matches = company.location.photo.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
    
    if (!matches || matches.length !== 3) {
      console.error('❌ [LOCATION PHOTO] Formato Base64 inválido');
      return res.status(400).json({ message: 'Formato de imagen inválido' });
    }
    
    const mimeType = `image/${matches[1]}`;
    const base64Data = matches[2];
    
    // Convertir Base64 a Buffer
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    console.log(`✅ [LOCATION PHOTO] Foto servida exitosamente. Tamaño: ${imageBuffer.length} bytes, Tipo: ${mimeType}`);
    
    // Configurar headers para caché y tipo de contenido
    res.set({
      'Content-Type': mimeType,
      'Content-Length': imageBuffer.length,
      'Cache-Control': 'public, max-age=604800', // 7 días de caché
      'ETag': `"${companyId}-location-${Date.now()}"` // ETag para validación de caché
    });
    
    // Enviar la imagen
    res.send(imageBuffer);
    
  } catch (error) {
    console.error('❌ [LOCATION PHOTO] Error al servir foto de ubicación:', error);
    res.status(500).json({ message: 'Error al obtener foto de ubicación', error: error.message });
  }
});

module.exports = router;