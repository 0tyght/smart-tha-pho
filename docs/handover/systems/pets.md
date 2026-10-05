# ระบบบริหารข้อมูลสุนัขและแมว — คู่มือนักพัฒนา

[กลับคู่มือหลัก](../README.md)

## ขอบเขตโค้ด

เว็บเจ้าหน้าที่อยู่ใน `apps/prms-tsm` ส่วน API, LINE และฐานข้อมูลใช้โครงการกลาง มีโค้ดสำหรับขึ้นทะเบียน ตรวจคำขอ จัดการเจ้าของ/สัตว์ วัคซีน ทำหมัน สถานะ โอนเจ้าของ แผนที่ รายงาน และข้อมูลอ้างอิง ต้องทดสอบตามบทบาทและพื้นที่ก่อนรับมอบ

ประชาชนทำรายการผ่านบทสนทนาและ Rich Menu ของ LINE OA; ไม่ต้องอธิบาย workflow ปัจจุบันเป็นการเปิด LIFF

## จุดเริ่มและไฟล์สำคัญ

| งาน | ไฟล์ที่ควรอ่าน |
| --- | --- |
| ประกอบเว็บ | `apps/prms-tsm/src/main.jsx`, `PrmsApp.jsx`, `composition-root/createPrmsApplicationController.js` |
| เรียก API | `apps/prms-tsm/src/composition-root/createPrmsApplication.js`, `application/PrmsApplicationFacade.js` |
| ตรวจคำขอ | `apps/prms-tsm/src/pages/RegistrationsPage.jsx`, `domain/RegistrationReviewPolicy.js` |
| เจ้าของและสัตว์ | `apps/prms-tsm/src/pages/OwnersPage.jsx`, `PetsPage.jsx` |
| บริการสุขภาพ | `apps/prms-tsm/src/pages/ServicesPage.jsx` |
| API ทะเบียน | `apps/api/src/app.js` กลุ่ม `/api/admin/registrations`, `/api/admin/citizen-submissions`, `/api/admin/pets` |
| ยืนยันข้อมูลที่ประชาชนส่ง | `apps/api/src/application/submissions/CitizenSubmissionApprovalService.js` |
| กฎสถานะ | `apps/api/src/domain/registrations/entities/Registration.js`, `domain/submissions/entities/CitizenSubmission.js`, `domain/pets/entities/Pet.js` |
| บทสนทนา LINE | `apps/api/src/modules/line/lineNativeCitizen.v10.js` |
| แจ้งเตือน | `apps/api/src/modules/line/lineNotifications.js` |
| schema | `database/bootstrap/create_tables.sql`, `database/migrations/017_pet_registry_completion.sql` |

ชื่อไฟล์ย่อของเว็บอยู่ภายใน `apps/prms-tsm/src/` ส่วนชื่อที่ขึ้นต้นด้วย `domain/` ในแถวกฎสถานะอยู่ภายใน `apps/api/src/`

## ลำดับข้อมูลหลัก

1. LINE รับคำขอ ข้อมูล และหลักฐาน แล้วผูกกับ LINE user/เจ้าของสัตว์
2. บันทึกคำขอขึ้นทะเบียนใน `registrations` หรือคำขอเปลี่ยนข้อมูลใน `citizen_submissions`
3. เว็บเรียกคิวตรวจสอบผ่าน API เจ้าหน้าที่ตรวจและแก้ข้อมูลตามสิทธิ์
4. API ตรวจสถานะ/version และยืนยันข้อมูลใน transaction
5. บันทึกข้อมูลทะเบียนหรือสุขภาพ พร้อมประวัติและ audit แล้วส่งผลผ่านกลไกแจ้งเตือน

ไม่ถือว่าข้อมูลที่ประชาชนเสนอเป็นข้อมูลทะเบียนที่รับรองแล้วทันที ต้องรักษาขั้นตรวจและการเปรียบเทียบ snapshot เพื่อป้องกันเขียนทับข้อมูลที่เปลี่ยนระหว่างตรวจ

## ตารางที่สัมพันธ์กับงาน

`villages` → `households` → `owners` → `pets` พร้อม `registrations`, `citizen_submissions`, `vaccination_records`, `sterilization_records`, `pet_status_history`, `pet_owner_history`, `attachments`, `notifications`, `audit_logs` และตาราง LINE จาก migrations

การใช้ `entity_type/entity_id` บางตารางเป็นการอ้างข้อมูลหลายประเภท ไม่ใช่ physical FK ทุกกรณี อ่าน DDL และ ERD ร่วมกันก่อนเพิ่ม cascade/delete

## ประเด็นที่ต้องรักษาเมื่อพัฒนาต่อ

- `NEED_MORE_INFO` ยังมีใน backend; เว็บตีความเป็น “รอเจ้าหน้าที่ดำเนินการ” อย่าเปลี่ยนเป็นขั้นส่งกลับให้ประชาชนแก้โดยไม่ตรวจข้อกำหนดและข้อความ LINE
- เปลี่ยนสถานะและโอนเจ้าของต้องรักษาประวัติ ไม่แก้เฉพาะข้อมูลปัจจุบัน
- ไฟล์หลักฐานใช้ private storage และ API ตรวจสิทธิ์ ห้ามเปิด direct public URL หรือเสิร์ฟโฟลเดอร์ uploads
- แยก SQL ที่ยังอยู่ใน `app.js` และ approval service ผ่าน repository ทีละ Use Case โดยมี characterization test
- ทดสอบ concurrent update, submission ซ้ำ, สัตว์ไม่อยู่ในบัญชี และสิทธิ์พื้นที่

เริ่มอ่าน test ที่ `apps/api/test/domainEntities.test.js`, `citizenSubmissionApproval.test.js`, `lineBot.test.js`, `lineNotifications.test.js` และ `apps/prms-tsm/test/domainPolicies.test.js` มีไฟล์ทดสอบไม่ได้หมายความว่าทดสอบกับฐานข้อมูลจริงครบแล้ว
