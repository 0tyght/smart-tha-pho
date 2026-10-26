export function createWaterBillingSeed() {
  const definitions = [
    {
      id: "zone-1",
      name: "เขตจ่าย 1",
      count: 160,
      output: 20000,
      usage: 17000,
      authorized: 400,
    },
    {
      id: "zone-2",
      name: "เขตจ่าย 2",
      count: 140,
      output: 18000,
      usage: 15000,
      authorized: 300,
    },
    {
      id: "zone-3",
      name: "เขตจ่าย 3",
      count: 100,
      output: 12000,
      usage: 10000,
      authorized: 300,
    },
  ];
  let number = 0;
  const households = definitions.flatMap((zone) =>
    Array.from({ length: zone.count }, (_, index) => {
      number += 1;
      const previous = 1000 + number * 20;
      const usage =
        Math.floor(zone.usage / zone.count) +
        (index < zone.usage % zone.count ? 1 : 0);
      return {
        id: `W${String(number).padStart(3, "0")}`,
        address: `${index + 1}/1`,
        zoneId: zone.id,
        previous,
        current: previous + usage,
      };
    }),
  );
  return {
    rounds: [
      {
        id: "2026-09",
        name: "กันยายน 2569",
        start: "2026-09-01",
        end: "2026-09-30",
        closedAt: null,
        zones: definitions.map((zone) => ({
          id: zone.id,
          name: zone.name,
          previous: 100000,
          current: 100000 + zone.output,
          authorized: zone.authorized,
          note: "ตัวอย่าง: ล้างระบบและใช้สาธารณะ",
        })),
        households,
      },
    ],
  };
}
