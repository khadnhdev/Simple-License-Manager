const { executeQuery } = require('../config/database');
const bcrypt = require('bcrypt');

class User {
  static async findByUsername(username) {
    console.log(`[USER] Tìm kiếm username: ${username} trong hệ thống...`);
    
    // Kiểm tra nếu là admin từ ENV
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    
    if (username === adminUsername) {
      console.log(`[USER] Tìm thấy user từ ENV: ${username}`);
      // Trả về user với mật khẩu từ ENV
      return {
        id: 0, // ID đặc biệt cho admin từ ENV
        username: adminUsername,
        password: process.env.ADMIN_PASSWORD || 'admin',
        is_env_user: true // Đánh dấu đây là user từ ENV
      };
    }
    
    // Nếu không phải admin từ ENV, tìm kiếm trong database
    try {
      console.log(`[USER] Tìm kiếm username: ${username} trong database...`);
      const [rows] = await executeQuery('SELECT * FROM users WHERE username = ?', [username]);
      if (rows && rows.length > 0) {
        console.log(`[USER] Đã tìm thấy user: ${username}, ID: ${rows[0].id}`);
        return rows[0];
      } else {
        console.log(`[USER] Không tìm thấy user: ${username}`);
        return null;
      }
    } catch (error) {
      console.error(`[USER] Lỗi tìm user ${username}:`, error);
      return null;
    }
  }

  static async validatePassword(user, password) {
    if (!user) {
      console.log('[USER] Không thể xác thực password vì user là null');
      return false;
    }

    try {
      console.log(`[USER] Đang xác thực password cho user: ${user.username}`);
      
      // Nếu là user từ ENV, so sánh trực tiếp
      if (user.is_env_user) {
        console.log('[USER] Xác thực password cho ENV user');
        const isValid = password === user.password;
        console.log(`[USER] Kết quả xác thực ENV password: ${isValid ? 'Thành công' : 'Thất bại'}`);
        return isValid;
      }
      
      // Nếu là user từ database, so sánh qua bcrypt
      const isValid = await bcrypt.compare(password, user.password);
      console.log(`[USER] Kết quả xác thực password: ${isValid ? 'Thành công' : 'Thất bại'}`);
      return isValid;
    } catch (error) {
      console.error('[USER] Lỗi xác thực password:', error);
      return false;
    }
  }
}

module.exports = User; 