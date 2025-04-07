const User = require('../models/User');

const adminController = {
  // Hiển thị trang đăng nhập
  showLogin: (req, res) => {
    res.render('admin/login', { 
      title: 'Đăng nhập Admin',
      layout: './layouts/auth' // Sử dụng layout đơn giản cho trang đăng nhập
    });
  },

  // Xử lý đăng nhập
  login: async (req, res) => {
    const { username, password } = req.body;
    
    console.log(`[LOGIN] Đang thử đăng nhập với username: ${username}`);
    console.log(`[LOGIN] ENV admin username: ${process.env.ADMIN_USERNAME || 'admin'}`);
    
    try {
      // Tìm user theo username
      console.log(`[LOGIN] Đang tìm user...`);
      const user = await User.findByUsername(username);
      
      if (!user) {
        console.log(`[LOGIN] Không tìm thấy user: ${username}`);
        req.flash('error_msg', 'Tên đăng nhập hoặc mật khẩu không chính xác');
        return res.redirect('/admin/login');
      }
      
      console.log(`[LOGIN] Tìm thấy user: ${username}, đang xác thực mật khẩu...`);
      
      // Xác thực mật khẩu
      const isMatch = await User.validatePassword(user, password);
      
      if (!isMatch) {
        console.log(`[LOGIN] Mật khẩu không chính xác cho user: ${username}`);
        req.flash('error_msg', 'Tên đăng nhập hoặc mật khẩu không chính xác');
        return res.redirect('/admin/login');
      }
      
      console.log(`[LOGIN] Đăng nhập thành công cho user: ${username}`);
      
      // Lưu thông tin user vào session
      req.session.user = {
        id: user.id,
        username: user.username
      };
      
      console.log(`[LOGIN] Đã lưu thông tin user vào session:`, req.session.user);
      console.log(`[LOGIN] Session ID:`, req.session.id);
      
      // Đảm bảo session được lưu trước khi redirect
      req.session.save(err => {
        if (err) {
          console.error('[LOGIN] Lỗi lưu session:', err);
        }
        
        req.flash('success_msg', 'Đăng nhập thành công');
        console.log('[LOGIN] Chuyển hướng đến /admin/dashboard');
        return res.redirect('/admin/dashboard');
      });
    } catch (error) {
      console.error('[LOGIN] Lỗi đăng nhập:', error);
      let errorMessage = 'Có lỗi xảy ra, vui lòng thử lại sau';
      
      // Thêm thông báo cụ thể khi lỗi kết nối database
      if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
        errorMessage = 'Không thể kết nối đến cơ sở dữ liệu, vui lòng kiểm tra cấu hình';
      }
      
      req.flash('error_msg', errorMessage);
      res.redirect('/admin/login');
    }
  },

  // Hiển thị trang dashboard
  dashboard: async (req, res) => {
    res.render('admin/dashboard', { 
      title: 'Dashboard Admin',
      user: req.session.user
    });
  },

  // Đăng xuất
  logout: (req, res) => {
    req.session.destroy();
    res.redirect('/admin/login');
  }
};

module.exports = adminController; 