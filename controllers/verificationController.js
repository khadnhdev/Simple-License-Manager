const License = require('../models/License');
const App = require('../models/App');
const VerificationLog = require('../models/VerificationLog');
const moment = require('moment');

const verificationController = {
  // API xác thực license key
  verify: async (req, res) => {
    const { license_key, app_id } = req.body;
    const ip_address = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    
    // Xác thực input
    if (!license_key || !app_id) {
      return res.status(400).json({
        status: 'error',
        message: 'Thiếu thông tin bắt buộc (license_key hoặc app_id)'
      });
    }
    
    try {
      // Tìm license key theo app_id
      const license = await License.findByKeyAndApp(license_key, app_id);
      
      // Nếu không tìm thấy key
      if (!license) {
        // Ghi log thất bại
        await VerificationLog.create({
          license_id: 0, // Không tìm thấy license
          ip_address,
          success: false,
          message: 'License key không hợp lệ hoặc không tồn tại'
        });
        
        return res.status(404).json({
          status: 'error',
          message: 'License key không hợp lệ hoặc không tồn tại'
        });
      }
      
      // Kiểm tra nếu license đã bị hủy kích hoạt
      if (!license.is_active) {
        // Ghi log thất bại
        await VerificationLog.create({
          license_id: license.id,
          ip_address,
          success: false,
          message: 'License key đã bị hủy kích hoạt'
        });
        
        return res.status(403).json({
          status: 'error',
          message: 'License key đã bị hủy kích hoạt'
        });
      }
      
      // Kiểm tra nếu license đã hết hạn
      if (license.expiry_date && new Date(license.expiry_date) < new Date()) {
        // Ghi log thất bại
        await VerificationLog.create({
          license_id: license.id,
          ip_address,
          success: false,
          message: 'License key đã hết hạn'
        });
        
        return res.status(403).json({
          status: 'error',
          message: 'License key đã hết hạn'
        });
      }
      
      // Kiểm tra số lần xác thực còn lại
      if (license.max_verifications > 0 && license.verifications_left <= 0) {
        // Ghi log thất bại
        await VerificationLog.create({
          license_id: license.id,
          ip_address,
          success: false,
          message: 'Đã vượt quá số lần xác thực cho phép'
        });
        
        return res.status(403).json({
          status: 'error',
          message: 'Đã vượt quá số lần xác thực cho phép'
        });
      }
      
      // Nếu tất cả các kiểm tra đều thành công, giảm số lần xác thực và ghi log
      if (license.max_verifications > 0) {
        await License.decrementVerification(license.id);
      }
      
      // Ghi log thành công
      await VerificationLog.create({
        license_id: license.id,
        ip_address,
        success: true,
        message: 'Xác thực thành công'
      });
      
      return res.json({
        status: 'success',
        message: 'License key hợp lệ',
        data: {
          license_key: license.license_key,
          app_name: license.app_name,
          expiry_date: license.expiry_date,
          verifications_left: license.verifications_left > 0 ? license.verifications_left - 1 : 'unlimited'
        }
      });
    } catch (error) {
      console.error('Error verifying license:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Có lỗi xảy ra khi xác thực license key'
      });
    }
  },
  
  // Hiển thị tất cả logs cho admin
  showAllLogs: async (req, res) => {
    try {
      const logs = await VerificationLog.getAll();
      
      res.render('admin/logs/index', { 
        title: 'Nhật ký xác thực',
        logs
      });
    } catch (error) {
      console.error('Error getting all verification logs:', error);
      req.flash('error_msg', 'Có lỗi xảy ra khi tải nhật ký xác thực');
      res.redirect('/admin/dashboard');
    }
  },
  
  // API lấy logs theo IP
  getLogsByIp: async (req, res) => {
    try {
      const { ip } = req.params;
      const logs = await VerificationLog.getByIp(ip);
      
      res.json({
        status: 'success',
        data: logs
      });
    } catch (error) {
      console.error('Error getting logs by IP:', error);
      res.status(500).json({
        status: 'error',
        message: 'Có lỗi xảy ra khi lấy lịch sử xác thực theo IP'
      });
    }
  },
  
  // API lấy logs theo App
  getLogsByApp: async (req, res) => {
    try {
      const { appId } = req.params;
      const logs = await VerificationLog.getByAppId(appId);
      
      res.json({
        status: 'success',
        data: logs
      });
    } catch (error) {
      console.error('Error getting logs by app id:', error);
      res.status(500).json({
        status: 'error',
        message: 'Có lỗi xảy ra khi lấy lịch sử xác thực theo ứng dụng'
      });
    }
  }
};

module.exports = verificationController; 