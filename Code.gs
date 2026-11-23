/**
 * บัญชีรายรับ-รายจ่าย โครงการเลี้ยงไก่ไข่ 🐣
 * Google Apps Script Backend (Code.gs)
 * รองรับทั้งการเปิดตรงผ่าน Web App และเชื่อมต่อผ่าน GitHub Pages (Dual Mode)
 */

function doGet(e) {
  // 1. รองรับการเรียกแบบ API (GET) จากหน้าเว็บ GitHub Pages
  if (e && e.parameter && e.parameter.action) {
    try {
      var action = e.parameter.action;
      var args = e.parameter.args ? JSON.parse(e.parameter.args) : [];
      var fn = (typeof globalThis !== 'undefined' && typeof globalThis[action] === 'function') 
               ? globalThis[action] 
               : (typeof this[action] === 'function' ? this[action] : null);

      if (!fn) {
        return ContentService.createTextOutput(JSON.stringify({ error: "ไม่พบฟังก์ชัน: " + action }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      var result = fn.apply(null, args);
      return ContentService.createTextOutput(JSON.stringify(result !== undefined ? result : { status: "success" }))
        .setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
      return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  // 2. โหมดเปิดเว็บแอปตรงใน Google Apps Script
  var template;
  try {
    template = HtmlService.createTemplateFromFile('index');
  } catch(err) {
    template = HtmlService.createTemplateFromFile('Index');
  }
  
  // ดึง Dropdown จาก Sheet Setting
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var settingSheet = ss.getSheetByName('Setting');
  var options = [];
  if (settingSheet) {
    var lastRow = settingSheet.getLastRow();
    if (lastRow > 0) {
      options = settingSheet.getRange(1, 1, lastRow, 1).getValues().flat().filter(String);
    }
  }
  template.dropdownOptions = options;
  
  return template.evaluate()
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover')
    .setTitle('Chicken Account')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * รองรับการเรียกแบบ API (POST) จากหน้าเว็บ GitHub Pages ข้ามโดเมน
 */
function doPost(e) {
  try {
    var contents = (e && e.postData && e.postData.contents) ? e.postData.contents : "{}";
    var data = JSON.parse(contents);
    var action = data.action;
    var args = data.args || [];
    
    var fn = (typeof globalThis !== 'undefined' && typeof globalThis[action] === 'function') 
             ? globalThis[action] 
             : (typeof this[action] === 'function' ? this[action] : null);

    if (!fn) {
      return ContentService.createTextOutput(JSON.stringify({ 
        error: "ไม่พบฟังก์ชัน: " + action 
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var result = fn.apply(null, args);
    return ContentService.createTextOutput(JSON.stringify(result !== undefined ? result : { status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ 
      error: "Error: " + err.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// อัปเดตยอดคงเหลือที่ F2
function updateSheetBalance(sheet) {
  var lastRow = sheet.getLastRow();
  var total = 0;
  
  if (lastRow >= 2) {
    // ดึง column B (Type) และ C (Amount)
    var data = sheet.getRange(2, 2, lastRow - 1, 2).getValues(); 
    data.forEach(r => {
      // เช็คค่าว่าเป็นตัวเลขหรือไม่เพื่อป้องกัน error
      var amount = parseFloat(r[1]) || 0;
      if(r[0] == 'รายรับ') total += amount;
      else if(r[0] == 'รายจ่าย') total -= amount;
    });
  }
  
  // เขียนลง Sheet
  sheet.getRange('F1').setValue('💰 ยอดเงินคงเหลือสุทธิ').setFontWeight('bold').setBackground('#FFD200');
  sheet.getRange('F2').setValue(total).setNumberFormat('#,##0.00');
  
  return total;
}

// บันทึกและส่งข้อมูลกลับ
function saveDataAndGetDashboard(type, amount, note) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Data');
  
  sheet.appendRow([new Date(), type, amount, note]);
  
  return getDashboardData();
}

// ลบและส่งข้อมูลกลับ
function deleteAndGetDashboard(rowNumber) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Data');
  
  try {
    sheet.deleteRow(rowNumber);
  } catch(e) {
    // กรณีลบไม่สำเร็จ (เช่นแถวหายไปแล้ว) ให้ข้ามไป
  }
  
  return getDashboardData();
}

// ดึงข้อมูลแสดงผล
function getDashboardData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Data');
  var settingSheet = ss.getSheetByName('Setting');
  var options = [];
  if (settingSheet) {
    var lastRow = settingSheet.getLastRow();
    if (lastRow > 0) {
      options = settingSheet.getRange(1, 1, lastRow, 1).getValues().flat().filter(String);
    }
  }
  
  var total = updateSheetBalance(sheet);
  
  return {
    total: total,
    recent: _getRecentList(sheet),
    dropdownOptions: options
  };
}

// ดึง 5 รายการล่าสุด (จัดรูปแบบวันที่จากที่นี่เลย เพื่อแก้ปัญหาไม่แสดงผล)
function _getRecentList(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  
  // ดึงข้อมูล 4 คอลัมน์แรก (Date, Type, Amount, Note)
  var data = sheet.getRange(2, 1, lastRow - 1, 4).getValues();
  
  var list = data.map((row, index) => {
    // แปลงวันที่เป็นข้อความไทยสวยๆ
    var dateStr = "";
    try {
      dateStr = Utilities.formatDate(new Date(row[0]), "GMT+7", "d MMM HH:mm");
    } catch (e) {
      dateStr = "-";
    }

    return {
      rowNumber: index + 2,
      dateStr: dateStr, // ส่งเป็นข้อความไปเลย
      type: row[1],
      amount: row[2],
      note: row[3]
    };
  });
  
  // กลับด้านเอาล่าสุดขึ้นก่อน ตัดมา 5 ตัว
  return list.reverse().slice(0, 5);
}
