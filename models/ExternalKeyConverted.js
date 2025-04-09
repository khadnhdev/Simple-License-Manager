const { executeQuery } = require('../config/database');

class ExternalKeyConverted {
  static async getAll() {
    try {
      const [rows] = await executeQuery(`
        SELECT ekc.*, a.name as app_name
        FROM external_key_converted ekc
        JOIN apps a ON ekc.app_id = a.id
        ORDER BY ekc.created_at DESC
      `);
      return rows;
    } catch (error) {
      console.error('Error getting external keys:', error);
      throw error;
    }
  }

  static async getById(id) {
    try {
      const [rows] = await executeQuery('SELECT * FROM external_key_converted WHERE id = ?', [id]);
      return rows[0];
    } catch (error) {
      console.error('Error getting external key by id:', error);
      throw error;
    }
  }

  static async getByAppId(appId) {
    try {
      const [rows] = await executeQuery(`
        SELECT ekc.*, a.name as app_name
        FROM external_key_converted ekc
        JOIN apps a ON ekc.app_id = a.id
        WHERE ekc.app_id = ?
        ORDER BY ekc.created_at DESC
      `, [appId]);
      return rows;
    } catch (error) {
      console.error('Error getting external keys by app id:', error);
      throw error;
    }
  }

  static async findByExternalKey(externalKey, appId) {
    try {
      const [rows] = await executeQuery(`
        SELECT * FROM external_key_converted
        WHERE external_key_converted = ? AND app_id = ?
      `, [externalKey, appId]);
      return rows[0];
    } catch (error) {
      console.error('Error finding external key:', error);
      throw error;
    }
  }

  static async create(data) {
    try {
      const [result] = await executeQuery(`
        INSERT INTO external_key_converted 
        (external_key_converted, internal_key, app_id) 
        VALUES (?, ?, ?)
      `, [
        data.external_key_converted,
        data.internal_key,
        data.app_id
      ]);
      return result.insertId;
    } catch (error) {
      console.error('Error creating external key mapping:', error);
      throw error;
    }
  }

  static async update(id, data) {
    try {
      const [result] = await executeQuery(`
        UPDATE external_key_converted 
        SET external_key_converted = ?, internal_key = ?, app_id = ?
        WHERE id = ?
      `, [
        data.external_key_converted,
        data.internal_key,
        data.app_id,
        id
      ]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error updating external key mapping:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const [result] = await executeQuery('DELETE FROM external_key_converted WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting external key mapping:', error);
      throw error;
    }
  }
}

module.exports = ExternalKeyConverted; 