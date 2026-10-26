import { useEffect, useState } from "react";
import {
  OperationsShell,
  Message,
  PageHeading,
} from "@smart-thapho/web-core/operations";
import WaterTreatmentProcessDiagram from "./components/WaterTreatmentProcessDiagram.jsx";
import "../waterworks-dashboard.css";
import "./water-operations.css";
const NAV = [
  { id: "overview", label: "ภาพรวม" },
  { id: "output", label: "น้ำจ่ายออก" },
  { id: "readings", label: "จดมิเตอร์" },
  { id: "review", label: "ตรวจและสรุปรอบ" },
  { id: "diagram", label: "แผนผังระบบน้ำ" },
  { id: "reports", label: "รายงาน" },
];
const n = (v) =>
  v == null
    ? "—"
    : new Intl.NumberFormat("th-TH", { maximumFractionDigits: 2 }).format(v);
const date = (v) =>
  new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(
    new Date(`${v}T12:00:00`),
  );
function Zones({ summary: s }) {
  return (
    <section className="ops-panel">
      <div className="ops-panel-heading">
        <h2>สรุปตามเขตจ่าย</h2>
        <span className={`ops-badge ${s.complete ? "success" : "warning"}`}>
          {s.complete ? "ข้อมูลครบ" : "รอข้อมูล"}
        </span>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>เขตจ่าย</th>
              <th>น้ำจ่ายออก</th>
              <th>น้ำใช้</th>
              <th>ไม่เรียกเก็บ</th>
              <th>ส่วนต่าง</th>
              <th>จดมิเตอร์</th>
            </tr>
          </thead>
          <tbody>
            {s.zones.map((z) => (
              <tr key={z.id}>
                <td>{z.name}</td>
                {[z.output, z.usage, z.authorized, z.difference].map((v, i) => (
                  <td key={i} className="numeric">
                    {n(v)}
                  </td>
                ))}
                <td>
                  {z.recorded}/{z.total} ราย
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="ops-panel-body ops-subtle">
        หน่วยทั้งหมด: ลบ.ม. • เปรียบเทียบพื้นที่และช่วงเวลาเดียวกัน
      </p>
    </section>
  );
}
function Readings({ model, save, onDirty }) {
  const [query, Q] = useState(""),
    [zone, Z] = useState("all"),
    [page, P] = useState(0),
    [draft, D] = useState({});
  const rows = model.round.households.filter(
    (r) =>
      (zone === "all" || r.zoneId === zone) &&
      `${r.id} ${r.address}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <div className="ops-toolbar">
        <input
          type="search"
          aria-label="ค้นหาผู้ใช้น้ำ"
          placeholder="ค้นหาเลขผู้ใช้น้ำหรือบ้านเลขที่"
          value={query}
          onChange={(e) => {
            Q(e.target.value);
            P(0);
          }}
        />
        <label>
          เขตจ่าย
          <select
            value={zone}
            onChange={(e) => {
              Z(e.target.value);
              P(0);
            }}
          >
            <option value="all">ทุกเขตจ่าย</option>
            {model.round.zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <section className="ops-panel">
        <div className="ops-panel-heading">
          <div>
            <h2>เลขมิเตอร์รายครัวเรือน</h2>
            <p>
              บันทึกแล้ว {model.summary.recorded}/{model.summary.total} ราย
            </p>
          </div>
          <button
            className="ops-primary"
            disabled={
              Boolean(model.round.closedAt) || !Object.keys(draft).length
            }
            onClick={() => {
              if (save(draft)) {
                D({});
                onDirty(false);
              }
            }}
          >
            บันทึกเลขมิเตอร์
          </button>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>เลขผู้ใช้น้ำ</th>
                <th>บ้านเลขที่</th>
                <th>เลขครั้งก่อน</th>
                <th>เลขครั้งนี้</th>
                <th>น้ำใช้ (ลบ.ม.)</th>
                <th>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(page * 12, page * 12 + 12).map((r) => (
                <tr key={r.id}>
                  <td>
                    {r.id}
                    <small>
                      {model.round.zones.find((z) => z.id === r.zoneId)?.name}
                    </small>
                  </td>
                  <td>{r.address}</td>
                  <td className="numeric">{n(r.previous)}</td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      aria-label={`เลขมิเตอร์ครั้งนี้ ${r.id}`}
                      value={draft[r.id] ?? r.current ?? ""}
                      disabled={Boolean(model.round.closedAt)}
                      onChange={(e) => {
                        D({ ...draft, [r.id]: e.target.value });
                        onDirty(true);
                      }}
                    />
                  </td>
                  <td className="numeric">{Object.hasOwn(draft,r.id) ? "รอบันทึก" : n(r.usage)}</td>
                  <td>
                    <span
                      className={`ops-badge ${Object.hasOwn(draft, r.id) || r.current === null ? "warning" : "success"}`}
                    >
                      {Object.hasOwn(draft, r.id)
                        ? "ยังไม่บันทึก"
                        : r.current === null
                          ? "ยังไม่กรอก"
                          : "บันทึกแล้ว"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && (
            <div className="ops-empty">ไม่พบผู้ใช้น้ำตามคำค้น</div>
          )}
        </div>
        <div className="ops-pagination">
          <button disabled={page === 0} onClick={() => P(page - 1)}>
            ก่อนหน้า
          </button>
          <span>
            หน้า {page + 1}/{Math.max(1, Math.ceil(rows.length / 12))}
          </span>
          <button
            disabled={(page + 1) * 12 >= rows.length}
            onClick={() => P(page + 1)}
          >
            ถัดไป
          </button>
        </div>
      </section>
      <p className="ops-notice">
        น้ำใช้ = เลขมิเตอร์ครั้งนี้ − เลขครั้งก่อน •
        กรณีเปลี่ยนมิเตอร์หรือเลขวนรอบ ต้องตรวจสอบแยก ไม่หักเลขติดลบอัตโนมัติ
      </p>
    </>
  );
}
function Output({ model, save }) {
  const [id, ID] = useState(model.round.zones[0].id);
  const z = model.round.zones.find((v) => v.id === id);
  return (
    <section className="ops-panel">
      <div className="ops-panel-heading">
        <h2>บันทึกมาตรหลักของเขตจ่าย</h2>
        <label>
          เขตจ่าย
          <select value={id} onChange={(e) => ID(e.target.value)}>
            {model.round.zones.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <form
        key={`${id}-${z.current}`}
        className="ops-form ops-panel-body"
        onSubmit={(e) => {
          e.preventDefault();
          save(id, Object.fromEntries(new FormData(e.currentTarget)));
        }}
      >
        {[
          ["previous", "เลขมาตรหลักต้นรอบ", z.previous],
          ["current", "เลขมาตรหลักปลายรอบ", z.current],
          ["authorized", "น้ำใช้ที่อนุญาตแต่ไม่เรียกเก็บ", z.authorized],
        ].map(([key, label, value]) => (
          <label key={key}>
            {label} (ลบ.ม.)
            <input
              type="number"
              name={key}
              min="0"
              step="0.01"
              defaultValue={value ?? ""}
              required
              disabled={Boolean(model.round.closedAt)}
            />
          </label>
        ))}
        <label>
          รายละเอียดน้ำใช้ที่ไม่เรียกเก็บ
          <input
            name="note"
            defaultValue={z.note}
            placeholder="เช่น ล้างระบบ 80 ลบ.ม."
            disabled={Boolean(model.round.closedAt)}
          />
        </label>
        <p className="ops-notice full">
          น้ำจ่ายออก = เลขมาตรหลักปลายรอบ − ต้นรอบ • ช่วง{" "}
          {date(model.round.start)} – {date(model.round.end)}{" "}
          ต้องตรงกับรอบจดมิเตอร์
        </p>
        <div className="full">
          <button
            className="ops-primary"
            disabled={Boolean(model.round.closedAt)}
          >
            บันทึกน้ำจ่ายออก
          </button>
        </div>
      </form>
    </section>
  );
}
function Diagram({ controller }) {
  const [data, S] = useState(null),
    [selected, Select] = useState("water-tower"),
    [error, E] = useState("");
  useEffect(() => {
    let active = true;
    controller
      .loadDashboard()
      .then((v) => {
        if (active) S(v);
      })
      .catch((e) => {
        if (active) E(e.message);
      });
    return () => {
      active = false;
    };
  }, [controller]);
  return (
    <section className="ops-panel">
      <div className="ops-panel-heading">
        <div>
          <h2>แผนผังการผลิตและจ่ายน้ำประปา</h2>
          <p>
            ภาพประกอบกระบวนการเดิม ไม่ใช่ค่าตรวจวัดหรือการเชื่อมต่ออุปกรณ์จริง
          </p>
        </div>
      </div>
      <Message error={error} />
      {data ? (
        <>
          <div className="water-reference-diagram">
            <WaterTreatmentProcessDiagram
              points={data.points}
              selectedPointId={selected}
              onSelect={Select}
            />
          </div>
          <div className="ops-panel-body">
            <strong>
              ตำแหน่งที่เลือก:{" "}
              {data.points.find((p) => p.id === selected)?.name}
            </strong>
            <p>
              คำนวณน้ำส่วนต่างจากเมนูน้ำจ่ายออกและจดมิเตอร์
              ไม่ใช้ค่าแรงดันหรือคุณภาพน้ำในผัง
            </p>
          </div>
        </>
      ) : (
        <div className="ops-empty">กำลังโหลดแผนผัง…</div>
      )}
    </section>
  );
}
export default function WaterOperationsApp({ controller, billing }) {
  const [active, A] = useState("overview"),
    [model, M] = useState(null),
    [error, E] = useState(""),
    [success, S] = useState(""),
    [dirty, D] = useState(false),
    [newRound, N] = useState(false);
  useEffect(() => {
    try {
      M(billing.load());
    } catch (e) {
      E(e.message);
    }
  }, [billing]);
  useEffect(() => {
    const fn = (e) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", fn);
    return () => window.removeEventListener("beforeunload", fn);
  }, [dirty]);
  const run = (fn, msg) => {
    try {
      M(fn());
      E("");
      S(msg);
      return true;
    } catch (e) {
      E(e.message);
      S("");
      return false;
    }
  };
  const nav = (id) => {
    if (
      dirty &&
      !window.confirm("มีเลขมิเตอร์ยังไม่บันทึก ต้องการออกจากหน้านี้หรือไม่?")
    )
      return;
    D(false);
    A(id);
    E("");
    S("");
  };
  const round = (id) => {
    if (
      dirty &&
      !window.confirm("มีรายการยังไม่บันทึก ต้องการเปลี่ยนรอบหรือไม่?")
    )
      return;
    D(false);
    run(() => billing.view(id), "");
  };
  const s = model?.summary;
  return (
    <OperationsShell
      title="ระบบมอนิเตอร์การใช้น้ำประปา"
      navigation={NAV}
      active={active}
      onNavigate={nav}
      systemController={controller}
    >
      <PageHeading
        title={
          {
            overview: "น้ำจ่ายออกและน้ำใช้",
            output: "บันทึกน้ำจ่ายออก",
            readings: "กรอกเลขมิเตอร์รอบใช้น้ำ",
            review: "ตรวจสอบและสรุปรอบใช้น้ำ",
            diagram: "แผนผังระบบน้ำ",
            reports: "รายงานรอบใช้น้ำ",
          }[active]
        }
        description="เปรียบเทียบปริมาณน้ำในพื้นที่และช่วงเวลาเดียวกัน"
      >
        {active === "overview" && (
          <button className="ops-primary" onClick={() => nav("readings")}>
            กรอกข้อมูลรอบใช้น้ำ
          </button>
        )}
      </PageHeading>
      <Message error={error} success={success} />
      {model && (
        <>
          <div className="ops-toolbar">
            <label>
              รอบใช้น้ำ
              <select
                value={model.round.id}
                onChange={(e) => round(e.target.value)}
              >
                {model.rounds.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                    {r.closedAt ? " • ยืนยันแล้ว" : " • กำลังบันทึก"}
                  </option>
                ))}
              </select>
            </label>
            <span>
              {date(model.round.start)} – {date(model.round.end)}
            </span>
          </div>
          <div className="ops-stack">
            {active === "overview" && (
              <>
                <section className="ops-panel">
                  <div className="ops-stats">
                    {[
                      ["น้ำจ่ายออก", s.output],
                      ["น้ำใช้จากมิเตอร์", s.usage],
                      ["ใช้โดยไม่เรียกเก็บ", s.authorized],
                      ["น้ำส่วนต่าง", s.difference],
                    ].map(([label, v]) => (
                      <div key={label} className="ops-stat">
                        <span>{label}</span>
                        <strong>{n(v)}</strong>
                        <small>
                          ลบ.ม.
                          {label === "น้ำส่วนต่าง" && s.percent !== null
                            ? ` (${n(s.percent)}%)`
                            : ""}
                        </small>
                      </div>
                    ))}
                  </div>
                  <div className="ops-panel-body">
                    {s.complete && s.output > 0 ? (
                      <div className="water-comparison">
                        {[
                          ["น้ำจ่ายออก", s.output],
                          ["น้ำใช้จากมิเตอร์", s.usage],
                        ].map(([label, v]) => (
                          <div key={label}>
                            <span>{label}</span>
                            <meter
                              aria-label={label}
                              min="0"
                              max={Math.max(s.output, s.usage)}
                              value={v}
                            />
                            <strong>{n(v)}</strong>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Message
                        error={`ยังสรุปน้ำส่วนต่างไม่ได้: กรอกมิเตอร์แล้ว ${s.recorded}/${s.total} ราย และต้องมีน้ำจ่ายออกครบทุกเขต`}
                      />
                    )}
                    <p>
                      ส่วนต่าง = น้ำจ่ายออก − น้ำใช้จากมิเตอร์ −
                      น้ำใช้ที่อนุญาตไม่เรียกเก็บ
                    </p>
                    {s.suspicious && (
                      <Message error="พบส่วนต่างติดลบหรือน้ำจ่ายเป็นศูนย์ กรุณาตรวจข้อมูล" />
                    )}
                    <p className="ops-notice">
                      ส่วนต่างเป็นข้อมูลเพื่อการตรวจสอบ
                      ไม่ใช่ข้อยืนยันว่าท่อรั่ว ใช้ปริมาณ ลบ.ม.
                      ไม่ใช่ยอดเงินค่าน้ำ
                    </p>
                  </div>
                </section>
                <Zones summary={s} />
              </>
            )}
            {active === "readings" && (
              <Readings
                key={model.round.id}
                model={model}
                onDirty={D}
                save={(c) =>
                  run(
                    () => billing.saveReadings(model.round.id, c),
                    "บันทึกเลขมิเตอร์แล้ว",
                  )
                }
              />
            )}
            {active === "output" && (
              <Output
                key={model.round.id}
                model={model}
                save={(id, c) =>
                  run(
                    () => billing.saveOutput(model.round.id, id, c),
                    "บันทึกน้ำจ่ายออกแล้ว",
                  )
                }
              />
            )}
            {active === "review" && (
              <div className="water-review">
                <ol className="water-steps">
                  <li>
                    น้ำจ่ายออก<small>{n(s.output)} ลบ.ม.</small>
                  </li>
                  <li>
                    น้ำใช้จากมิเตอร์
                    <small>
                      {s.recorded}/{s.total} ราย
                    </small>
                  </li>
                  <li className="is-active">
                    สรุปน้ำส่วนต่าง
                    <small>
                      {model.round.closedAt ? "ยืนยันแล้ว" : "รอยืนยัน"}
                    </small>
                  </li>
                </ol>
                <section className="ops-panel">
                  <div className="ops-panel-heading">
                    <h2>ตรวจสอบก่อนยืนยันรอบ</h2>
                  </div>
                  <div className="ops-panel-body">
                    <dl className="ops-definition">
                      {[
                        [
                          "ช่วงเวลา",
                          `${date(model.round.start)} – ${date(model.round.end)}`,
                        ],
                        ["น้ำจ่ายออก", `${n(s.output)} ลบ.ม.`],
                        ["น้ำใช้รวม", `${n(s.usage)} ลบ.ม.`],
                        ["ไม่เรียกเก็บ", `${n(s.authorized)} ลบ.ม.`],
                        [
                          "น้ำส่วนต่าง",
                          `${n(s.difference)} ลบ.ม. (${n(s.percent)}%)`,
                        ],
                        ["มิเตอร์", `${s.recorded}/${s.total} ราย`],
                      ].map(([a, b]) => (
                        <div className="water-definition-row" key={a}>
                          <dt>{a}</dt>
                          <dd>{b}</dd>
                        </div>
                      ))}
                    </dl>
                    {!s.complete && (
                      <Message error="ข้อมูลยังไม่ครบ จึงยังสรุปน้ำส่วนต่างไม่ได้" />
                    )}
                    {s.suspicious && (
                      <Message error="ส่วนต่างผิดปกติ กรุณาตรวจข้อมูลก่อนยืนยัน" />
                    )}
                    <p className="ops-notice">
                      ยืนยันแล้วข้อมูลรอบนี้จะถูกล็อก
                      เพื่อไม่ให้ยอดย้อนหลังเปลี่ยนโดยไม่ตั้งใจ •
                      ส่วนต่างไม่ได้ยืนยันว่าท่อรั่ว
                    </p>
                    <div className="ops-actions water-review-actions">
                      <button onClick={() => nav("readings")}>
                        กลับไปตรวจมิเตอร์
                      </button>
                      <button
                        className="ops-primary"
                        disabled={
                          !s.complete ||
                          s.suspicious ||
                          Boolean(model.round.closedAt)
                        }
                        onClick={() => {
                          if (
                            window.confirm(
                              "ยืนยันรอบนี้และล็อกข้อมูลย้อนหลังหรือไม่?",
                            )
                          )
                            run(
                              () => billing.closeRound(model.round.id),
                              "ยืนยันสรุปรอบแล้ว",
                            );
                        }}
                      >
                        {model.round.closedAt
                          ? "ยืนยันรอบแล้ว"
                          : "ยืนยันสรุปรอบ"}
                      </button>
                    </div>
                  </div>
                </section>
              </div>
            )}
            {active === "diagram" && <Diagram controller={controller} />}{" "}
            {active === "reports" && (
              <>
                <Zones summary={s} />
                <section className="ops-panel">
                  <div className="ops-panel-heading">
                    <h2>ประวัติและรอบใหม่</h2>
                    <button onClick={() => N(!newRound)}>
                      {newRound ? "ยกเลิกการสร้าง" : "สร้างรอบถัดไป"}
                    </button>
                  </div>
                  {newRound && (
                    <form
                      className="ops-form ops-panel-body"
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (
                          run(
                            () =>
                              billing.createRound(
                                Object.fromEntries(
                                  new FormData(e.currentTarget),
                                ),
                              ),
                            "สร้างรอบใหม่แล้ว เลขปลายรอบเดิมถูกยกมาเป็นต้นรอบ",
                          )
                        )
                          N(false);
                      }}
                    >
                      <label>
                        ชื่อรอบ
                        <input
                          name="name"
                          required
                          placeholder="เช่น ตุลาคม 2569"
                        />
                      </label>
                      <div />
                      <label>
                        วันที่เริ่ม
                        <input type="date" name="start" required />
                      </label>
                      <label>
                        วันที่สิ้นสุด
                        <input type="date" name="end" required />
                      </label>
                      <button className="ops-primary">สร้างรอบใช้น้ำ</button>
                    </form>
                  )}
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>รอบ</th>
                          <th>ช่วงเวลา</th>
                          <th>สถานะ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {model.rounds.map((r) => (
                          <tr key={r.id}>
                            <td>
                              <button
                                onClick={() => {
                                  round(r.id);
                                  A("overview");
                                }}
                              >
                                {r.name}
                              </button>
                            </td>
                            <td>
                              {date(r.start)} – {date(r.end)}
                            </td>
                            <td>{r.closedAt ? "ยืนยันแล้ว" : "กำลังบันทึก"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            )}
          </div>
        </>
      )}
    </OperationsShell>
  );
}
