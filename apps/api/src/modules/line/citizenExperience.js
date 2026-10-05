import { lineChannelSettings } from "./lineChannelSettings.js";
import { citizenExperienceService } from "../../composition-root/citizenExperienceContainer.js";

export async function loadCitizenExperienceByLineUserId(lineUserId) {
  return citizenExperienceService.loadByLineUserId(lineUserId);
}

export async function syncRichMenuForLineUser(lineUserId, suppliedState = null) {
  const normalizedLineUserId = String(lineUserId || "").trim();

  if (!normalizedLineUserId) {
    return { status: "SKIPPED", reason: "NO_LINE_USER_ID" };
  }

  if (!/^U[0-9a-f]{32}$/i.test(normalizedLineUserId)) {
    return { status: "SKIPPED", reason: "INVALID_OR_DEMO_LINE_USER_ID" };
  }

  const citizenChannel = await lineChannelSettings.get("CITIZEN");
  if (!citizenChannel.channelAccessToken) {
    return { status: "SKIPPED", reason: "NO_CHANNEL_ACCESS_TOKEN" };
  }

  const state = suppliedState || await loadCitizenExperienceByLineUserId(normalizedLineUserId);
  const { showWizardMainMenu } = await import("./lineRichMenuWizard.js");
  const linked = await showWizardMainMenu(normalizedLineUserId, state);

  return {
    status: linked ? "LINKED" : "SKIPPED",
    reason: linked ? undefined : "INVALID_LINE_USER_ID",
    menuKey: state.linked ? "owner" : "guest",
  };
}

function countLine(label, value) {
  return `${label} ${Number(value || 0).toLocaleString("th-TH")} รายการ`;
}

export function buildCitizenStatusFlex(state) {
  const counts = state.counts || {};
  const accent = state.menuKey === "action" ? "#D97706" : "#087F5B";
  const heading = state.linked
    ? `สวัสดี ${state.owner?.fullName || "เจ้าของสัตว์เลี้ยง"}`
    : "เริ่มใช้บริการ ThaPho PET";

  const summary = state.linked
    ? [
        countLine("สัตว์ในทะเบียน", counts.pets),
        countLine("ข้อมูลรอตรวจสอบ", counts.pending),
        countLine("ต้องแก้ไขข้อมูล", counts.needsAttention),
        countLine("วัคซีนใกล้ครบกำหนด", counts.vaccinationDue),
      ].join("\n")
    : "ลงทะเบียนสัตว์ ติดตามข้อมูลที่ส่ง หรือเชื่อมทะเบียนเดิมได้จากเมนูด้านล่าง";

  return {
    type: "flex",
    altText: state.linked
      ? `ข้อมูล ThaPho PET: มีสัตว์ ${Number(counts.pets || 0)} ตัว`
      : "เริ่มใช้บริการ ThaPho PET",
    contents: {
      type: "bubble",
      size: "kilo",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: accent,
        paddingAll: "18px",
        contents: [
          { type: "text", text: "THAPHO PET", color: "#FFFFFF", weight: "bold", size: "xs" },
          { type: "text", text: heading, color: "#FFFFFF", weight: "bold", size: "lg", wrap: true, margin: "sm" },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "18px",
        contents: [
          { type: "text", text: summary, wrap: true, size: "sm", color: "#334155" },
          ...(state.linked && state.location?.missing
            ? [{
                type: "text",
                text: "ยังไม่ได้ระบุตำแหน่งบ้าน เลือก ‘ข้อมูลเจ้าของ’ จาก Rich Menu เพื่อเพิ่มตำแหน่ง",
                wrap: true,
                size: "sm",
                color: "#B45309",
                weight: "bold",
                margin: "md",
              }]
            : []),
          {
            type: "text",
            text: "เลือกบริการจาก Rich Menu ด้านล่าง",
            wrap: true,
            size: "xs",
            color: "#64748B",
            margin: "lg",
          },
        ],
      },
    },
  };
}
