module.exports = {
  // Kiểm tra nếu user đã đăng nhập
  isAuthenticated: (req, res, next) => {
    console.log('[AUTH] Kiểm tra xác thực, session:', req.session.id);
    console.log('[AUTH] Session user:', req.session.user);
    
    if (req.session.user) {
      console.log('[AUTH] Người dùng đã đăng nhập, cho phép truy cập');
      return next();
    }
    
    console.log('[AUTH] Người dùng chưa đăng nhập, chuyển hướng đến trang đăng nhập');
    req.flash('error_msg', 'Vui lòng đăng nhập để truy cập');
    res.redirect('/admin/login');
  },
  
  // Kiểm tra nếu user chưa đăng nhập (cho trang login)
  isNotAuthenticated: (req, res, next) => {
    console.log('[AUTH] Kiểm tra chưa xác thực, session user:', req.session.user);
    if (!req.session.user) {
      console.log('[AUTH] Người dùng chưa đăng nhập, cho phép truy cập trang đăng nhập');
      return next();
    }
    console.log('[AUTH] Người dùng đã đăng nhập, chuyển hướng đến dashboard');
    res.redirect('/admin/dashboard');
  }
}; 