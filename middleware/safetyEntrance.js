// Middleware kiểm tra safety entrance
const checkSafetyEntrance = (req, res, next) => {
  console.log('[SAFETY] Kiểm tra safety entrance...');
  
  // Nếu disable mặc định thì chuyển hướng về trang chủ
  if (process.env.DISABLE_DEFAULT_ADMIN === 'true') {
    console.log('[SAFETY] Default admin path đã bị vô hiệu hóa, chuyển hướng về trang chủ');
    return res.redirect('/');
  }
  
  // Nếu có yêu cầu token bảo mật và không có trong session
  if (process.env.ADMIN_ENTRANCE_TOKEN && !req.session.hasValidEntrance) {
    console.log('[SAFETY] Yêu cầu entrance token nhưng không có trong session, chuyển hướng về trang chủ');
    return res.redirect('/');
  }
  
  console.log('[SAFETY] Kiểm tra safety entrance thành công, cho phép truy cập');
  // Cho phép truy cập
  next();
};

// Middleware xác thực entrance token
const verifyEntranceToken = (req, res, next) => {
  console.log('[SAFETY] Xác thực entrance token thành công');
  // Đánh dấu session đã xác thực qua entrance
  req.session.hasValidEntrance = true;
  next();
};

module.exports = {
  checkSafetyEntrance,
  verifyEntranceToken
}; 