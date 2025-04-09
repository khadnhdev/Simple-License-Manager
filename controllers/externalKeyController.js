const ExternalKeyConverted = require('../models/ExternalKeyConverted');
const App = require('../models/App');

const externalKeyController = {
  // Hiển thị danh sách các external key
  index: async (req, res) => {
    try {
      const externalKeys = await ExternalKeyConverted.getAll();
      res.render('admin/external-keys/index', { 
        title: 'Quản lý External Keys',
        externalKeys
      });
    } catch (error) {
      console.error('Error getting external keys:', error);
      req.flash('error_msg', 'Có lỗi xảy ra khi tải dữ liệu external keys');
      res.redirect('/admin/dashboard');
    }
  },

  // Hiển thị form tạo external key mới
  showCreate: async (req, res) => {
    try {
      const apps = await App.getAll();
      res.render('admin/external-keys/create', { 
        title: 'Tạo External Key mới',
        apps,
        appId: req.query.appId || ''
      });
    } catch (error) {
      console.error('Error getting apps for external key creation:', error);
      req.flash('error_msg', 'Có lỗi xảy ra khi lấy danh sách ứng dụng');
      res.redirect('/admin/external-keys');
    }
  },

  // Xử lý tạo external key mới
  create: async (req, res) => {
    const { app_id, external_key_converted, internal_key } = req.body;
    
    // Validate input
    if (!app_id || !external_key_converted || !internal_key) {
      req.flash('error_msg', 'Vui lòng điền đầy đủ thông tin');
      return res.redirect('/admin/external-keys/create');
    }
    
    try {
      const result = await ExternalKeyConverted.create({
        app_id,
        external_key_converted,
        internal_key
      });
      
      req.flash('success_msg', 'Tạo external key mapping thành công');
      res.redirect('/admin/external-keys');
    } catch (error) {
      console.error('Error creating external key mapping:', error);
      req.flash('error_msg', 'Có lỗi xảy ra khi tạo external key mapping');
      res.redirect('/admin/external-keys/create');
    }
  },

  // Hiển thị form chỉnh sửa external key
  showEdit: async (req, res) => {
    try {
      const externalKey = await ExternalKeyConverted.getById(req.params.id);
      
      if (!externalKey) {
        req.flash('error_msg', 'Không tìm thấy external key');
        return res.redirect('/admin/external-keys');
      }
      
      const apps = await App.getAll();
      
      res.render('admin/external-keys/edit', { 
        title: 'Chỉnh sửa External Key',
        externalKey,
        apps
      });
    } catch (error) {
      console.error('Error getting external key for editing:', error);
      req.flash('error_msg', 'Có lỗi xảy ra khi lấy thông tin external key');
      res.redirect('/admin/external-keys');
    }
  },

  // Xử lý cập nhật external key
  update: async (req, res) => {
    const { id } = req.params;
    const { app_id, external_key_converted, internal_key } = req.body;
    
    // Validate input
    if (!app_id || !external_key_converted || !internal_key) {
      req.flash('error_msg', 'Vui lòng điền đầy đủ thông tin');
      return res.redirect(`/admin/external-keys/edit/${id}`);
    }
    
    try {
      const result = await ExternalKeyConverted.update(id, {
        app_id,
        external_key_converted,
        internal_key
      });
      
      if (result) {
        req.flash('success_msg', 'Cập nhật external key mapping thành công');
      } else {
        req.flash('error_msg', 'Không tìm thấy external key để cập nhật');
      }
      
      res.redirect('/admin/external-keys');
    } catch (error) {
      console.error('Error updating external key mapping:', error);
      req.flash('error_msg', 'Có lỗi xảy ra khi cập nhật external key mapping');
      res.redirect(`/admin/external-keys/edit/${id}`);
    }
  },

  // Xử lý xóa external key
  delete: async (req, res) => {
    try {
      const result = await ExternalKeyConverted.delete(req.params.id);
      
      if (result) {
        req.flash('success_msg', 'Xóa external key mapping thành công');
      } else {
        req.flash('error_msg', 'Không tìm thấy external key để xóa');
      }
      
      res.redirect('/admin/external-keys');
    } catch (error) {
      console.error('Error deleting external key mapping:', error);
      req.flash('error_msg', 'Có lỗi xảy ra khi xóa external key mapping');
      res.redirect('/admin/external-keys');
    }
  }
};

module.exports = externalKeyController; 