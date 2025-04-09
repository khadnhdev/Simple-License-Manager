const express = require('express');
const router = express.Router();
const verificationController = require('../controllers/verificationController');
const { verifyLimiter } = require('../middleware/rateLimit');
const { isAuthenticated } = require('../middleware/auth');
const ExternalKeyConverted = require('../models/ExternalKeyConverted');

// API xác thực license key - có rate limit
router.post('/verify', verifyLimiter, verificationController.verify);

// API admin - cần xác thực
router.get('/logs/ip/:ip', isAuthenticated, verificationController.getLogsByIp);
router.get('/logs/app/:appId', isAuthenticated, verificationController.getLogsByApp);

router.post('/convert-key', async (req, res) => {
  try {
    const { external_key, app_id } = req.body;
    
    if (!external_key || !app_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const keyMapping = await ExternalKeyConverted.findByExternalKey(external_key, app_id);
    
    if (!keyMapping) {
      return res.status(404).json({ error: 'External key not found' });
    }
    
    return res.json({ 
      success: true, 
      internal_key: keyMapping.internal_key 
    });
  } catch (error) {
    console.error('Error converting key:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 