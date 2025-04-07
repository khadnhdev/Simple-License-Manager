const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, '..', 'models');
const files = fs.readdirSync(modelsDir);

let updated = 0;
let skipped = 0;

files.forEach(file => {
  if (file.endsWith('.js')) {
    const filePath = path.join(modelsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Nếu file có import database module cũ
    if (content.includes("const db = require('../config/database')")) {
      // Thực hiện thay thế
      content = content.replace(
        "const db = require('../config/database')",
        "const { executeQuery } = require('../config/database')"
      );
      
      // Thay thế tất cả các lệnh db.query bằng executeQuery
      content = content.replace(/db\.query\(/g, 'executeQuery(');
      
      // Ghi lại file
      fs.writeFileSync(filePath, content);
      console.log(`Đã cập nhật: ${file}`);
      updated++;
    } else {
      console.log(`Đã bỏ qua: ${file} (không cần cập nhật)`);
      skipped++;
    }
  }
});

console.log(`\nTổng kết: ${updated} file đã cập nhật, ${skipped} file đã bỏ qua.`); 