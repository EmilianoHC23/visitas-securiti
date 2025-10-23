const express = require('express');
const Company = require('../models/Company');
const { auth, authorize } = require('../middleware/auth');
const multer = require('multer');

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
        address: location.address || '',
        city: location.city || '',
        country: location.country || 'México',
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

    // Generate QR URL for self-registration
    const baseUrl = req.protocol + '://' + req.get('host');
    const qrUrl = `${baseUrl}/register/${company.qrCode}`;
    
    res.json({
      qrCode: company.qrCode,
      qrUrl: qrUrl,
      publicUrl: qrUrl,
      companyName: company.name
    });
  } catch (error) {
    console.error('Get QR code error:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
});

module.exports = router;