/**
 * Chicken - แอปบันทึกรายรับรายจ่าย กิจกรรมเลี้ยงไก่ไข่ 🐣
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
    .setTitle('Chicken')
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

// ดึงข้อมูลแสดงผลแดชบอร์ด
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

// ดึง 5 รายการล่าสุด
function _getRecentList(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  
  // ดึงข้อมูล 4 คอลัมน์แรก (Date, Type, Amount, Note)
  var data = sheet.getRange(2, 1, lastRow - 1, 4).getValues();
  
  var list = data.map((row, index) => {
    var dateStr = "";
    try {
      dateStr = Utilities.formatDate(new Date(row[0]), "GMT+7", "d MMM HH:mm");
    } catch (e) {
      dateStr = "-";
    }

    return {
      rowNumber: index + 2,
      dateStr: dateStr,
      type: row[1],
      amount: row[2],
      note: row[3]
    };
  });
  
  // กลับด้านเอาล่าสุดขึ้นก่อน ตัดมา 5 ตัว
  return list.reverse().slice(0, 5);
}

// -------------------------------------------------------------
// ระบบพิมพ์รายงานบัญชี (Print Report System)
// -------------------------------------------------------------

/**
 * ดึงข้อมูลรายงานบัญชีตามช่วงเวลาที่กำหนด
 */
function getReportData(range) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Data');
  if (!sheet) return [];
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  var data = sheet.getRange(2, 1, lastRow - 1, 4).getValues();
  var today = new Date();
  var result = [];

  for (var i = 0; i < data.length; i++) {
    var rawDate = data[i][0];
    var d = new Date(rawDate);
    if (isNaN(d.getTime())) continue;

    if (checkDateMatch(d, today, range)) {
      var dBE = d.getFullYear() + 543;
      var dateBE = Utilities.formatDate(d, "GMT+7", "dd/MM/") + dBE;
      var timeStr = Utilities.formatDate(d, "GMT+7", "HH:mm");
      var type = String(data[i][1] || '').trim();
      var amount = parseFloat(data[i][2]) || 0;
      var note = String(data[i][3] || '').trim();

      result.push({
        rowNumber: i + 2,
        date: dateBE,
        time: timeStr,
        type: type,
        amount: amount,
        note: note
      });
    }
  }

  return result;
}

/**
 * ฟังก์ชันตรวจสอบวันที่ตามช่วงเวลา (รายวัน, รายเดือน, รายปี, หรือทั้งหมด)
 */
function checkDateMatch(rowDate, today, range) {
  if (!rowDate) return false;
  if (typeof range === 'object' && range !== null) {
    if (range.type === 'custom_day') {
      var val = String(range.value).trim();
      var y, m, d;
      if (val.includes('/')) {
        var parts = val.split('/');
        d = parseInt(parts[0], 10);
        m = parseInt(parts[1], 10) - 1;
        y = parseInt(parts[2], 10);
      } else {
        var parts = val.split('-');
        y = parseInt(parts[0], 10);
        m = parseInt(parts[1], 10) - 1;
        d = parseInt(parts[2], 10);
      }
      if (y > 2400) y -= 543;
      return (rowDate.getDate() == d && rowDate.getMonth() == m && rowDate.getFullYear() == y);
    } else if (range.type === 'custom_month') {
      var parts = String(range.value).trim().split('-');
      var y = parseInt(parts[0], 10);
      var m = parseInt(parts[1], 10) - 1;
      if (y > 2400) y -= 543;
      return (rowDate.getMonth() == m && rowDate.getFullYear() == y);
    } else if (range.type === 'custom_year') {
      var y = parseInt(range.value, 10);
      if (y > 2400) y -= 543;
      return (rowDate.getFullYear() == y);
    }
  } else if (range === 'all') {
    return true;
  }
  return false;
}
