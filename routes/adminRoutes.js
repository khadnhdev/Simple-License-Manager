const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const appController = require('../controllers/appController');
const licenseController = require('../controllers/licenseController');
const verificationController = require('../controllers/verificationController');
const { isAuthenticated, isNotAuthenticated } = require('../middleware/auth');
const { checkSafetyEntrance } = require('../middleware/safetyEntrance');

// Đăng nhập admin
router.get('/login', isNotAuthenticated, checkSafetyEntrance, adminController.showLogin);
router.post('/login', isNotAuthenticated, adminController.login);
router.get('/logout', adminController.logout);

// Dashboard
router.get('/dashboard', isAuthenticated, adminController.dashboard);

// Quản lý ứng dụng
router.get('/apps', isAuthenticated, appController.index);
router.get('/apps/create', isAuthenticated, appController.showCreate);
router.post('/apps', isAuthenticated, appController.create);
router.get('/apps/edit/:id', isAuthenticated, appController.showEdit);
router.put('/apps/:id', isAuthenticated, appController.update);
router.delete('/apps/:id', isAuthenticated, appController.delete);
router.get('/apps/:id', isAuthenticated, appController.showDetail);

// Quản lý license keys
router.get('/licenses', isAuthenticated, licenseController.index);
router.get('/licenses/create', isAuthenticated, licenseController.showCreate);
router.post('/licenses', isAuthenticated, licenseController.create);
router.get('/licenses/edit/:id', isAuthenticated, licenseController.showEdit);
router.put('/licenses/:id', isAuthenticated, licenseController.update);
router.delete('/licenses/:id', isAuthenticated, licenseController.delete);
router.get('/licenses/logs/:id', isAuthenticated, licenseController.showLogs);
router.get('/licenses/export', isAuthenticated, licenseController.exportCSV);

// Quản lý logs
router.get('/logs', isAuthenticated, verificationController.showAllLogs);

// Mặc định redirect về dashboard
router.get('/', isAuthenticated, (req, res) => {
  res.redirect('/admin/dashboard');
});

// Route debug cho session - chỉ dùng khi phát triển
if (process.env.NODE_ENV === 'development') {
  router.get('/debug/session', (req, res) => {
    res.json({
      sessionId: req.session.id,
      sessionExists: !!req.session,
      hasUser: !!req.session.user,
      user: req.session.user || null,
      cookies: req.cookies,
      signedCookies: req.signedCookies
    });
  });
}

module.exports = router; 