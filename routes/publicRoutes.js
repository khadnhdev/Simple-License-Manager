const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

// Debug route - thêm tạm dòng này để kiểm tra
router.get('/convert-test', (req, res) => {
  res.send('Convert test route is working');
});

// Trang chuyển đổi license key
router.get('/convert', publicController.showConvertForm);
router.post('/convert', publicController.convertKey);

module.exports = router; 