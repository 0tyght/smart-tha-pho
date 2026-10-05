# คู่มือนักพัฒนาและการส่งมอบ Smart Tha Pho

เอกสารนี้อธิบายโครงสร้างโค้ด จุดเริ่มทำงาน หน้าที่ของไฟล์ และแนวทางพัฒนาต่อสำหรับผู้รับช่วงงานทั้งสี่ระบบ ใช้คู่กับ source repository `0tyght/smart-tha-pho` และเอกสารออกแบบแยกระบบ

ตรวจจากโค้ดหลังรวมงานในเครื่องกับ GitHub วันที่ 5 ตุลาคม 2569 ผ่านการทดสอบและ build ตามผลใน [สถานะ Git](GIT_STATUS.md) ผลนี้ไม่ใช่การรับรองว่าทุกฟังก์ชันพร้อมใช้งานจริงหรือผ่านการทดสอบกับอุปกรณ์และข้อมูล production แล้ว

## 1. ภาพรวมระบบ

| ระบบ | โฟลเดอร์เว็บ | ส่วนที่พบในโค้ดปัจจุบัน |
| --- | --- | --- |
| ระบบบริหารการจัดเก็บขยะ | `apps/waste-management` | ทะเบียนรถ พนักงาน ผู้ใช้บริการ เส้นทาง แผนปฏิบัติงาน ตำแหน่ง เหตุระหว่างงาน ค่าบริการ และ LINE |
| ระบบบริหารข้อมูลสุนัขและแมว | `apps/prms-tsm` | ทะเบียนสัตว์ เจ้าของ ครัวเรือน คำขอ วัคซีน ทำหมัน สถานะ โอนเจ้าของ รายงาน และ LINE |
| ระบบป้องกันและบรรเทาสาธารณภัย | `apps/disaster-management` | หน้าโครงงานและ session ร่วม ยังไม่พบชุด API/schema สำหรับกระบวนการรับแจ้งเหตุครบวงจร |
| ระบบมอนิเตอร์การใช้น้ำประปา | `apps/waterworks-management` | แดชบอร์ดและผังตรวจวัด 8 จุด ใช้ข้อมูลจำลองจาก repository ในหน่วยความจำ |

การมีหน้าเว็บ เมนู หรือแผนภาพออกแบบไม่ใช่หลักฐานว่าฟังก์ชันนั้นพัฒนาและทดสอบครบแล้ว เอกสารออกแบบของสาธารณภัยและประปามีส่วนที่เป็นแบบเป้าหมายซึ่งยังต้องพัฒนาต่อ

### คู่มือรายระบบ

- [ระบบบริหารการจัดเก็บขยะ](systems/waste.md)
- [ระบบบริหารข้อมูลสุนัขและแมว](systems/pets.md)
- [ระบบป้องกันและบรรเทาสาธารณภัย](systems/disaster.md)
- [ระบบมอนิเตอร์การใช้น้ำประปา](systems/waterworks.md)
- [ฐานข้อมูล การเปลี่ยนโครงสร้าง และการส่งมอบข้อมูล](DATABASE.md)

## 2. โครงสร้าง repository

```text
smart-tha-pho/
  apps/
    portal/                  หน้าเข้าสู่ระบบและเลือกระบบ
    api/                     API กลาง การยืนยันตัวตน LINE และงานเบื้องหลัง
    prms-tsm/                เว็บสุนัขและแมว
    waste-management/        เว็บจัดเก็บขยะ
    disaster-management/     หน้าโครงงานสาธารณภัย
    waterworks-management/   เว็บมอนิเตอร์ประปา
  packages/
    shared/                  ข้อมูลและค่ากลางร่วม
    web-core/                API client, session, navigation และ UI ร่วม
  database/
    bootstrap/               ฐานข้อมูลและตารางเริ่มต้น
    migrations/              SQL เปลี่ยนโครงสร้างและปรับข้อมูลตามเวอร์ชัน
    demo/                    ข้อมูลสาธิต ไม่ใช่สำรองข้อมูลจริง
  docs/                      เอกสารออกแบบ มาตรฐาน และการดูแลระบบ
  scripts/                   เครื่องมือตรวจโค้ดและดูแลระบบ
  storage/uploads/           ไฟล์แนบส่วนตัว แยกจาก Git
  .env.example               ตัวอย่างชื่อค่าตั้ง ไม่มีค่าลับจริง
  package.json               npm workspaces และคำสั่งระดับโครงการ
  package-lock.json          เวอร์ชัน dependency ที่ใช้ติดตั้งซ้ำ
  runtime-config.json        ที่อยู่บริการสำหรับเว็บ ไม่ใช่ค่าลับ
```

โครงการใช้ JavaScript ES Modules, React/Vite สำหรับเว็บ และ Node.js/Express สำหรับ API เชื่อม MySQL/MariaDB ผ่าน `mysql2` บัญชี LINE OA กลางใช้ร่วมกัน ไม่ใช่สี่บัญชีแยกระบบ CI กำหนด Node.js 22 ใน `.github/workflows/deploy-smart-tha-pho-pages.yml`; ไม่มีการยืนยันเวอร์ชันฐานข้อมูลจริงในรอบตรวจนี้

## 3. จุดเริ่มทำงานและหน้าที่ไฟล์

### API

1. `apps/api/src/server.js` เรียก `createApiRuntime().start()`
2. `apps/api/src/composition-root/createApiRuntime.js` ประกอบ HTTP application, adapters และงานตามรอบเวลา
3. `apps/api/src/composition-root/createHttpApplication.js` ประกอบ services/repositories และ HTTP modules
4. `apps/api/src/app.js` สร้าง Express application, middleware และเส้นทาง API หลายกลุ่ม โค้ดทะเบียนและ SQL เดิมจำนวนหนึ่งยังอยู่ที่นี่
5. `apps/api/src/infrastructure/server/ApiRuntime.js` เปิด listener เริ่มงานเบื้องหลัง และหยุดงานเมื่อได้รับ SIGINT/SIGTERM
6. `apps/api/src/core/config.js` อ่าน configuration จาก `.env` ที่ root โดยไม่แทนค่า environment ที่มีอยู่แล้ว; `core/db.js` ประกอบ `MariaDbConnection`

### เว็บและ session

`main.jsx` ของแต่ละเว็บสร้าง React root และประกอบ controller ที่ composition root จากนั้นหน้าเว็บเรียก Application/Facade เพื่อดึงข้อมูล ไม่เชื่อมฐานข้อมูลโดยตรง

Portal ใช้ `apps/portal/src/application/AuthenticateStaffUseCase.js` เรียก login/MFA ผ่าน API และบันทึก session ก่อนเปลี่ยนระบบ ส่วนร่วมอยู่ใน `packages/web-core/src/application/SessionStore.js`, `NavigationService.js` และ `SystemApplicationController.js`

`packages/web-core/src/api.js` มี `ApiClient` ส่ง Bearer token แปลง path ที่เริ่มด้วย `/api/` เป็น path `/v1/` และจัดการการเรียก API ส่วน `infrastructure/RuntimeConfigRepository.js` หา API base URL โดยอ่าน runtime configuration ปัจจุบันก่อนและใช้ค่า build เป็น fallback เพื่อรองรับการเปลี่ยน URL ของ tunnel โดยไม่ยึด URL เก่าที่ฝังใน build

### LINE และงานเบื้องหลัง

Webhook รับที่ `/api/line/webhook` และ alias `/api/v1/line/webhook` ใช้ raw body ตรวจลายเซ็นก่อนประมวลผล จากนั้น `modules/line/lineBot.js` แยกเมนูและส่งงานไปยังบทสนทนาสุนัข/แมวหรือขยะ

| ไฟล์ | หน้าที่ |
| --- | --- |
| `modules/line/SmartThaPhoLineMenu.js` | เมนูเลือกบริการและการกลับเมนูหลัก |
| `modules/line/lineNativeCitizen.js` | re-export ไปยัง `lineNativeCitizen.v10.js` ไม่ใช่ workflow อีกชุด |
| `modules/line/lineNativeCitizen.v10.js` | บทสนทนาและคำขอข้อมูลสุนัขและแมว |
| `modules/line/wasteLine.js` | บทสนทนาของผู้ใช้บริการและพนักงานเก็บขยะ |
| `modules/line/lineChannelSettings.js` | อ่านและเข้ารหัสค่า Channel; ใช้ `SMART` เป็นบัญชีกลาง |
| `modules/line/lineNotifications.js` | คิวแจ้งเตือนและเตือนวัคซีนของสุนัข/แมว |
| `modules/waste/infrastructure/WasteLineNotificationQueue.js` | ส่งคิวแจ้งเตือนขยะ |
| `modules/waste/infrastructure/WastePaymentReminderScanner.js` | สร้างคิวเตือนค่าบริการตามกำหนด |

path ในตารางนี้เริ่มจาก `apps/api/src/` ทั้งหมด งานใน `createApiRuntime.js` ประมวลผลคิวทุก 2 วินาที รอบตรวจเตือนวัคซีน เตือนค่าบริการ และล้างสถานะบทสนทนากำหนดทุก 6 ชั่วโมง `ScheduledTask.start()` เรียกงานทันทีเป็นค่าเริ่มต้นด้วย ไม่รอครบช่วงแรก ค่านี้เป็นรอบ scheduler ไม่ใช่คำรับรองเวลาส่งถึงผู้รับ

## 4. หลักการแก้และเพิ่มโค้ด

ยึด [AGENTS.md](../../AGENTS.md) และ [มาตรฐานสถาปัตยกรรม](../architecture/OOP_ARCHITECTURE_STANDARD.md)

| ส่วน | หน้าที่ | สิ่งที่ไม่ควรทำ |
| --- | --- | --- |
| Presentation | รับคำขอ ตรวจรูปแบบ และแสดงผล | ตัดสินกฎธุรกิจหรือเรียก SQL โดยตรง |
| Application | ประสานขั้นตอน Use Case และ transaction | ผูกกับ React, Express หรือ MariaDB โดยตรง |
| Domain | Entity, Value Object และกฎเปลี่ยนสถานะ | import framework หรือรายละเอียดฐานข้อมูล |
| Infrastructure | Repository, LINE, HTTP ภายนอก และไฟล์ | กำหนดกฎธุรกิจแทน Domain |
| Composition Root | สร้างและฉีด dependencies | กระจายการสร้าง dependencies ลงในหน้าเว็บหรือ Use Case |

งานใหม่ต้องแยกหน้าที่ตามนี้ แต่ไม่ให้ถือว่าโค้ดเดิมแยกครบแล้ว `app.js`, บทสนทนา LINE บางไฟล์ และ `CitizenSubmissionApprovalService.js` ยังมี SQL อยู่ ต้องค่อยย้ายโดยมี test คุมพฤติกรรมเดิม ไม่ควรเปลี่ยนทั้งระบบพร้อมกัน

ผล `architecture:check` ผ่านในการตรวจครั้งนี้เป็นการตรวจ import และเงื่อนไขที่สคริปต์กำหนด มี allowlist สำหรับ LINE เดิม ไม่ได้พิสูจน์ว่า business rules/SQL ทุกจุดถูกแยกครบตาม OOP

ขั้นตอนเพิ่มฟังก์ชัน: กำหนด input/output และสิทธิ์ → เขียน Domain rule และ unit test → เพิ่ม Use Case และ repository contract → implement repository/adapter → ประกอบที่ composition root → เพิ่ม HTTP/UI → ทดสอบและปรับเอกสาร/SQL ที่เกี่ยวข้อง

## 5. API สิทธิ์ และข้อมูลสำคัญ

- API `/api/v1/...` เป็น alias ที่ `app.js` แปลงไปยังเส้นทาง `/api/...`; อ่าน route จริงควบคู่ `apps/api/src/contracts/openapi.js` อย่าถือว่า OpenAPI ครอบคลุมทุก endpoint โดยไม่ตรวจ
- ใช้ Bearer token และ middleware ที่ `presentation/http/AuthMiddleware.js` ตรวจบัญชี/สถานะผ่าน `AuthenticateRequestUseCase` และ repository
- ฝั่งเซิร์ฟเวอร์ต้องตรวจ role และขอบเขตพื้นที่ด้วย การซ่อนเมนูในเว็บไม่ใช่การควบคุมสิทธิ์ที่เพียงพอ
- Health: `/api/v1/health/live`, `/api/v1/health/ready` และ `/api/v1/health`; liveness ไม่ได้ยืนยันว่าฐานข้อมูลพร้อม
- Reference: `/api/v1/public/villages`; login: `/api/v1/auth/login`; ขยะ: `/api/v1/waste/...`; ทะเบียน: `/api/v1/admin/...`
- เก็บ transaction, optimistic version, audit log และเงื่อนไขป้องกัน webhook/notification ซ้ำเมื่อปรับ workflow
- `.env`, Tokens, encryption keys, ข้อมูลประชาชน และรูปหลักฐานไม่ใส่ใน Git หรือ ZIP คู่มือ ต้องส่งผ่านช่องทางจำกัดสิทธิ์
- คีย์เข้ารหัสที่ใช้กับข้อมูลเดิมต้องส่งมอบด้วย โดยเฉพาะ LINE/MFA; การเปลี่ยนคีย์โดยไม่แปลงข้อมูลอาจทำให้ถอดรหัสค่าที่เก็บไว้ไม่ได้

## 6. เตรียมเครื่องสำหรับพัฒนา

ทำใน environment พัฒนาแยกจากข้อมูลจริง โดยใช้ commit ที่รวมงานและผ่านการตรวจตาม [สถานะ Git](GIT_STATUS.md) คู่มือนี้ไม่ใช่คำสั่งเปิดระบบ production

1. ใช้ Node.js 22 ตาม CI และ npm พร้อม `package-lock.json`
2. สร้าง `.env` จาก `.env.example`; กำหนดฐานข้อมูลและค่าความปลอดภัยของ environment พัฒนา
3. เตรียมฐานข้อมูลตาม [DATABASE.md](DATABASE.md) ไม่ใช้ seed/demo ทับข้อมูลจริง
4. จาก root รัน `npm ci` แล้ว `npm run dev`

| ส่วน | คำสั่งจาก root | พอร์ตตั้งต้น |
| --- | --- | ---: |
| API | `npm run dev:api` | 4100 |
| Portal | `npm run dev:portal` | 5173 |
| สุนัขและแมว | `npm run dev:prms` | 5174 |
| ขยะ | `npm run dev:waste` | 5175 |
| สาธารณภัย | `npm run dev:disaster` | 5176 |
| ประปา | `npm run dev:water` | 5177 |

ตรวจ proxy และพอร์ตใน Vite config ของแต่ละแอปเมื่อเปลี่ยน environment API เปลี่ยนพอร์ตด้วย `PORT` ได้ ค่า database default คือ `prms_tsm` และ SQL หลายไฟล์มี `USE prms_tsm` จึงไม่ควรเปลี่ยนชื่อ DB เฉพาะ `.env`

สร้างผู้ดูแลด้วย `npm run create-admin` หลังตรวจ `scripts/admin/create-admin.js` คำสั่งนี้สามารถปรับบัญชีเดิมได้เมื่อใช้อีเมลเดิม จึงใช้กับฐานข้อมูลที่เลือกอย่างระมัดระวัง

## 7. ตรวจคุณภาพก่อนส่งต่อ

```powershell
npm run architecture:check
npm test
npm run build
```

หลังรวมงานวันที่ 5 ตุลาคม 2569 รัน `npm test` ผ่านครบ 286 รายการและ `architecture:check` ผ่าน จากนั้น `npm run build` ผ่านทั้ง portal สุนัขและแมว ขยะ สาธารณภัย และประปา เครื่องที่ตรวจใช้ Node.js 24.18.0 ส่วน CI กำหนด Node.js 22 ผลในเครื่องนี้จึงไม่ใช่ผลยืนยัน Node.js 22 โดยตรง ยังไม่ได้ทำ UAT ทดสอบกู้คืนฐานข้อมูลจริง หรือทดสอบเชื่อมอุปกรณ์จริง ต้องตรวจแยกก่อนรับรอง production

ก่อนส่งมอบต้องกำหนด release commit/tag เดียวกันสำหรับโค้ดและเอกสาร ตรวจ SQL ที่ติดตั้งจริง ส่งสำรองข้อมูล/ไฟล์แนบ/คีย์อย่างปลอดภัย และให้ผู้รับมอบทดลองกู้คืนกับ test environment รายการที่ยังไม่พัฒนาหรือไม่ได้ตรวจรับให้ระบุแยกไว้ ไม่รวมเป็นงานเสร็จ

## 8. ไฟล์ดูแลระบบเดิมที่ต้องรู้ก่อนเรียกใช้

ส่วนนี้อธิบายหน้าที่ไฟล์ ไม่ได้ให้เรียกสคริปต์กับเซิร์ฟเวอร์จริงระหว่างอ่านคู่มือ

- `start-smart-tha-pho.ps1` ที่ root ส่งต่อไปยัง `scripts/server/start-smart-tha-pho.ps1`
- launcher เรียก `scripts/server/start-public.ps1` ซึ่งมีการ apply SQL migration, build เว็บ, จัดไฟล์ใน `.runtime/site`, restart API และเปิด public tunnel
- API ที่ launcher เปิดใช้ entry point `apps/api/src/server.js`; ไม่ใช่ Vite development server
- launcher มีการ sync LINE Webhook และ Default Rich Menu ด้วย scripts ใน `scripts/server/`
- `start-public.ps1` สามารถ commit/push `runtime-config.json`; `-SkipGitPush` ระงับส่วน Git แต่ไม่ได้ระงับ migration, restart, tunnel หรือการ sync LINE
- `.github/workflows/deploy-smart-tha-pho-pages.yml` ทดสอบ/build และ deploy เฉพาะเว็บ static ไป GitHub Pages ไม่ได้ deploy API ฐานข้อมูล หรือ uploads ไปด้วย

ต้องยืนยัน configuration และเครื่องปลายทางก่อนเรียก scripts เหล่านี้ ไม่ถือว่าขั้นตอนสาธิตผ่าน tunnel เป็น runbook ของ production ที่ได้รับการตรวจรับแล้ว
