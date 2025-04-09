const { executeQuery } = require('../config/database');

class App {
  static async getAll() {
    try {
      const [rows] = await executeQuery('SELECT * FROM apps ORDER BY name');
      return rows;
    } catch (error) {
      console.error('Error getting apps:', error);
      throw error;
    }
  }

  static async getById(id) {
    try {
      const [rows] = await executeQuery('SELECT * FROM apps WHERE id = ?', [id]);
      return rows[0];
    } catch (error) {
      console.error('Error getting app by id:', error);
      throw error;
    }
  }

  static async create(app) {
    try {
      const [result] = await executeQuery(
        'INSERT INTO apps (name, description, external_app_id, external_app_type) VALUES (?, ?, ?, ?)',
        [app.name, app.description, app.external_app_id, app.external_app_type]
      );
      return result.insertId;
    } catch (error) {
      console.error('Error creating app:', error);
      throw error;
    }
  }

  static async update(id, app) {
    try {
      const [result] = await executeQuery(
        'UPDATE apps SET name = ?, description = ?, external_app_id = ?, external_app_type = ? WHERE id = ?',
        [app.name, app.description, app.external_app_id, app.external_app_type, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error updating app:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const [result] = await executeQuery('DELETE FROM apps WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting app:', error);
      throw error;
    }
  }
}

module.exports = App; 