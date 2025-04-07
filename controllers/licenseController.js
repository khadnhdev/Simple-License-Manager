const License = require('../models/License');
const App = require('../models/App');
const VerificationLog = require('../models/VerificationLog');
const moment = require('moment');
const fs = require('fs');
const path = require('path');
const { Parser } = require('json2csv');

const licenseController = {
  // Hiển thị danh sách tất cả license keys
  index: async (req, res) => {
    try {
      const licenses = await License.getAll();
      res.render('admin/licenses/index', { 
        title: 'Quản lý License Keys',
        licenses,
        moment
      });
    } catch (error) {
      console.error('Error getting licenses:', error);
      req.flash('error_msg', 'Có lỗi xảy ra khi tải dữ liệu license');
      res.redirect('/admin/dashboard');
    }
  },

  // Hiển thị form tạo license key mới
  showCreate: async (req, res) => {
    try {
      const apps = await App.getAll();
      res.render('admin/licenses/create', { 
        title: 'Tạo License Key mới',
        apps,
        appId: req.query.appId || ''
      });
    } catch (error) {
      console.error('Error getting apps for license creation:', error);
      req.flash('error_msg', 'Có lỗi xảy ra khi lấy danh sách ứng dụng');
      res.redirect('/admin/licenses');
    }
  },

  // Xử lý tạo license key mới
  create: async (req, res) => {
    const { app_id, quantity, max_verifications, expiry_date, custom_key } = req.body;
    
    // Validate input
    if (!app_id || !quantity || quantity < 1) {
      req.flash('error_msg', 'Vui lòng chọn một ứng dụng và nhập số lượng hợp lệ');
      return res.redirect('/admin/licenses/create');
    }
    
    try {
      const createdKeys = [];
      
      for (let i = 0; i < quantity; i++) {
        const license = {
          app_id,
          license_key: custom_key || undefined, // Sử dụng custom key nếu có
          max_verifications: parseInt(max_verifications) || 0,
          expiry_date: expiry_date || null,
          is_active: true
        };
        
        const result = await License.create(license);
        createdKeys.push(result.license_key);
      }
      
      req.flash('success_msg', `Tạo ${quantity} license key thành công: ${createdKeys.join(', ')}`);
      res.redirect('/admin/licenses');
    } catch (error) {
      console.error('Error creating license:', error);
      req.flash('error_msg', 'Có lỗi xảy ra khi tạo license key mới');
      res.redirect('/admin/licenses/create');
    }
  },

  // Hiển thị form chỉnh sửa license key
  showEdit: async (req, res) => {
    try {
      const license = await License.getById(req.params.id);
      
      if (!license) {
        req.flash('error_msg', 'Không tìm thấy license key');
        return res.redirect('/admin/licenses');
      }
      
      const apps = await App.getAll();
      
      res.render('admin/licenses/edit', { 
        title: 'Chỉnh sửa License Key',
        license,
        apps
      });
    } catch (error) {
      console.error('Error getting license for editing:', error);
      req.flash('error_msg', 'Có lỗi xảy ra khi lấy thông tin license key');
      res.redirect('/admin/licenses');
    }
  },

  // Xử lý cập nhật license key
  update: async (req, res) => {
    const { id } = req.params;
    const { max_verifications, verifications_left, expiry_date, is_active } = req.body;
    
    try {
      const license = {
        max_verifications: parseInt(max_verifications) || 0,
        verifications_left: parseInt(verifications_left) || 0,
        expiry_date: expiry_date || null,
        is_active: is_active === 'on'
      };
      
      const result = await License.update(id, license);
      
      if (result) {
        req.flash('success_msg', 'Cập nhật license key thành công');
      } else {
        req.flash('error_msg', 'Không tìm thấy license key để cập nhật');
      }
      
      res.redirect('/admin/licenses');
    } catch (error) {
      console.error('Error updating license:', error);
      req.flash('error_msg', 'Có lỗi xảy ra khi cập nhật license key');
      res.redirect(`/admin/licenses/edit/${id}`);
    }
  },

  // Xử lý xóa license key
  delete: async (req, res) => {
    try {
      const result = await License.delete(req.params.id);
      
      if (result) {
        req.flash('success_msg', 'Xóa license key thành công');
      } else {
        req.flash('error_msg', 'Không tìm thấy license key để xóa');
      }
      
      res.redirect('/admin/licenses');
    } catch (error) {
      console.error('Error deleting license:', error);
      req.flash('error_msg', 'Có lỗi xảy ra khi xóa license key');
      res.redirect('/admin/licenses');
    }
  },

  // Hiển thị logs của license key
  showLogs: async (req, res) => {
    try {
      const license = await License.getById(req.params.id);
      
      if (!license) {
        req.flash('error_msg', 'Không tìm thấy license key');
        return res.redirect('/admin/licenses');
      }
      
      const logs = await VerificationLog.getByLicenseId(license.id);
      
      res.render('admin/licenses/logs', { 
        title: `Lịch sử xác thực: ${license.license_key}`,
        license,
        logs
      });
    } catch (error) {
      console.error('Error getting license logs:', error);
      req.flash('error_msg', 'Có lỗi xảy ra khi lấy lịch sử xác thực');
      res.redirect('/admin/licenses');
    }
  },

  // Xuất danh sách license keys ra file CSV
  exportCSV: async (req, res) => {
    try {
      const licenses = await License.getAll(); // Lấy tất cả license keys
      const csv = new Parser().parse(licenses);
      
      // Tạo file CSV
      const filePath = path.join(__dirname, '..', 'exports', `licenses_${Date.now()}.csv`);
      fs.writeFileSync(filePath, csv);
      
      // Gửi file CSV cho người dùng
      res.download(filePath, 'licenses.csv', (err) => {
        if (err) {
          console.error('Error downloading file:', err);
          req.flash('error_msg', 'Có lỗi xảy ra khi tải file CSV');
          res.redirect('/admin/licenses');
        }
        
        // Xóa file sau khi tải xong
        fs.unlinkSync(filePath);
      });
    } catch (error) {
      console.error('Error exporting licenses to CSV:', error);
      req.flash('error_msg', 'Có lỗi xảy ra khi xuất danh sách license keys');
      res.redirect('/admin/licenses');
    }
  }
};

module.exports = licenseController; 