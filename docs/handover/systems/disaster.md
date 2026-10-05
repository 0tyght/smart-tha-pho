# ระบบป้องกันและบรรเทาสาธารณภัย — คู่มือนักพัฒนา

[กลับคู่มือหลัก](../README.md)

## สถานะที่พบ

`apps/disaster-management/src/App.jsx` เรียก `MunicipalWorkspace` ด้วย `systemId="disaster"` ใช้ session และ UI ร่วม ยังไม่พบ incident module/API หรือ SQL migration สำหรับเหตุสาธารณภัยใน source ที่ตรวจ การมีหมวด “รับแจ้งเหตุ” บนหน้า workspace ไม่ใช่ workflow ที่จัดเก็บและดำเนินงานครบแล้ว

LINE เมนูกลางมีตัวเลือกสาธารณภัย แต่ตอบว่ายังไม่เปิดให้บริการ ไม่ใช่ช่องทางรับเหตุจริงที่ตรวจรับแล้ว

## จุดเริ่มและไฟล์สำคัญ

| ไฟล์ | หน้าที่ |
| --- | --- |
| `apps/disaster-management/src/main.jsx` | React entry point ของเว็บ |
| `apps/disaster-management/src/App.jsx` | เลือก workspace สำหรับสาธารณภัย |
| `packages/web-core/src/MunicipalWorkspace.jsx` | UI ของ workspace ร่วม |
| `packages/web-core/src/application/MunicipalWorkspaceController.js` | สร้าง view model ของระบบ หมวดงาน และข้อมูล session |
| `packages/web-core/src/application/SystemApplicationController.js` | session เปลี่ยนระบบ ออกจากระบบ และ expiration |
| `apps/api/src/modules/line/SmartThaPhoLineMenu.js` | ข้อความเมนูกลาง/ยังไม่เปิดบริการ |
| `apps/api/src/modules/line/lineBot.js` | การแยกคำสั่ง LINE ไปยังบริการที่เปิดอยู่ |

## แนวทางทำต่อจากแบบออกแบบ

1. ยืนยันข้อกำหนดผู้แจ้งเหตุ เจ้าหน้าที่เทศบาล หน่วยกู้ภัย ข้อมูลเหตุ พิกัด และเงื่อนไขการยกเลิก
2. สร้าง Domain ของเหตุ ทีม รถ และกฎสถานะ โดยไม่ import Express/MariaDB
3. สร้าง Use Case รับเหตุ ตรวจข้อมูล มอบหมายทรัพยากร ตรวจความพร้อม ปฏิบัติงาน และปิดเหตุ
4. สร้าง repository contracts/implementations พร้อม migration ใหม่ที่ยืนยันกับ ERD แล้ว
5. ประกอบบริการผ่าน composition root และเพิ่ม HTTP/UI/LINE adapters
6. ทดสอบสิทธิ์ ความพร้อมของทรัพยากร การมอบหมายซ้ำ การยกเลิก การแจ้งเตือน และประวัติ

ขั้นตอนนี้เป็นแนวทางพัฒนา ไม่ใช่รายการที่มีอยู่ในโค้ดครบแล้ว ห้ามเชื่อม workspace เข้ากับข้อมูล mock แล้วระบุว่ารองรับแจ้งเหตุจริง

## ข้อควรระวัง

- ไม่ใช้ตาราง `cases` ของระบบสุนัขและแมวเป็นตารางเหตุสาธารณภัยเพียงเพราะชื่อคล้ายกัน
- ต้องแยกข้อความแจ้งเหตุใหม่ให้เจ้าหน้าที่ออกจากข้อความแจ้งสถานะกลับผู้แจ้ง
- การติดตามรถฉุกเฉินผ่าน OBD2/GPS ยังต้องมี integration จริง ไม่ใช้ตำแหน่งตัวอย่างแทนหลักฐาน
- ต้องทดสอบการรับเหตุหลายรายการพร้อมกันและป้องกันใช้ทรัพยากรเดียวซ้อนงานตามกฎที่ตกลง
- ระบบยังไม่ผ่านการตรวจรับสำหรับใช้งานตอบสนองเหตุฉุกเฉิน ห้ามอาศัยเมนูต้นแบบแทนช่องทางฉุกเฉินที่หน่วยงานใช้อยู่
