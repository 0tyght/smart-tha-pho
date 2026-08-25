const CHANNEL_KINDS = new Set(["SMART", "CITIZEN", "DRIVER"]);

export class LineChannelProfile {
  constructor({ kind, channelSecret, channelAccessToken, channelId = null }) {
    if (!CHANNEL_KINDS.has(kind)) throw new TypeError(`Unsupported LINE channel kind: ${kind}`);
    this.kind = kind;
    this.channelSecret = String(channelSecret || "").trim();
    this.channelAccessToken = String(channelAccessToken || "").trim();
    this.channelId = String(channelId || "").trim() || null;
    Object.freeze(this);
  }

  get configured() {
    return Boolean(this.channelSecret && this.channelAccessToken);
  }

  requireSecret() {
    if (!this.channelSecret) {
      throw new Error("ยังไม่ได้ตั้งค่า LINE_CHANNEL_SECRET");
    }
    return this.channelSecret;
  }

  requireAccessToken() {
    if (!this.channelAccessToken) {
      throw new Error("ยังไม่ได้ตั้งค่า LINE_CHANNEL_ACCESS_TOKEN");
    }
    return this.channelAccessToken;
  }
}
