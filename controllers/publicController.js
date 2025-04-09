const App = require('../models/App');
const License = require('../models/License');
const ExternalKeyConverted = require('../models/ExternalKeyConverted');
const axios = require('axios');
const randomstring = require('randomstring');

const publicController = {
  // Hiển thị form convert key
  showConvertForm: async (req, res) => {
    try {
      const apps = await App.getAll();
      
      // Lấy dữ liệu từ session nếu có
      const success = req.session.convertSuccess || null;
      
      // Log để debug
      console.log('Session convert success:', success);
      
      // Xóa dữ liệu khỏi session sau khi lấy
      req.session.convertSuccess = null;
      
      res.render('public/convert', { 
        title: 'License Key Converter',
        apps,
        success: success,
        errors: req.flash('error')
      });
    } catch (error) {
      console.error('Error loading convert form:', error);
      res.status(500).render('error', { 
        title: 'Error',
        message: 'An error occurred. Please try again later.' 
      });
    }
  },

  // Xử lý convert key
  convertKey: async (req, res) => {
    const { external_key, app_id } = req.body;
    
    if (!external_key || !app_id) {
      req.flash('error', 'Please enter both license key and application');
      return res.redirect('/convert');
    }
    
    try {
      // Kiểm tra xem key đã được convert chưa
      const existingMapping = await ExternalKeyConverted.findByExternalKey(external_key, app_id);
      
      if (existingMapping) {
        // Nếu đã convert, trả về key hiện có
        req.session.convertSuccess = {
          message: 'License key was previously converted',
          internalKey: existingMapping.internal_key
        };
        return res.redirect('/convert');
      }
      
      // Lấy thông tin app
      const app = await App.getById(app_id);
      if (!app) {
        req.flash('error', 'Application not found');
        return res.redirect('/convert');
      }
      
      const external_app_id = app.external_app_id;
      if (!external_app_id) {
        req.flash('error', 'Application is not configured for Gumroad');
        return res.redirect('/convert');
      }
      
      // Gọi API Gumroad để xác minh key
      try {
        const response = await axios.post('https://api.gumroad.com/v2/licenses/verify', 
          {
            product_id: external_app_id,
            license_key: external_key,
            increment_uses_count: true
          }, 
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        const data = response.data;
        console.log('Gumroad API response:', data); // Log để debug

        if (!data.success) {
          throw new Error(data.message || 'Invalid license key');
        }
        
        // Tạo license key mới
        const newKey = await License.generateKey(16);
        
        // Tạo license trong DB
        const license = {
          app_id: app_id,
          license_key: newKey,
          max_verifications: 0, // Không giới hạn
          expiry_date: null,
          is_active: true
        };
        
        const result = await License.create(license);
        
        // Lưu mapping
        await ExternalKeyConverted.create({
          external_key_converted: external_key,
          internal_key: newKey,
          app_id: app_id
        });
        
        // Thay vì redirect với query params, lưu dữ liệu vào session
        req.session.convertSuccess = {
          message: 'License key converted successfully!',
          internalKey: newKey
        };
        
        return res.redirect('/convert');
        
      } catch (error) {
        if (error.response && error.response.status === 404) {
          req.flash('error', 'Gumroad license key does not exist');
          return res.redirect('/convert');
        }
        
        console.error('License verification failed:', error);
        req.flash('error', `License verification error: ${error.message || 'Unknown error'}`);
        return res.redirect('/convert');
      }
      
    } catch (error) {
      console.error('Error converting key:', error);
      req.flash('error', 'An error occurred while converting the license key');
      return res.redirect('/convert');
    }
  }
};

module.exports = publicController; 