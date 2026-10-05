# Smart Tha Pho

แพลตฟอร์มระบบงานดิจิทัลของเทศบาลเมืองท่าโพธิ์ ประกอบด้วยระบบบริหารการจัดเก็บขยะ ระบบบริหารข้อมูลสุนัขและแมว ระบบป้องกันและบรรเทาสาธารณภัย และระบบมอนิเตอร์การใช้น้ำประปา

สำหรับผู้รับช่วงงาน เริ่มที่ [คู่มือนักพัฒนาและการส่งมอบ](docs/handover/README.md) ซึ่งอธิบายโครงสร้างและหน้าที่ของไฟล์ การรัน API/เว็บ ฐานข้อมูล หลัก OOP และข้อจำกัดที่ตรวจพบ พร้อมคู่มือแยกทั้งสี่ระบบและผลทดสอบหลังรวมงาน ไม่ถือว่าหน้าโครงงานหรือข้อมูลตรวจวัดจำลองเป็นฟังก์ชัน production ที่เสร็จแล้ว

ดูภาพรวมเว็บทั้ง 4 ระบบที่ [docs/architecture/WEB_APPLICATIONS.md](docs/architecture/WEB_APPLICATIONS.md) และผังโฟลเดอร์สำหรับผู้พัฒนาที่ [docs/architecture/REPOSITORY_STRUCTURE.md](docs/architecture/REPOSITORY_STRUCTURE.md)

การดูแลเซิร์ฟเวอร์เดิมใช้ `./start-smart-tha-pho.ps1` ซึ่งเปิด API/Tunnel เปลี่ยนค่าฐานข้อมูลตาม migration และ sync LINE ได้ ต้องอ่าน [หน้าที่และผลกระทบของไฟล์รันระบบ](docs/handover/README.md#8-ไฟล์ดูแลระบบเดิมที่ต้องรู้ก่อนเรียกใช้) และยืนยันเครื่องปลายทางก่อนเรียก ไม่ใช้สคริปต์นี้เพื่อทดลองอ่านคู่มือ

## ส่วนประกอบระบบ

- `apps/portal` — หน้าเข้าสู่ระบบกลาง Smart Tha Pho และตัวเลือกระบบ
- `apps/prms-tsm` — ระบบบริหารข้อมูลสุนัขและแมว (รหัสระบบ PRMS-TSM)
- `apps/waste-management` — ระบบบริหารการจัดเก็บขยะ
- `apps/disaster-management` — ระบบป้องกันและบรรเทาสาธารณภัย: หน้าโครงงาน ยังไม่มี API/schema รับแจ้งเหตุครบวงจร
- `apps/waterworks-management` — ระบบมอนิเตอร์การใช้น้ำประปา: ผังตรวจวัด 8 จุด ใช้ข้อมูลจำลอง ยังไม่เชื่อมอุปกรณ์จริง
- LINE Official Account — บัญชีกลางสำหรับบริการสุนัข/แมวและขยะ
- `apps/api` — API, การยืนยันตัวตน และกฎธุรกิจ
- `packages/shared` — แบบข้อมูลและค่ากลางที่ใช้ร่วมกัน
- `database` — Schema, migration และ seed data

เจ้าของสัตว์เลี้ยงไม่ต้องเปิดเว็บไซต์และไม่ใช้ LIFF: เริ่มต้นขึ้นทะเบียน เชื่อมทะเบียนเดิม ติดตามผล ส่งข้อมูลวัคซีน/ทำหมัน แจ้งสถานะสัตว์เลี้ยง แก้ไขข้อมูล โอนเจ้าของ และส่งตำแหน่งบ้าน ทำผ่านบทสนทนาและ Rich Menu ใน LINE OA ทั้งหมด ส่วนเจ้าหน้าที่ตรวจสอบและวางแผนงานผ่าน Admin Web

## เริ่มใช้งานสำหรับพัฒนา

1. คัดลอก `.env.example` เป็น `.env`
2. เตรียมฐานข้อมูลและ migration ตาม [คู่มือฐานข้อมูล](docs/handover/DATABASE.md) ใน environment พัฒนาแยกจากข้อมูลจริง
3. ใช้ Node.js 22 ตาม CI แล้วรัน `npm ci`
4. รัน `npm run dev`

สร้างบัญชีผู้ดูแลด้วย `npm run create-admin` หลังตรวจฐานข้อมูลปลายทางและสคริปต์ เพราะคำสั่งนี้สามารถปรับบัญชีที่ใช้อีเมลเดิมได้ ข้อมูลทะเบียนและขยะอ่านจาก API/ฐานข้อมูล ส่วนแดชบอร์ดประปาปัจจุบันยังใช้ข้อมูลจำลอง

Local Portal: `http://localhost:5173` (starts together with all four web applications using `npm run dev`)

Local PRMS-TSM: `http://localhost:5174`

API v1: `http://localhost:4100/api/v1/health`

การ deploy เว็บ static: [GitHub Pages workflow](.github/workflows/deploy-smart-tha-pho-pages.yml) ทดสอบและ build ทั้ง 5 เว็บ แต่ไม่ได้ deploy API ฐานข้อมูล หรือไฟล์แนบไปด้วย

ตั้งค่า LINE OA โดยกำหนด `LINE_CHANNEL_SECRET` และ `LINE_CHANNEL_ACCESS_TOKEN` ใน `.env` แล้วกำหนด Webhook URL ของ Messaging API ให้ชี้ที่ `/api/line/webhook` ของ API ที่เข้าถึงจากภายนอกได้ สคริปต์ `start-smart-tha-pho.ps1` ใช้เปิด API ชั่วคราวและตั้ง Webhook เมื่อผู้ดูแลสั่งใช้งาน

หน้าเว็บอ่านที่อยู่ API จาก `runtime-config.json` ก่อนใช้ URL ที่ฝังใน build ต้องให้ API และฐานข้อมูลพร้อมแยกจาก GitHub Pages การเปิดช่องทางผ่าน Cloudflare Quick Tunnel เป็นการเข้าถึงชั่วคราว ไม่ใช่การรับรองความพร้อม production

ไฟล์รูปและหลักฐานถูกเก็บใน `storage/uploads` ซึ่งไม่ถูก commit ขึ้น Git และดาวน์โหลดผ่าน API ที่ตรวจสิทธิ์พื้นที่พร้อมบันทึก Audit Log เท่านั้น สามารถกำหนดตำแหน่ง private storage ใหม่ด้วย `PRIVATE_STORAGE_DIR`

ข้อมูลระบบจริงต้องผ่าน API และฐานข้อมูลกลางเท่านั้น ห้ามใช้ `localStorage` เป็นแหล่งข้อมูลหลัก

## ตรวจคุณภาพและส่งมอบ

รัน `npm test` และ `npm run build` ก่อนส่งงาน ดู [เวอร์ชันและผลตรวจ](docs/handover/GIT_STATUS.md) และ [คู่มือรายระบบ](docs/handover/README.md#คู่มือรายระบบ) สำหรับข้อจำกัดและงานที่ยังต้องพัฒนา ข้อมูลประชาชน `.env` คีย์ และ uploads ต้องส่งผ่านช่องทางจำกัดสิทธิ์ ไม่ส่งขึ้น Git
