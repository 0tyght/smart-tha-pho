import {
  setDefaultStandaloneRichMenu,
  showStandaloneRichMenuForLineUser,
} from "./lineRichMenuWizard.js";

function postback(
  label,
  data,
  displayText = label,
) {
  return {
    type: "postback",
    label,
    data,
    displayText,
    inputOption: "openRichMenu",
  };
}

export function buildSmartThaPhoMainRichMenuDefinition() {
  return {
    key: "smart-tha-pho-main-v1",
    title: "Smart Tha Pho",
    subtitle: "เลือกบริการที่ต้องการใช้งาน",
    cacheScope: "static",
    isMain: true,
    choices: [
      {
        label: "ทะเบียนสัตว์เลี้ยง",
        action: postback(
          "ทะเบียนสัตว์เลี้ยง",
          "smart=pet",
          "เปิดระบบทะเบียนสัตว์เลี้ยง",
        ),
      },
      {
        label: "รถเก็บขยะ",
        action: postback(
          "รถเก็บขยะ",
          "smart=waste",
          "เปิดระบบบริหารจัดการการเก็บขยะ",
        ),
      },
      {
        label: "บรรเทาสาธารณภัย",
        action: postback(
          "บรรเทาสาธารณภัย",
          "smart=disaster",
          "เปิดระบบบรรเทาสาธารณภัย",
        ),
      },
      {
        label: "การประปา",
        action: postback(
          "การประปา",
          "smart=waterworks",
          "เปิดระบบการประปา",
        ),
      },
    ],
  };
}

export function buildWasteCitizenRichMenuDefinition() {
  return {
    key: "smart-tha-pho-waste-citizen-v1",
    title: "บริการเก็บขยะ",
    subtitle: "ประชาชน • เทศบาลเมืองท่าโพธิ์",
    cacheScope: "static",
    isMain: true,
    choices: [
      {
        label: "ลงทะเบียนผู้ใช้บริการเก็บขยะ",
        action: postback(
          "ลงทะเบียนผู้ใช้บริการเก็บขยะ",
          "waste=register",
          "ลงทะเบียนผู้ใช้บริการเก็บขยะ",
        ),
      },
      {
        label: "ตารางกำหนดการ",
        action: postback(
          "ตารางกำหนดการ",
          "waste=citizen_schedule",
          "ตารางกำหนดการเก็บขยะประจำพื้นที่",
        ),
      },
      {
        label: "ตำแหน่งรถเก็บขยะ",
        action: postback(
          "ตำแหน่งรถเก็บขยะ",
          "waste=citizen_location",
          "ดูตำแหน่งรถเก็บขยะ",
        ),
      },
      {
        label: "ค่าบริการเก็บขยะ",
        action: postback(
          "ค่าบริการเก็บขยะ",
          "waste=citizen_charges",
          "ตรวจสอบค่าบริการเก็บขยะ",
        ),
      },
      {
        label: "งานพนักงานประจำรถขยะ",
        action: postback(
          "งานพนักงานประจำรถขยะ",
          "waste=driver_menu",
          "เปิดเมนูพนักงานประจำรถขยะ",
        ),
      },
      {
        label: "Smart Tha Pho",
        action: postback(
          "Smart Tha Pho",
          "smart=menu",
          "กลับเมนูหลัก Smart Tha Pho",
        ),
      },
    ],
  };
}

export function buildWasteDriverRichMenuDefinition() {
  return {
    key: "smart-tha-pho-waste-driver-v1",
    title: "งานพนักงานประจำรถขยะ",
    subtitle: "Smart Tha Pho · สำหรับผู้ปฏิบัติงานที่ยืนยันตัวตนแล้ว",
    cacheScope: "static",
    isMain: true,
    choices: [
      {
        label: "งานของฉัน",
        action: postback(
          "งานของฉัน",
          "waste=driver_jobs",
          "ดูแผนปฏิบัติงานเก็บขยะที่ได้รับมอบหมาย",
        ),
      },
      {
        label: "งานวันนี้",
        action: postback(
          "งานวันนี้",
          "waste=driver_jobs_today",
          "ดูงานเก็บขยะวันนี้",
        ),
      },
      {
        label: "งานล่วงหน้า",
        action: postback(
          "งานล่วงหน้า",
          "waste=driver_jobs_upcoming",
          "ดูงานเก็บขยะล่วงหน้า",
        ),
      },
      {
        label: "ยืนยันตัวตน",
        action: postback(
          "ยืนยันตัวตน",
          "waste=driver_link",
          "ยืนยันตัวตนพนักงานประจำรถขยะ",
        ),
      },
      {
        label: "บริการประชาชน",
        action: postback(
          "บริการประชาชน",
          "waste=citizen_menu",
          "กลับเมนูบริการเก็บขยะสำหรับประชาชน",
        ),
      },
      {
        label: "Smart Tha Pho",
        action: postback(
          "Smart Tha Pho",
          "smart=menu",
          "กลับเมนูหลัก Smart Tha Pho",
        ),
      },
    ],
  };
}

export function showSmartThaPhoMainRichMenu(
  lineUserId,
) {
  return showStandaloneRichMenuForLineUser(
    lineUserId,
    buildSmartThaPhoMainRichMenuDefinition(),
  );
}

export function showWasteCitizenRichMenu(
  lineUserId,
) {
  return showStandaloneRichMenuForLineUser(
    lineUserId,
    buildWasteCitizenRichMenuDefinition(),
  );
}

export function showWasteDriverRichMenu(
  lineUserId,
) {
  return showStandaloneRichMenuForLineUser(
    lineUserId,
    buildWasteDriverRichMenuDefinition(),
  );
}

export function showWasteRichMenuForAudience(
  lineUserId,
  audience = "CITIZEN",
) {
  return String(audience).toUpperCase() === "DRIVER"
    ? showWasteDriverRichMenu(lineUserId)
    : showWasteCitizenRichMenu(lineUserId);
}

export function syncSmartThaPhoDefaultRichMenu() {
  return setDefaultStandaloneRichMenu(
    buildSmartThaPhoMainRichMenuDefinition(),
  );
}
