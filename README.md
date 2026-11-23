# 🐣 Chicken Account (บัญชีรายรับ-รายจ่าย โครงการเลี้ยงไก่ไข่)

เว็บแอปพลิเคชันสำหรับบันทึกรายรับ-รายจ่าย **"โครงการเลี้ยงไก่ไข่"** ออกแบบมาสำหรับใช้งานบนมือถือได้อย่างสะดวก รวดเร็ว และน่ารัก ด้วยโทนสีเหลือง-ขาวพาสเทล พร้อมฟอนต์ **Mali** รองรับการทำงานแบบ **Dual Mode** (รันตรงบน Google Apps Script หรือรันผ่าน GitHub Pages เชื่อมต่อฐานข้อมูล Google Sheets แบบเรียลไทม์) และรองรับมาตรฐาน **PWA (Progressive Web App)** เพิ่มลงหน้าจอโฮมบน iPhone / iPad / Android ได้เต็มจอโดยไม่ต้องโหลดผ่านสโตร์

🌐 **GitHub Pages URL (ตัวอย่างเมื่อเปิด Pages):** [https://bosu-nsoq.github.io/chicken-account/](https://bosu-nsoq.github.io/chicken-account/)

---

## ✨ ฟีเจอร์เด่นของระบบ

1. **บันทึกรายรับและรายจ่ายในคลิกเดียว:**
   - กรอกจำนวนเงินพร้อมเลือกรายการจากตัวเลือก หรือพิมพ์ระบุเองได้ทันที
   - มีหน้าต่างป๊อปอัพยืนยันความถูกต้องก่อนบันทึกข้อมูล
2. **สรุปยอดเงินคงเหลือเรียลไทม์:**
   - การ์ดแสดงยอดเงินคงเหลือสุทธิ (คำนวณจากรายรับ - รายจ่ายทั้งหมดในระบบ)
   - อัปเดตและเขียนยอดสุทธิลง Google Sheet อัตโนมัติ (ช่อง `F1` และ `F2`)
3. **ดึงรายการ Dropdown อัตโนมัติ:**
   - รายการใน Dropdown ดึงมาจากแถบ **Setting** ใน Google Sheets โดยตรง ทำให้แก้ไขหรือเพิ่มรายการได้ง่ายไม่ต้องแก้โค้ด
4. **ดูประวัติและจัดการรายการย้อนหลัง:**
   - ปุ่มลอย 📜 แตะเพื่อเลื่อนเปิดถาดประวัติ 5 รายการล่าสุด
   - มีปุ่มถังขยะ 🗑️ ลบรายการที่ไม่ต้องการได้ทันที พร้อมคำนวณยอดเงินคงเหลือใหม่ให้อัตโนมัติ
5. **รองรับ PWA (Progressive Web App):**
   - มี `manifest.json`, `sw.js` และ Apple Mobile Web App tags ครบถ้วน
   - สามารถกด "เพิ่มไปยังหน้าจอโฮม" (Add to Home Screen) บน iOS/Android ใช้งานเหมือนแอปพลิเคชันจริง ไม่มีแถบเบราว์เซอร์กวนใจ

---

## 📁 โครงสร้างไฟล์ในโปรเจกต์

```text
chicken-account/
├── Code.gs             # โค้ด Backend Google Apps Script (คำนวณยอด, ซิงค์ Sheets, รองรับ API Bridge)
├── Index.html          # โค้ด Frontend สำหรับ Google Apps Script (HtmlService Template)
├── index.html          # โค้ด Frontend สำหรับ GitHub Pages (เชื่อมต่อ API ข้ามโดเมน)
├── manifest.json       # ไฟล์ตั้งค่า PWA
├── sw.js               # Service Worker สำหรับแคชและการทำงานออฟไลน์
├── icon.svg            # ไอคอนแอปพลิเคชัน SVG ความละเอียดสูง
├── icon.png            # ไอคอนแอปพลิเคชัน PNG สำหรับอุปกรณ์พกพา
├── appsscript.json     # ไฟล์การตั้งค่า Google Apps Script Runtime
├── .gitignore          # ละเว้นไฟล์ที่ไม่จำเป็นในการ Push ขึ้น Git
└── README.md           # เอกสารและคู่มือการใช้งานระบบ
```

---

## 🚀 วิธีติดตั้งบน Google Apps Script

1. เปิด **Google Sheets** ของโครงการขึ้นมา (ต้องมี Sheet ชื่อ `Data` และ `Setting`)
   - แถบ **`Data`**: เก็บข้อมูล [Date, Type, Amount, Note]
   - แถบ **`Setting`**: ใส่รายการตัวเลือกในคอลัมน์ A (เริ่มแถวที่ 1 ลงมา)
2. ไปที่เมนู **ส่วนขยาย (Extensions)** > **Apps Script**
3. คัดลอกโค้ดจากไฟล์ [`Code.gs`](./Code.gs) ไปวางแทนที่โค้ดเดิมใน `Code.gs`
4. กดเครื่องหมาย `+` ด้านซ้ายมือ เลือก **HTML** แล้วตั้งชื่อว่า `Index`
5. คัดลอกโค้ดจากไฟล์ [`Index.html`](./Index.html) ไปวางในไฟล์ `Index.html`
6. กดปุ่ม **บันทึกโครงการ (Save 💾)**
7. กดปุ่ม **การทำให้ใช้งานได้ (Deploy)** > **การทำให้ใช้งานได้รายการใหม่ (New deployment)**:
   - เลือกประเภท: **เว็บแอป (Web app)**
   - คำอธิบาย: `Chicken Account v1`
   - ปฏิบัติการในฐานะ: **ฉัน (Me)**
   - ผู้ที่มีสิทธิ์เข้าถึง: **ทุกคน (Anyone)**
8. กด **ทำให้ใช้งานได้ (Deploy)** และคัดลอก **URL เว็บแอป** เก็บไว้

---

## 🐙 วิธีนำโค้ดขึ้น GitHub

รันคำสั่งเหล่านี้ใน Terminal / PowerShell ในโฟลเดอร์โปรเจกต์:

```bash
# 1. เข้าสู่โฟลเดอร์โปรเจกต์
cd chicken-account

# 2. ผูกกับ Repository ของคุณบน GitHub (เช่น chicken-account)
git remote add origin https://github.com/bosu-nsoq/chicken-account.git

# 3. ตรวจสอบ branch และ Push โค้ดขึ้น GitHub
git branch -M main
git push -u origin main
```

---

## 📲 วิธีเปิดใช้งาน GitHub Pages

1. เข้าไปที่หน้า Repository ของคุณบน GitHub (เช่น `https://github.com/bosu-nsoq/chicken-account/settings/pages`)
2. ในหัวข้อ **Build and deployment**:
   - **Source**: เลือก `Deploy from a branch`
   - **Branch**: เลือก `main` และโฟลเดอร์ `/ (root)`
   - กดปุ่ม **Save**
3. รอ 1–2 นาที จะสามารถเข้าใช้งานผ่านลิงก์ `https://<username>.github.io/<repo-name>/` ได้ทันที
4. เมื่อเปิดหน้าเว็บครั้งแรก หากใช้งานผ่าน GitHub Pages ระบบจะขึ้นหน้าต่างให้ใส่ Web App URL ของ Apps Script เพียงครั้งเดียว ข้อมูลจะเชื่อมต่อกับ Google Sheets โดยตรงทันที!
