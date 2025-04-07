const rateLimit = require('express-rate-limit');

// Giới hạn số lần gọi API verify
const verifyLimiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15 phút
  max: process.env.RATE_LIMIT_MAX || 100, // Giới hạn mỗi IP trong windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Quá nhiều yêu cầu từ địa chỉ IP này, vui lòng thử lại sau.'
  }
});

module.exports = {
  verifyLimiter
}; 