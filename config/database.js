const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'license_manager',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 60000,
  acquireTimeout: 60000,
  timeout: 60000
});

const executeQuery = async (query, params = []) => {
  let retries = 3;
  let lastError = null;
  
  console.log(`[DB] Thực thi truy vấn: ${query.substring(0, 100)}...`);
  if (params && params.length > 0) {
    console.log(`[DB] Tham số:`, params);
  }
  
  while (retries > 0) {
    try {
      const result = await pool.query(query, params);
      console.log(`[DB] Truy vấn thành công`);
      return result;
    } catch (error) {
      lastError = error;
      console.error(`[DB] Lỗi truy vấn:`, error);
      if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
        console.log(`[DB] Kết nối database thất bại, thử lại (${retries} lần còn lại)...`);
        retries--;
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        // Nếu không phải lỗi kết nối, ném lỗi ngay lập tức
        throw error;
      }
    }
  }
  
  // Nếu đã thử hết số lần mà vẫn lỗi
  console.error(`[DB] Đã thử ${3 - retries} lần nhưng vẫn thất bại`);
  throw lastError;
};

module.exports = {
  pool,
  executeQuery
}; 