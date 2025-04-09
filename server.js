require('dotenv').config();
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const flash = require('connect-flash');
const helmet = require('helmet');
const methodOverride = require('method-override');
const path = require('path');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const publicController = require('./controllers/publicController');

// Khởi tạo Express
const app = express();
const PORT = process.env.PORT || 3000;

// Cài đặt view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method'));
app.use(cookieParser());

// Session
const MemoryStore = session.MemoryStore;
app.use(session({
  secret: process.env.JWT_SECRET || 'secret',
  resave: false,
  saveUninitialized: true,
  store: new MemoryStore(),
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));

// Thêm config Debug session
if (process.env.NODE_ENV === 'development') {
  console.log('[SERVER] Session config:', {
    secret: process.env.JWT_SECRET ? 'Đã cấu hình' : 'Sử dụng mặc định',
    secure: process.env.NODE_ENV === 'production',
    saveUninitialized: true,
    resave: false
  });
}

// Flash messages
app.use(flash());
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.success = req.flash('success');
  res.locals.user = req.session.user || null;
  res.locals.path = req.path;
  next();
});

// Routes
const webRoutes = require('./routes/webRoutes');
const apiRoutes = require('./routes/apiRoutes');
const adminRoutes = require('./routes/adminRoutes');
const publicRoutes = require('./routes/publicRoutes');

// Đảm bảo đặt middleware theo thứ tự ưu tiên xử lý
app.use('/admin', adminRoutes);
app.use('/api', apiRoutes);
app.use('/', webRoutes);

// Thêm route chuyển đổi license trực tiếp trong server.js
app.get('/convert', publicController.showConvertForm);
app.post('/convert', publicController.convertKey);

// Error handling
app.use((req, res) => {
  res.status(404).render('error', { 
    title: '404 Không tìm thấy',
    message: 'Trang bạn đang tìm kiếm không tồn tại.' 
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { 
    title: 'Lỗi máy chủ',
    message: 'Đã xảy ra lỗi, vui lòng thử lại sau.' 
  });
});

// Tạo thư mục exports nếu chưa tồn tại
const exportDir = path.join(__dirname, 'exports');
if (!fs.existsSync(exportDir)) {
  fs.mkdirSync(exportDir, { recursive: true });
  console.log('Đã tạo thư mục exports');
}

// Khởi động server
app.listen(PORT, () => {
  console.log(`Server đang chạy trên cổng ${PORT}`);
}); 