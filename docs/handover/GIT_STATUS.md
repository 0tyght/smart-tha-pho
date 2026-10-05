# สถานะ Git และเวอร์ชันที่ใช้ตรวจเอกสาร

[กลับคู่มือหลัก](README.md)

ตรวจวันที่ 5 ตุลาคม 2569 เวลาอ้างอิง Asia/Bangkok โดยอ่าน remote ล่าสุดลงพื้นที่ตรวจสอบแยก ไม่ได้ fetch/merge/pull เข้า working tree ของผู้ใช้งาน และไม่ได้ commit/push

## ผลตรวจ

| รายการ | ผล |
| --- | --- |
| Repository | https://github.com/0tyght/smart-tha-pho |
| Branch ในเครื่อง | main |
| HEAD ในเครื่อง | `0704c587ff32c9aa5587992ec00c04024cc6d7e7` |
| main บน GitHub ณ เวลาตรวจ | `b2c5c8bf70d52df09fdfe58bfc58deb56886b25c` |
| Commit เฉพาะในเครื่อง | 1 |
| Commit เฉพาะบน remote | 5 |
| ไฟล์ tracked ที่แก้ค้าง | 17 |
| ไฟล์ใหม่ที่ยังไม่ tracked ไม่รวมคู่มือชุดนี้ | 25 |
| SQL ใน database/ | 37 ไฟล์ตรงกับ remote ทั้งหมด เมื่อเทียบ Git blob ตาม line-ending/filter ของ repository |
| ฐานข้อมูลจริง/สำรองข้อมูล | ยังไม่ได้ตรวจหรือ export ในรอบนี้ |

จึงยังระบุไม่ได้ว่า “โค้ดทั้งหมดขึ้น Git เป็นล่าสุดแล้ว” คู่มือนี้อธิบาย working tree ที่มีงานค้าง ซึ่งผู้รับมอบ clone remote อย่างเดียวจะไม่ได้ไฟล์ใหม่ทั้งหมดที่กล่าวถึง จำนวนไฟล์ข้างต้นไม่นับคู่มือส่งมอบชุดนี้อีก 8 ไฟล์ซึ่งจัดทำใหม่และยังไม่ได้ commit

## Commit ที่ต่างกัน

`<` คืออยู่เฉพาะในเครื่อง และ `>` คืออยู่เฉพาะ remote:

```text
> b2c5c8b 2026-09-21 chore: sync TYTC temporary public URL
> 398c9e4 2026-09-17 fix(water): refine SCADA process overview
> e0c762c 2026-09-17 feat(water): deploy interactive treatment monitoring
< 0704c58 2026-09-17 feat(water): deploy interactive treatment monitoring
> 02860a8 2026-09-07 chore: sync TYTC temporary public URL
> 683f9fd 2026-09-07 fix: prefer current runtime API URL after tunnel rotation
```

เป็นประวัติที่แยกกัน ไม่ควรตัดสินจากชื่อ commit ว่าเป็นงานต่างกันทั้งหมดหรือเหมือนกันทั้งหมด มี commit ประปาชื่อเดียวกันแต่ SHA ต่างกัน ต้องตรวจ diff ก่อนรวมงาน

ไฟล์ที่ต่างระหว่างสอง commit tips (ไม่รวมการแก้ค้างใน working tree):

```text
apps/waterworks-management/src/presentation/components/WaterTreatmentProcessDiagram.jsx
apps/waterworks-management/src/waterworks-dashboard.css
packages/web-core/src/infrastructure/RuntimeConfigRepository.js
packages/web-core/test/runtime-config.test.js
runtime-config.json
```

รายละเอียดไฟล์แก้ค้างและ hash SQL อยู่ใน [SOURCE_AUDIT.json](SOURCE_AUDIT.json) ไม่มีค่าลับหรือข้อมูลประชาชนในไฟล์หลักฐานนี้

## ก่อนกำหนด release ส่งมอบ

1. สำรอง/เก็บงานที่ค้างโดยไม่ reset หรือลบทิ้ง แยก `.env` และ uploads ออกอย่างปลอดภัย
2. ให้ผู้รับผิดชอบตรวจ diff ของ local/remote โดยเฉพาะผังประปา runtime config และ refactor API/UI ที่ยังไม่ commit
3. รวมงานด้วยวิธีที่ทีมเลือกและทดสอบ ไม่ใช้ force push เพื่อข้ามความขัดแย้ง
4. รัน architecture check, tests, build และตรวจ workflow ที่เกี่ยวข้อง
5. Commit งานที่เลือก แล้ว push เมื่อได้รับอนุญาต จากนั้นเทียบ HEAD/remote ใหม่และกำหนด tag ส่งมอบ
6. ปรับหลักฐานและคู่มือให้ผูกกับ release commit ที่ตกลง ไม่ใช้ snapshot นี้แทนผลตรวจหลัง merge

เอกสารชุดนี้ไม่ได้ทำข้อ 1–6 แทนทีม ไม่ได้ push โค้ดหรือ SQL และไม่มี backup ข้อมูลจริงแนบ
