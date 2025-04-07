const { executeQuery } = require('../config/database');
const randomstring = require('randomstring');

class License {
  static async generateKey(length = 16) {
    return randomstring.generate({
      length: length,
      charset: 'alphanumeric',
      capitalization: 'uppercase'
    });
  }

  static async getAll() {
    try {
      console.log('[LICENSE] Đang lấy tất cả license...');
      const [rows] = await executeQuery(`
        SELECT l.*, a.name as app_name
        FROM license_keys l
        JOIN apps a ON l.app_id = a.id
        ORDER BY l.created_at DESC
      `);
      return rows;
    } catch (error) {
      console.error('Error getting licenses:', error);
      throw error;
    }
  }

  static async getByAppId(appId) {
    try {
      const [rows] = await executeQuery(`
        SELECT l.*, a.name as app_name
        FROM license_keys l
        JOIN apps a ON l.app_id = a.id
        WHERE l.app_id = ?
        ORDER BY l.created_at DESC
      `, [appId]);
      return rows;
    } catch (error) {
      console.error('Error getting licenses by app id:', error);
      throw error;
    }
  }

  static async getById(id) {
    try {
      const [rows] = await executeQuery('SELECT * FROM license_keys WHERE id = ?', [id]);
      return rows[0];
    } catch (error) {
      console.error(`Error getting license by ID ${id}:`, error);
      throw error;
    }
  }

  static async findByKeyAndApp(key, appId) {
    try {
      const [rows] = await executeQuery(`
        SELECT l.*, a.name as app_name
        FROM license_keys l
        JOIN apps a ON l.app_id = a.id
        WHERE l.license_key = ? AND l.app_id = ?
      `, [key, appId]);
      return rows[0];
    } catch (error) {
      console.error('Error finding license by key and app:', error);
      throw error;
    }
  }

  static async create(license) {
    const key = license.license_key || await this.generateKey();
    try {
      const [result] = await executeQuery(`
        INSERT INTO license_keys 
        (app_id, license_key, max_verifications, verifications_left, expiry_date, is_active) 
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        license.app_id,
        key,
        license.max_verifications,
        license.max_verifications, // Initially, verifications_left = max_verifications
        license.expiry_date,
        license.is_active || true
      ]);
      return { id: result.insertId, license_key: key };
    } catch (error) {
      console.error('Error creating license:', error);
      throw error;
    }
  }

  static async update(id, license) {
    try {
      const [result] = await executeQuery(`
        UPDATE license_keys 
        SET max_verifications = ?, verifications_left = ?, expiry_date = ?, is_active = ?
        WHERE id = ?
      `, [
        license.max_verifications,
        license.verifications_left,
        license.expiry_date,
        license.is_active,
        id
      ]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error updating license:', error);
      throw error;
    }
  }

  static async decrementVerification(id) {
    try {
      await executeQuery(`
        UPDATE license_keys 
        SET verifications_left = verifications_left - 1
        WHERE id = ? AND verifications_left > 0
      `, [id]);
      
      // Fetch updated license
      const [rows] = await executeQuery('SELECT * FROM license_keys WHERE id = ?', [id]);
      return rows[0];
    } catch (error) {
      console.error('Error decrementing verification:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const [result] = await executeQuery('DELETE FROM license_keys WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting license:', error);
      throw error;
    }
  }
}

module.exports = License; 