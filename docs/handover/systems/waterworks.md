# ระบบมอนิเตอร์การใช้น้ำประปา — คู่มือนักพัฒนา

[กลับคู่มือหลัก](../README.md)

## สถานะที่พบ

มีแดชบอร์ด ผังผลิตและจ่ายน้ำ และรายละเอียด 8 จุดตรวจวัด ข้อมูลที่ใช้เป็นค่าจำลองจาก `InMemoryWaterTelemetryRepository` ที่คืน `dataMode: "simulation"` ไม่ได้อ่านเซนเซอร์ PLC, V-BOX หรือ V-NET 2.0 จริง

หน้าเว็บโหลด snapshot ทุก 30 วินาที การอัปเดต `updatedAt` ไม่ได้ยืนยันว่าค่าเซนเซอร์จริงใหม่ ยังไม่พบ API/schema สำหรับอ่านมิเตอร์ผู้ใช้น้ำ ค่าบริการ สมดุลน้ำ หรือ LINE Alarm ครบตามแบบออกแบบ

## จุดเริ่มและไฟล์สำคัญ

path ในตารางเริ่มจาก `apps/waterworks-management/src/`

| ไฟล์ | หน้าที่ |
| --- | --- |
| `main.jsx` | ประกอบ controller แล้ว render เว็บ |
| `composition-root/createWaterworksApplication.js` | ฉีด telemetry repository และ system controller |
| `application/WaterworksDashboardController.js` | โหลด snapshot แปลงเป็น view model และประสาน session |
| `domain/WaterMonitoringPoint.js` | `WaterMonitoringPoint`, `WaterTreatmentSystem`, สถานะและสรุปข้อมูล |
| `infrastructure/InMemoryWaterTelemetryRepository.js` | จุดตรวจวัดและค่าจำลองในหน่วยความจำ |
| `presentation/components/WaterTreatmentProcessDiagram.jsx` | วาดผังและรับการเลือกจุดตรวจวัด |
| `App.jsx` | แดชบอร์ด การเลือกจุด การรีเฟรช และการแสดงโหมดข้อมูล |
| `waterworks-dashboard.css` | layout ของแดชบอร์ดและผัง |

ชุดส่งมอบรวมผังประปาและ CSS ฉบับปรับล่าสุดจาก GitHub แล้ว โดยเก็บประวัติงานเดิมไว้ใน Git ผังนี้ยังใช้ข้อมูลจำลอง ไม่ใช่หลักฐานการเชื่อมต่ออุปกรณ์จริง

## ลำดับข้อมูลปัจจุบัน

`main.jsx` → `createWaterworksApplication()` → `WaterworksDashboardController.loadDashboard()` → `repository.getLatestSnapshot()` → `WaterTreatmentSystem.toViewModel()` → หน้าเว็บและผัง

8 จุดประกอบด้วยน้ำดิบ สารเคมี ตกตะกอน กรอง ถังน้ำใส ปั๊มส่ง หอถังสูง และเขตจ่ายน้ำ สถานะ `normal/watch/critical/offline` ใน Domain ปัจจุบันรับจาก snapshot ไม่ใช่การคำนวณ alarm threshold จากค่าจริงโดยอัตโนมัติ

## เชื่อมข้อมูลจริงโดยไม่ผูกหน้าเว็บกับอุปกรณ์

- กำหนด telemetry contract: รหัสจุด ค่า หน่วย เวลาที่วัด สถานะการเชื่อมต่อ และคุณภาพข้อมูล
- implement repository/adapter ใหม่ตาม `getLatestSnapshot()` แล้วเปลี่ยน dependency ที่ composition root ไม่เรียก API อุปกรณ์ใน JSX
- Token/Secret ของ Gateway หรือ SCADA เก็บฝั่ง API ไม่ฝังใน bundle เว็บ
- ต้องแยกเวลาวัดจากเวลาโหลดหน้า และตรวจข้อมูลขาด/เก่า/offline อย่าทำให้รีเฟรชแล้วดูเสมือนข้อมูลสดทั้งที่ยังเป็นค่าค้าง
- กำหนด threshold, hysteresis และการยืนยัน alarm ใน Domain ตามอุปกรณ์/ข้อกำหนดจริง พร้อม unit test
- ทดสอบ adapter กับเครื่องจริงและบันทึกหน่วย protocol ช่วงอ่านข้อมูล และข้อจำกัด ก่อนเปลี่ยนโหมดจาก simulation

## งานสมดุลน้ำที่ต้องพัฒนาต่อ

ใช้ปริมาณน้ำในหน่วย ลบ.ม. ของเขตจ่ายและช่วงเวลาเดียวกัน:

```text
ปริมาณส่วนต่าง = น้ำจ่ายเข้าระบบ - น้ำใช้ที่บันทึกตามรอบ - น้ำใช้ที่อนุญาตแต่ไม่เรียกเก็บ
อัตราส่วนต่าง (%) = ปริมาณส่วนต่าง / น้ำจ่ายเข้าระบบ × 100
```

คำนวณเมื่อข้อมูลครบและน้ำจ่ายมากกว่า 0 ใช้ปริมาณน้ำใช้จากมิเตอร์/ข้อมูลเรียกเก็บที่อ้างอิงปริมาณ ไม่ใช่จำนวนเงินค่าน้ำโดยตรง ตรวจค่าผิดพลาดหรือส่วนต่างติดลบก่อนสรุป ผลส่วนต่างเป็นสัญญาณให้ตรวจสอบ ไม่ยืนยันว่าท่อรั่วหรือลักใช้น้ำ และต้องแยกความคลาดเคลื่อนมิเตอร์/ช่วงเวลาจากการสูญเสียจริง

สูตรนี้เป็นข้อกำหนดสำหรับงานต่อ ไม่ใช่ฟังก์ชันที่ตรวจพบว่ามีใน `WaterTreatmentSystem` ปัจจุบัน

เริ่มอ่าน test ที่ `apps/waterworks-management/test/waterMonitoring.test.js` แล้วเพิ่ม test ของ adapter ข้อมูลจริง สมดุลน้ำ ข้อมูลเก่า/ขาด และหน่วยผิด
