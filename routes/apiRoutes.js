const express = require('express');
const router = express.Router();
const verificationController = require('../controllers/verificationController');
const { verifyLimiter } = require('../middleware/rateLimit');
const { isAuthenticated } = require('../middleware/auth');

// API xác thực license key - có rate limit
router.post('/verify', verifyLimiter, verificationController.verify);

// API admin - cần xác thực
router.get('/logs/ip/:ip', isAuthenticated, verificationController.getLogsByIp);
router.get('/logs/app/:appId', isAuthenticated, verificationController.getLogsByApp);

module.exports = router; 