const App = require('../models/App');
const License = require('../models/License');

const appController = {
  // Hiển thị danh sách tất cả apps
  index: async (req, res) => {
    try {
      const apps = await App.getAll();
      res.render('admin/apps/index', { 
        title: 'Quản lý ứng dụng',
        apps
      });
    } catch (error) {
      console.error('Error getting apps:', error);
      req.flash('error_msg', 'Có lỗi xảy ra khi tải dữ liệu ứng dụng');
      res.redirect('/admin/dashboard');
    }
  },

  // Hiển thị form tạo app mới
  showCreate: (req, res) => {
    res.render('admin/apps/create', { 
      title: 'Tạo ứng dụng mới' 
    });
  },

  // Xử lý tạo app mới
  create: async (req, res) => {
    const { name, description } = req.body;
    
    // Validate input
    if (!name) {
      req.flash('error_msg', 'Tên ứng dụng không được để trống');
      return res.redirect('/admin/apps/create');
    }
    
    try {
      await App.create({ name, description });
      req.flash('success_msg', 'Tạo ứng dụng mới thành công');
      res.redirect('/admin/apps');
    } catch (error) {
      console.error('Error creating app:', error);
      req.flash('error_msg', 'Có lỗi xảy ra khi tạo ứng dụng mới');
      res.redirect('/admin/apps/create');
    }
  },

  // Hiển thị form chỉnh sửa app
  showEdit: async (req, res) => {
    try {
      const app = await App.getById(req.params.id);
      
      if (!app) {
        req.flash('error_msg', 'Không tìm thấy ứng dụng');
        return res.redirect('/admin/apps');
      }
      
      res.render('admin/apps/edit', { 
        title: 'Chỉnh sửa ứng dụng',
        app
      });
    } catch (error) {
      console.error('Error getting app:', error);
      req.flash('error_msg', 'Có lỗi xảy ra khi lấy thông tin ứng dụng');
      res.redirect('/admin/apps');
    }
  },

  // Xử lý cập nhật app
  update: async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;
    
    // Validate input
    if (!name) {
      req.flash('error_msg', 'Tên ứng dụng không được để trống');
      return res.redirect(`/admin/apps/edit/${id}`);
    }
    
    try {
      const result = await App.update(id, { name, description });
      
      if (result) {
        req.flash('success_msg', 'Cập nhật ứng dụng thành công');
      } else {
        req.flash('error_msg', 'Không tìm thấy ứng dụng để cập nhật');
      }
      
      res.redirect('/admin/apps');
    } catch (error) {
      console.error('Error updating app:', error);
      req.flash('error_msg', 'Có lỗi xảy ra khi cập nhật ứng dụng');
      res.redirect(`/admin/apps/edit/${id}`);
    }
  },

  // Xử lý xóa app
  delete: async (req, res) => {
    try {
      const result = await App.delete(req.params.id);
      
      if (result) {
        req.flash('success_msg', 'Xóa ứng dụng thành công');
      } else {
        req.flash('error_msg', 'Không tìm thấy ứng dụng để xóa');
      }
      
      res.redirect('/admin/apps');
    } catch (error) {
      console.error('Error deleting app:', error);
      req.flash('error_msg', 'Có lỗi xảy ra khi xóa ứng dụng');
      res.redirect('/admin/apps');
    }
  },

  // Hiển thị chi tiết app với danh sách license keys
  showDetail: async (req, res) => {
    try {
      const app = await App.getById(req.params.id);
      
      if (!app) {
        req.flash('error_msg', 'Không tìm thấy ứng dụng');
        return res.redirect('/admin/apps');
      }
      
      const licenses = await License.getByAppId(app.id);
      
      res.render('admin/apps/detail', { 
        title: `Chi tiết ứng dụng: ${app.name}`,
        app,
        licenses
      });
    } catch (error) {
      console.error('Error getting app details:', error);
      req.flash('error_msg', 'Có lỗi xảy ra khi lấy thông tin chi tiết ứng dụng');
      res.redirect('/admin/apps');
    }
  }
};

module.exports = appController; 