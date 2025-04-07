const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isNotAuthenticated } = require('../middleware/auth');
const { verifyEntranceToken } = require('../middleware/safetyEntrance');

// Trang chủ
router.get('/', (req, res) => {
  res.render('home', { 
    title: 'Hệ thống quản lý License Keys',
    layout: './layouts/public'
  });
});

// Safety entrance bí mật
const secretPath = process.env.ADMIN_SECRET_PATH || 'secret-admin-path';
router.get(`/${secretPath}`, isNotAuthenticated, verifyEntranceToken, adminController.showLogin);

// Mặc định chuyển hướng về trang chủ
router.get('*', (req, res, next) => {
  // Kiểm tra nếu route bắt đầu bằng /admin, cho phép nó đi tiếp đến routes admin
  if (req.path.startsWith('/admin')) {
    console.log('[ROUTES] Phát hiện route admin, bỏ qua chuyển hướng mặc định:', req.path);
    return next();
  }
  
  console.log('[ROUTES] Chuyển hướng về trang chủ từ:', req.path);
  res.redirect('/');
});

module.exports = router; 