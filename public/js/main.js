// Xác nhận xóa
document.addEventListener('DOMContentLoaded', function() {
  const deleteButtons = document.querySelectorAll('.btn-delete');
  
  deleteButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      if (!confirm('Bạn có chắc chắn muốn xóa?')) {
        e.preventDefault();
      }
    });
  });
});

// Hiển thị form tạo license key tùy chỉnh
function toggleCustomKey() {
  const checkbox = document.getElementById('use_custom_key');
  const customKeyField = document.getElementById('custom_key_field');
  
  if (checkbox && customKeyField) {
    customKeyField.style.display = checkbox.checked ? 'block' : 'none';
  }
}

// Khởi tạo datepicker nếu có
document.addEventListener('DOMContentLoaded', function() {
  // Add any additional JavaScript here
}); 