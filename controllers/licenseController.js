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
      const apps = await App.getAll();
      
      res.render('admin/licenses/index', { 
        title: 'Quản lý License Keys',
        licenses,
        apps,
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
      // Lấy tất cả license keys với thông tin bổ sung của ứng dụng
      const licenses = await License.getAll();
      
      // Tạo thư mục exports nếu chưa tồn tại
      const exportDir = path.join(__dirname, '..', 'exports');
      if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
      }
      
      // Chuẩn bị dữ liệu cho CSV với các trường cần thiết và tên cột đẹp hơn
      const csvData = licenses.map(license => ({
        'Mã license': license.license_key,
        'Ứng dụng': license.app_name,
        'Số lần xác thực đã dùng': license.verification_count || 0,
        'Số lần xác thực tối đa': license.max_verifications === 0 ? 'Không giới hạn' : license.max_verifications,
        'Số lần còn lại': license.max_verifications === 0 ? 'Không giới hạn' : license.verifications_left,
        'Ngày tạo': formatDate(license.created_at),
        'Ngày hết hạn': license.expiry_date ? formatDate(license.expiry_date) : 'Không giới hạn',
        'Trạng thái': license.is_active ? 'Hoạt động' : 'Vô hiệu',
        'Lần xác thực cuối': license.last_verified ? formatDate(license.last_verified) : 'Chưa xác thực'
      }));
      
      // Tạo tên tệp với timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `licenses-export-${timestamp}.csv`;
      const filePath = path.join(exportDir, fileName);
      
      // Tạo CSV với các tùy chọn định dạng
      const csvOptions = { 
        header: true,
        quote: '"',
        delimiter: ',',
      };
      const parser = new Parser(csvOptions);
      const csv = parser.parse(csvData);
      
      // Ghi file CSV với encoding UTF-8 có BOM để Excel hiển thị tiếng Việt đúng
      fs.writeFileSync(filePath, '\ufeff' + csv, 'utf8');
      
      // Ghi log thông tin
      console.log(`Đã xuất ${licenses.length} license keys ra file CSV: ${fileName}`);
      
      // Tải file xuống
      res.download(filePath, `license-keys-${timestamp}.csv`, (err) => {
        if (err) {
          console.error('Lỗi khi tải file CSV:', err);
          if (!res.headersSent) {
            req.flash('error_msg', 'Có lỗi xảy ra khi tải file CSV');
            res.redirect('/admin/licenses');
          }
          return;
        }
        
        // Xóa file tạm sau khi tải xong
        setTimeout(() => {
          try {
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
              console.log(`Đã xóa file tạm: ${filePath}`);
            }
          } catch (e) {
            console.error('Lỗi khi xóa file tạm:', e);
          }
        }, 5000); // đợi 5 giây trước khi xóa để đảm bảo quá trình tải hoàn tất
      });
    } catch (error) {
      console.error('Lỗi khi xuất license keys ra CSV:', error);
      req.flash('error_msg', 'Có lỗi xảy ra khi xuất danh sách license keys');
      res.redirect('/admin/licenses');
    }
  },

  // Xuất danh sách license keys đã lọc ra file CSV
  exportFilteredCSV: async (req, res) => {
    try {
      const { app_id, status, from_date, to_date } = req.query;
      
      // Xây dựng điều kiện lọc
      const filters = {};
      if (app_id) filters.app_id = app_id;
      if (status) filters.is_active = status === 'active' ? 1 : 0;
      
      // Lấy danh sách license keys theo bộ lọc
      const licenses = await License.getFiltered(filters, from_date, to_date);
      
      // Chuẩn bị dữ liệu cho CSV
      const csvData = licenses.map(license => ({
        'Mã license': license.license_key,
        'Ứng dụng': license.app_name,
        'Số lần xác thực đã dùng': license.verification_count || 0,
        'Số lần xác thực tối đa': license.max_verifications === 0 ? 'Không giới hạn' : license.max_verifications,
        'Số lần còn lại': license.max_verifications === 0 ? 'Không giới hạn' : license.verifications_left,
        'Ngày tạo': formatDate(license.created_at),
        'Ngày hết hạn': license.expiry_date ? formatDate(license.expiry_date) : 'Không giới hạn',
        'Trạng thái': license.is_active ? 'Hoạt động' : 'Vô hiệu',
        'Lần xác thực cuối': license.last_verified ? formatDate(license.last_verified) : 'Chưa xác thực'
      }));
      
      // Tạo thư mục exports nếu chưa tồn tại
      const exportDir = path.join(__dirname, '..', 'exports');
      if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
      }
      
      // Tạo tên tệp với timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `licenses-filtered-export-${timestamp}.csv`;
      const filePath = path.join(exportDir, fileName);
      
      // Tạo CSV với các tùy chọn định dạng
      const csvOptions = { 
        header: true,
        quote: '"',
        delimiter: ',',
      };
      const parser = new Parser(csvOptions);
      const csv = parser.parse(csvData);
      
      // Ghi file CSV với encoding UTF-8 có BOM
      fs.writeFileSync(filePath, '\ufeff' + csv, 'utf8');
      
      // Ghi log thông tin
      console.log(`Đã xuất ${licenses.length} license keys (đã lọc) ra file CSV: ${fileName}`);
      
      // Tải file xuống
      res.download(filePath, `license-keys-filtered-${timestamp}.csv`, (err) => {
        if (err) {
          console.error('Lỗi khi tải file CSV:', err);
          if (!res.headersSent) {
            req.flash('error_msg', 'Có lỗi xảy ra khi tải file CSV');
            res.redirect('/admin/licenses');
          }
          return;
        }
        
        // Xóa file tạm sau khi tải xong
        setTimeout(() => {
          try {
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
              console.log(`Đã xóa file tạm: ${filePath}`);
            }
          } catch (e) {
            console.error('Lỗi khi xóa file tạm:', e);
          }
        }, 5000);
      });
    } catch (error) {
      console.error('Lỗi khi xuất license keys đã lọc ra CSV:', error);
      req.flash('error_msg', 'Có lỗi xảy ra khi xuất danh sách license keys');
      res.redirect('/admin/licenses');
    }
  }
};

// Helper function để định dạng ngày tháng
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

module.exports = licenseController; 