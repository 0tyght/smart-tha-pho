export function createDisasterSeed() {
  const now = Date.now();
  const items = [
    {
      id: "DIS-026",
      title: "น้ำท่วมขัง",
      location: "หมู่ 4 ตำบลท่าโพธิ์",
      description:
        "ตัวอย่าง: น้ำท่วมขังบริเวณถนนภายในหมู่บ้าน ต้องตรวจสอบพื้นที่และทางระบายน้ำ",
      lat: 16.757,
      lng: 100.207,
      severity: "HIGH",
      status: "VERIFIED",
      createdAt: "2026-10-27T03:18:00Z",
    },
    {
      id: "DIS-025",
      title: "ต้นไม้ล้มขวางถนน",
      location: "หมู่ 2 ตำบลท่าโพธิ์",
      description: "ตัวอย่าง: กิ่งไม้กีดขวางการจราจร เจ้าหน้าที่กำลังเดินทาง",
      lat: 16.765,
      lng: 100.217,
      severity: "MEDIUM",
      status: "EN_ROUTE",
      teamId: "team-1",
      vehicleId: "vehicle-1",
      createdAt: "2026-10-27T02:47:00Z",
    },
    {
      id: "DIS-024",
      title: "ไฟไหม้หญ้า",
      location: "หมู่ 6 ตำบลท่าโพธิ์",
      description:
        "ตัวอย่าง: รับแจ้งควันบริเวณพื้นที่ว่าง รอเจ้าหน้าที่ตรวจสอบรายละเอียด",
      lat: 16.748,
      lng: 100.198,
      severity: "HIGH",
      status: "NEW",
      createdAt: "2026-10-27T02:12:00Z",
    },
  ];
  return {
    incidents: items.map((item, index) => {
      const createdAt = new Date(now - (12 + index * 31) * 60000).toISOString();
      return {
        ...item,
        createdAt,
        history: [
          {
            status: "NEW",
            note: "รับแจ้งเหตุ (ข้อมูลตัวอย่าง)",
            at: createdAt,
          },
          ...(item.status !== "NEW"
            ? [
                {
                  status: item.status,
                  note: "สถานะเริ่มต้นสำหรับทดลองหน้าจอ",
                  at: createdAt,
                },
              ]
            : []),
        ],
      };
    }),
    teams: [1, 2, 3].map((id) => ({
      id: `team-${id}`,
      name: `ทีมกู้ภัย ${id}`,
    })),
    vehicles: [1, 2, 3].map((id) => ({
      id: `vehicle-${id}`,
      name: `รถกู้ภัย 0${id}`,
    })),
  };
}
