const { executeQuery } = require('../config/database');

class VerificationLog {
  static async create(log) {
    try {
      const [result] = await executeQuery(`
        INSERT INTO verification_logs 
        (license_id, ip_address, success, message) 
        VALUES (?, ?, ?, ?)
      `, [
        log.license_id,
        log.ip_address,
        log.success,
        log.message
      ]);
      return result.insertId;
    } catch (error) {
      console.error('Error creating verification log:', error);
      throw error;
    }
  }

  static async getByLicenseId(licenseId) {
    try {
      const [rows] = await executeQuery(`
        SELECT * FROM verification_logs
        WHERE license_id = ?
        ORDER BY verified_at DESC
      `, [licenseId]);
      return rows;
    } catch (error) {
      console.error('Error getting logs by license id:', error);
      throw error;
    }
  }

  static async getAll(limit = 100) {
    try {
      const [rows] = await executeQuery(`
        SELECT vl.*, lk.license_key, a.name as app_name
        FROM verification_logs vl
        JOIN license_keys lk ON vl.license_id = lk.id
        JOIN apps a ON lk.app_id = a.id
        ORDER BY vl.verified_at DESC
        LIMIT ?
      `, [limit]);
      return rows;
    } catch (error) {
      console.error('Error getting all verification logs:', error);
      throw error;
    }
  }

  static async getByIp(ip, limit = 100) {
    try {
      const [rows] = await executeQuery(`
        SELECT vl.*, lk.license_key, a.name as app_name
        FROM verification_logs vl
        JOIN license_keys lk ON vl.license_id = lk.id
        JOIN apps a ON lk.app_id = a.id
        WHERE vl.ip_address = ?
        ORDER BY vl.verified_at DESC
        LIMIT ?
      `, [ip, limit]);
      return rows;
    } catch (error) {
      console.error('Error getting logs by IP:', error);
      throw error;
    }
  }

  static async getByAppId(appId, limit = 100) {
    try {
      const [rows] = await executeQuery(`
        SELECT vl.*, lk.license_key, a.name as app_name
        FROM verification_logs vl
        JOIN license_keys lk ON vl.license_id = lk.id
        JOIN apps a ON lk.app_id = a.id
        WHERE lk.app_id = ?
        ORDER BY vl.verified_at DESC
        LIMIT ?
      `, [appId, limit]);
      return rows;
    } catch (error) {
      console.error('Error getting logs by app id:', error);
      throw error;
    }
  }
}

module.exports = VerificationLog; 