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

// Thêm route convert vào đây để đảm bảo nó được xử lý
router.get('/convert', (req, res, next) => {
  console.log('[ROUTES] Phát hiện route convert, chuyển tiếp đến controller');
  next();
});

// Safety entrance bí mật
const secretPath = process.env.ADMIN_SECRET_PATH || 'secret-admin-path';
router.get(`/${secretPath}`, isNotAuthenticated, verifyEntranceToken, adminController.showLogin);

// Mặc định chuyển hướng về trang chủ
router.get('*', (req, res, next) => {
  // Kiểm tra nếu route bắt đầu bằng /admin hoặc /convert, cho phép nó đi tiếp
  if (req.path.startsWith('/admin') || req.path.startsWith('/convert')) {
    console.log('[ROUTES] Phát hiện route đặc biệt, bỏ qua chuyển hướng mặc định:', req.path);
    return next();
  }
  
  console.log('[ROUTES] Chuyển hướng về trang chủ từ:', req.path);
  res.redirect('/');
});

// Kiểm tra xem có wildcard route ở đây không
// Ví dụ:
// router.get('*', (req, res) => {
//   res.redirect('/');
// });

module.exports = router; 