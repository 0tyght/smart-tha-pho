# ผลการตรวจสอบสถาปัตยกรรมเชิงวัตถุของระบบ Smart Tha Pho

วันที่ตรวจสอบ: 1 กันยายน 2569

## ขอบเขตการตรวจสอบ

ตรวจสอบส่วน API, ระบบทะเบียนสัตว์เลี้ยง, ระบบบริหารจัดการการเก็บขยะ, ระบบบรรเทาสาธารณภัย, ระบบการประปา, ระบบกลางสำหรับเว็บไซต์ และการเชื่อมต่อ LINE Official Account โดยอ้างอิงมาตรฐานใน `OOP_ARCHITECTURE_STANDARD.md`

## หลักเกณฑ์

โครงสร้างที่ใช้เป็นมาตรฐานประกอบด้วย 4 ชั้น

1. Presentation รับและแสดงผลข้อมูล ไม่เรียกฐานข้อมูลโดยตรง
2. Application ควบคุมกรณีใช้งานและพึ่งพาสัญญาของ Repository หรือ Gateway
3. Domain เก็บกฎธุรกิจและสถานะของ Entity โดยไม่ผูกกับ Framework
4. Infrastructure ติดต่อฐานข้อมูล LINE ระบบแผนที่ ไฟล์ และบริการภายนอก

การสร้างและเชื่อมต่อ Object ต้องรวมไว้ใน Composition Root และส่ง Dependency ผ่าน Constructor

## ผลการตรวจสอบรายส่วน

| ส่วนระบบ | สถานะ | ผลการตรวจสอบ |
|---|---|---|
| API กลาง | ต้องปรับต่อ | มี Domain Entity, Application Service และ Infrastructure Adapter แล้ว แต่ `apps/api/src/app.js` ยังรวม route, SQL, validation และกฎการทำงานไว้ในไฟล์เดียว |
| การยืนยันตัวตน | ปรับแล้ว | แยก `AuthenticateRequestUseCase`, `JwtSessionTokenService`, `MariaDbStaffAccountRepository`, `AuthMiddleware` และ `RoleAuthorizationMiddleware` ตามหน้าที่ |
| Health และ Readiness | ปรับแล้ว | แยก `HealthStatusService`, `MariaDbHealthRepository` และ `HealthHttpModule` พร้อมประกอบ Object ใน Composition Root |
| ระบบเก็บขยะ API | ผ่าน | แยก Domain, Application, Infrastructure และ Composition Root ชัดเจน มีชุดทดสอบกฎธุรกิจและกรณีใช้งาน |
| ระบบทะเบียนสัตว์เลี้ยง API | ต้องปรับต่อ | มี Entity และ Service บางส่วน แต่ route และ SQL ส่วนใหญ่ยังอยู่ใน `app.js` |
| LINE OA | ปรับโครงสร้างหลักแล้ว | แยก Citizen Experience และการล้างสถานะสนทนาเป็น Use Case/Repository แล้ว โมดูลเดิมขนาดใหญ่ 5 ไฟล์ถูกขึ้นทะเบียนเป็นหนี้โครงสร้างและห้ามเพิ่มไฟล์ที่เข้าฐานข้อมูลโดยตรง |
| เว็บไซต์ทะเบียนสัตว์เลี้ยง | ผ่านแบบมีหนี้โครงสร้าง | มี Application Facade, Controller, Domain Policy และ Composition Root แต่หน้ารายการสัตว์ยังมีขนาดใหญ่ ควรแยก View Model และองค์ประกอบย่อย |
| เว็บไซต์เก็บขยะ | ผ่านแบบมีหนี้โครงสร้าง | มี Controller, Facade และ Domain Policy แต่หน้าจอแผนงานและแผนที่บางไฟล์มีหลายหน้าที่ |
| ระบบบรรเทาสาธารณภัย | ยังไม่สมบูรณ์ | โครงสร้างหน้าระบบมีอยู่ แต่กรณีใช้งานและ Domain Model ยังไม่ครบเทียบเท่าระบบหลัก |
| ระบบการประปา | ยังไม่สมบูรณ์ | โครงสร้างหน้าระบบมีอยู่ แต่กรณีใช้งานและ Domain Model ยังไม่ครบเทียบเท่าระบบหลัก |
| Packages กลาง | ผ่าน | แยก API client, session, navigation และ shared contracts เพื่อใช้ซ้ำระหว่างระบบ |

## การปรับปรุงที่ดำเนินการแล้ว

1. ย้ายการตรวจ JWT ออกจาก Presentation ไปยัง `JwtSessionTokenService`
2. ย้ายการค้นหาบัญชีพนักงานออกจาก Middleware ไปยัง `MariaDbStaffAccountRepository`
3. เพิ่ม `AuthenticateRequestUseCase` สำหรับควบคุมขั้นตอนยืนยันตัวตน
4. แยกการตรวจ Role เป็น `RoleAuthorizationMiddleware`
5. ยกเลิกการยอมรับ JWT ที่หมดอายุ และใช้วันหมดอายุ 12 ชั่วโมงที่กำหนดตอนออก token โดยตรง
6. เพิ่มชุดทดสอบ Use Case และ Repository ของการยืนยันตัวตน
7. เพิ่มกฎตรวจสถาปัตยกรรม ไม่ให้ Presentation import หรือติดต่อฐานข้อมูลโดยตรง
8. แยก Health/Readiness route และ SQL ออกจาก `app.js` พร้อมรักษา API contract เดิม
9. แยกสถานะผู้ใช้ LINE เป็น `CitizenExperienceService` และ `MariaDbCitizenExperienceRepository`
10. แยกการล้างขั้นตอนสนทนาเป็น `ClearLineConversationUseCase` และ Repository
11. ย้ายการสร้าง Controller ของเว็บทะเบียนสัตว์เลี้ยงและเว็บเก็บขยะไปยัง Composition Root
12. แยกหน้าเว็บเก็บขยะเป็น lazy-loaded chunks ลด JavaScript เริ่มต้นจากประมาณ 546 KB เหลือประมาณ 204 KB
13. แยกรายการหมู่บ้านสาธารณะเป็น Use Case, Repository และ HTTP Module

## ลำดับการปรับโครงสร้างต่อ

### ระยะที่ 1: ระบบทะเบียนสัตว์เลี้ยง API

- แยก route ใน `app.js` เป็น Registration, Owner, Pet, Vaccination, Sterilization, Dashboard และ Report HTTP Module
- ย้าย SQL ไปยัง MariaDB Repository ของแต่ละ Aggregate
- ย้าย validation ของกรณีใช้งานไปยัง Command/Use Case และเก็บกฎธุรกิจไว้ใน Domain
- ให้ route ทำหน้าที่แปลง HTTP request/response เท่านั้น

### ระยะที่ 2: LINE OA

- แยก Command Parser, Conversation State, Use Case และ Flex Message Presenter
- ให้ LINE Webhook เป็น Presentation Adapter และเรียก Application Service
- ให้การอ่าน/เขียนข้อมูลผ่าน Repository โดยไม่ใช้ connection pool ในโมดูลสนทนา
- ไฟล์เดิมที่ยังอยู่ในบัญชีปรับปรุง ได้แก่ `lineChannelSettings.js`, `lineNativeCitizen.v10.js`, `lineNotifications.js`, `lineRichMenuWizard.js` และ `wasteLine.js`

### ระยะที่ 3: เว็บไซต์

- แยกหน้าจอที่เกินหนึ่งหน้าที่เป็น Page Controller, View Model, Form และ Map Component
- รวมกฎสถานะ ปุ่มที่ใช้งานได้ และ Process Step ไว้ใน Domain Policy/Application Facade
- ให้ Component รับข้อมูลและ callback ผ่าน props โดยไม่เรียก API โดยตรง

### ระยะที่ 4: ระบบบรรเทาสาธารณภัยและระบบการประปา

- จัดทำ Domain Model และ Use Case ตามกระบวนการจริงของเทศบาลก่อนเชื่อมฐานข้อมูล
- ใช้ Repository interface และ Adapter รูปแบบเดียวกับระบบเก็บขยะ

## เกณฑ์ผ่านก่อนรวมโค้ด

- `npm run architecture:check` ต้องผ่าน
- `npm test` ต้องผ่านทุก workspace
- `npm run build` ต้องสำเร็จ
- Presentation ต้องไม่มี SQL หรือการเรียกฐานข้อมูล
- Domain และ Application ต้องไม่ import Framework หรือ Infrastructure
- กฎธุรกิจใหม่ต้องมี Unit Test และเส้นทาง HTTP สำคัญต้องมี Integration Test
