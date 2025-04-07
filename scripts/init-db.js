require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function initializeDatabase() {
  let connection = null;
  
  try {
    console.log('Đang thử kết nối đến MySQL...');
    
    // Thử kết nối đến MySQL server (không cần database)
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      connectTimeout: process.env.DB_CONNECT_TIMEOUT || 60000
    });
    
    console.log('Kết nối MySQL thành công!');
    
    // Tạo database nếu chưa tồn tại
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'license_manager'}`);
    console.log(`Database ${process.env.DB_NAME || 'license_manager'} được tạo hoặc đã tồn tại.`);

    // Sử dụng database
    await connection.query(`USE ${process.env.DB_NAME || 'license_manager'}`);

    // Tạo bảng users
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Bảng users được tạo hoặc đã tồn tại.');

    // Tạo bảng apps
    await connection.query(`
      CREATE TABLE IF NOT EXISTS apps (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('Bảng apps được tạo hoặc đã tồn tại.');

    // Tạo bảng license_keys
    await connection.query(`
      CREATE TABLE IF NOT EXISTS license_keys (
        id INT AUTO_INCREMENT PRIMARY KEY,
        app_id INT NOT NULL,
        license_key VARCHAR(100) NOT NULL UNIQUE,
        max_verifications INT DEFAULT 0,
        verifications_left INT DEFAULT 0,
        expiry_date DATETIME,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (app_id) REFERENCES apps(id) ON DELETE CASCADE
      )
    `);
    console.log('Bảng license_keys được tạo hoặc đã tồn tại.');

    // Tạo bảng verification_logs
    await connection.query(`
      CREATE TABLE IF NOT EXISTS verification_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        license_id INT NOT NULL,
        ip_address VARCHAR(45) NOT NULL,
        success BOOLEAN DEFAULT true,
        message TEXT,
        verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (license_id) REFERENCES license_keys(id) ON DELETE CASCADE
      )
    `);
    console.log('Bảng verification_logs được tạo hoặc đã tồn tại.');

    // Kiểm tra nếu admin user đã tồn tại
    const [users] = await connection.query('SELECT * FROM users WHERE username = ?', [process.env.ADMIN_USERNAME || 'admin']);
    
    if (!process.env.USE_ENV_ADMIN_ONLY && users.length === 0) {
      // Tạo admin user nếu chưa tồn tại
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin', 10);
      await connection.query(
        'INSERT INTO users (username, password) VALUES (?, ?)',
        [process.env.ADMIN_USERNAME || 'admin', hashedPassword]
      );
      console.log('Admin user được tạo thành công trong database.');
    } else if (process.env.USE_ENV_ADMIN_ONLY) {
      console.log('Chỉ sử dụng admin từ biến môi trường, không tạo user trong database.');
    } else {
      console.log('Admin user đã tồn tại trong database.');
    }

    console.log('\nKhởi tạo cơ sở dữ liệu hoàn tất!');
    console.log('\nThông tin đăng nhập mặc định:');
    console.log(`Username: ${process.env.ADMIN_USERNAME || 'admin'}`);
    console.log(`Password: ${process.env.ADMIN_PASSWORD || 'admin'} (nếu chưa thay đổi)`);
    
    if (process.env.ADMIN_SECRET_PATH) {
      console.log(`\nĐường dẫn đăng nhập bí mật: /${process.env.ADMIN_SECRET_PATH}`);
    }
    
  } catch (error) {
    console.error('Lỗi kết nối MySQL:', error);
    console.log('\nVui lòng kiểm tra:');
    console.log('1. MySQL đang chạy trên máy của bạn');
    console.log('2. Thông tin trong file .env là chính xác');
    console.log('3. User MySQL có quyền truy cập từ host của bạn');
    console.log('4. Không có tường lửa nào chặn kết nối');
    console.log('\nỨng dụng có thể cần DB_HOST=127.0.0.1 thay vì localhost trong một số trường hợp');
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Thêm xử lý lỗi khi script chạy độc lập
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

initializeDatabase(); 