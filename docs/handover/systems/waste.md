# ระบบบริหารการจัดเก็บขยะ — คู่มือนักพัฒนา

[กลับคู่มือหลัก](../README.md)

## ขอบเขตโค้ด

เว็บอยู่ใน `apps/waste-management` ส่วน API อยู่ใน `apps/api/src/modules/waste` มีทะเบียนทรัพยากร ผู้ใช้บริการ เส้นทาง แผน ความพร้อม ประกาศงาน การปฏิบัติงาน/ตำแหน่ง เหตุระหว่างงาน และค่าบริการ ใช้ LINE สำหรับประชาชนและพนักงานผ่านบัญชีกลาง

## จุดเริ่มและไฟล์สำคัญ

| งาน | ไฟล์ที่ควรอ่าน |
| --- | --- |
| ประกอบเว็บ | `apps/waste-management/src/main.jsx`, `App.jsx`, `WasteManagementApp.jsx`, `composition-root/createWasteApplicationController.js` |
| API ของเว็บ | `apps/waste-management/src/composition-root/createWasteApplication.js`, `application/WasteApplicationFacade.js` |
| จัดแผน | `apps/waste-management/src/pages/PlansPage.jsx`, `application/WastePlanFormController.js`, `domain/WastePlanPolicy.js` |
| พิกัดคนขับ | `apps/waste-management/src/pages/DriverTrackingPage.jsx` เปิดตามหน้า `driver-gps` และ tracking token |
| HTTP | `apps/api/src/modules/waste/waste.router.js` ประกอบใต้ `/api/waste` และ alias `/api/v1/waste` |
| ประกอบบริการ | `apps/api/src/composition-root/createWasteManagementServices.js` |
| กฎธุรกิจ | `apps/api/src/modules/waste/domain/` และ `apps/api/src/domain/waste/entities/WasteOperationPlan.js` |
| ขั้นตอนงาน | `apps/api/src/modules/waste/application/` |
| SQL/บริการภายนอก | `apps/api/src/modules/waste/infrastructure/` |
| LINE | `apps/api/src/modules/line/wasteLine.js` |
| schema หลัก | `database/migrations/015_waste_management_schema.sql`, `016_waste_line_workflows.sql` |

## ลำดับงานสำคัญ

### ผู้ใช้บริการและเส้นทาง

ประชาชน/เจ้าหน้าที่เพิ่มข้อมูลผู้ใช้บริการ → ระบบเสนอเส้นทาง → เจ้าหน้าที่ยืนยัน → จึงใช้เส้นทางที่ยืนยันจัดงาน อ่าน `ProposeWasteServiceUserRouteAssignmentUseCase.js` และ `ConfirmWasteServiceUserRouteAssignmentUseCase.js` ใน `modules/waste/application/` อย่านำผลเสนอจากตัวคำนวณมาเป็นผลอนุมัติทันที

### แผนและการเก็บขยะ

กำหนดเส้นทาง จุดเก็บ รถ พนักงาน และช่วงเวลา → ตรวจความพร้อม → ประกาศแผน → LINE แจ้งผู้เกี่ยวข้อง → พนักงานเริ่มงานและส่งตำแหน่ง → บันทึกผลแต่ละจุด/แจ้งเหตุ → เจ้าหน้าที่จัดทรัพยากรทดแทนตามเงื่อนไข → จบงาน

อ่าน `PublishWasteOperationPlanUseCase.js`, `WastePlanExecutionPolicy.js`, `WasteTrackingService.js` และ `AssignWasteIncidentReplacementUseCase.js` ในโฟลเดอร์ Application/Domain ที่เกี่ยวข้อง การยืนยันเก็บขยะรายจุดเป็นคนละข้อมูลกับ GPS

### ค่าบริการ

`WasteBillingService` ใช้ `WasteFeeRate` และ `WasteServiceCharge` กับ `MariaDbWasteBillingRepository` เพื่อกำหนดอัตรา สร้างยอด เปลี่ยนสถานะ และเข้าคิวแจ้ง LINE

โค้ดรองรับสถานะ `PENDING`, `PAID`, `OVERDUE`, `VOID`; การเปลี่ยนเป็น `PAID` บันทึก `paidAt` แต่ไม่เท่ากับ payment gateway หรือใบเสร็จราชการ โค้ดนี้ไม่ใช่หลักฐานว่างานรับชำระ ลงรายละเอียดผู้รับเงิน ออก/ยกเลิกใบเสร็จ และรายงานการเงินครบวงจรเสร็จแล้ว

## ตารางหลัก

`waste_vehicles`, `waste_drivers`, `waste_routes`, `waste_service_users`, `waste_route_stops`, `waste_operation_plans`, `waste_location_logs`, `waste_stop_confirmations`, `waste_incidents`, `waste_fee_rates`, `waste_service_charges`, `waste_line_notifications` และตารางประกอบจาก migrations

ต้องตรวจทุกไฟล์ตั้งแต่ 015 เป็นต้นไป ไม่ใช่ import เพียง schema หลัก มี migration เลข 027 สองไฟล์ และ migration 028 ปรับพฤติกรรมแจ้งเตือนเป็นรายจุด ไม่ใช้การส่งซ้ำเมื่อจบเส้นทางแทน

## บริการภายนอกและข้อจำกัด

- `OsrmTripRouteOptimizer` และ `OsrmRoutePreviewProvider` ติดต่อ routing API; อ่าน `ROUTING_API_BASE_URL` และตรวจข้อจำกัดผู้ให้บริการ อย่าถือ public demo endpoint เป็น SLA ของ production
- GPS ที่พบมาจากเบราว์เซอร์/LINE ยังไม่พบ adapter รับ OBD2 จริง ต้องยืนยัน hardware, protocol, credential และข้อมูลก่อนเพิ่ม
- การเปลี่ยนรถหรือพนักงานต้องตรวจสถานะแผนและเก็บประวัติ ไม่อัปเดต foreign key ข้าม Use Case
- รักษาเงื่อนไข readiness/version/สิทธิ์ใน API แม้เว็บมี validation แล้ว
- การ retry LINE ต้องรักษาการป้องกันส่งซ้ำและผูก notification กับผู้รับ/จุดเก็บที่ถูกต้อง

เริ่มอ่าน test ใน `apps/api/test/wastePlanPublication.test.js`, `wastePlanReadinessWorkflow.test.js`, `wasteStopCollectionNotice.test.js`, `wasteIncidentReplacement.test.js`, `wasteBillingReportOop.test.js` และ `apps/waste-management/test/domainPolicies.test.js`
