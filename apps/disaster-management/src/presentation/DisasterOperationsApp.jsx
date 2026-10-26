import { useEffect, useRef, useState } from "react";
import {
  OperationsShell,
  Message,
  PageHeading,
} from "@smart-thapho/web-core/operations";
import { INCIDENT_STATUS } from "../domain/DisasterIncident.js";
import IncidentMap from "./IncidentMap.jsx";
import "./disaster-operations.css";
const NAV = [
  { id: "incidents", label: "คิวรับแจ้งเหตุ" },
  { id: "map", label: "แผนที่เหตุ" },
  { id: "board", label: "ติดตามสถานะ" },
  { id: "resources", label: "ทีมและรถ" },
  { id: "reports", label: "รายงาน" },
];
const SEVERITY = { HIGH: "สูง", MEDIUM: "ปานกลาง", LOW: "ต่ำ" };
const time = (v) =>
  new Intl.DateTimeFormat("th-TH", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(v));
function Detail({ item, model, assign, transition, panelRef }) {
  if (!item)
    return (
      <aside className="ops-panel ops-empty">เลือกเหตุเพื่อดูรายละเอียด</aside>
    );
  return (
    <aside className="ops-panel disaster-detail" ref={panelRef} tabIndex={-1} aria-label={`รายละเอียดเหตุ ${item.id}`}>
      <div className="ops-panel-heading">
        <div>
          <strong>{item.id}</strong>
          <h2>{item.title}</h2>
        </div>
        <span className="ops-badge warning">{item.statusLabel}</span>
      </div>
      <div className="ops-panel-body">
        <p>{item.location}</p>
        <dl className="ops-definition">
          <dt>รับแจ้ง</dt>
          <dd>{time(item.createdAt)}</dd>
          <dt>ความเร่งด่วน</dt>
          <dd>{SEVERITY[item.severity]}</dd>
          <dt>พิกัดเหตุ</dt>
          <dd>
            {item.lat}, {item.lng}
          </dd>
          <dt>ทีมและรถ</dt>
          <dd>
            {item.teamName || "ยังไม่มอบหมาย"}
            {item.vehicleName && ` • ${item.vehicleName}`}
          </dd>
        </dl>
        <p>{item.description}</p>
        {item.status === "VERIFIED" && (
          <form
            className="disaster-assignment"
            onSubmit={(e) => {
              e.preventDefault();
              assign(
                item.id,
                Object.fromEntries(new FormData(e.currentTarget)),
              );
            }}
          >
            <h3>มอบหมายทรัพยากรที่พร้อม</h3>
            <label>
              ทีม
              <select name="teamId" required defaultValue="">
                <option value="" disabled>
                  เลือกทีม
                </option>
                {model.teams.map((v) => (
                  <option key={v.id} value={v.id} disabled={v.busy}>
                    {v.name} • {v.busy ? "มีงานอยู่" : "พร้อม"}
                  </option>
                ))}
              </select>
            </label>
            <label>
              รถ
              <select name="vehicleId" required defaultValue="">
                <option value="" disabled>
                  เลือกรถ
                </option>
                {model.vehicles.map((v) => (
                  <option key={v.id} value={v.id} disabled={v.busy}>
                    {v.name} • {v.busy ? "มีงานอยู่" : "พร้อม"}
                  </option>
                ))}
              </select>
            </label>
            <button className="ops-primary">มอบหมายทีมและรถ</button>
          </form>
        )}
        {item.allowedStatuses.length > 0 && (
          <form
            key={`${item.id}-${item.status}`}
            className="disaster-assignment"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              transition(item.id, f.get("status"), f.get("note"));
            }}
          >
            <h3>บันทึกความคืบหน้า</h3>
            <label>
              สถานะถัดไป
              <select name="status" required>
                {item.allowedStatuses.map((s) => (
                  <option key={s} value={s}>
                    {INCIDENT_STATUS[s]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              รายละเอียด
              <textarea
                name="note"
                required
                placeholder="สิ่งที่ตรวจสอบหรือผลการปฏิบัติงาน"
              />
            </label>
            <button className="ops-primary">บันทึกสถานะ</button>
          </form>
        )}
        <section className="disaster-history">
          <h3>ประวัติการดำเนินงาน</h3>
          <ol>
            {[...item.history].reverse().map((h, i) => (
              <li key={`${h.at}-${i}`}>
                <strong>{INCIDENT_STATUS[h.status]}</strong>
                <small>{time(h.at)}</small>
                <p>{h.note}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </aside>
  );
}
function CreateIncident({ onCreate, onCancel }) {
  return (
    <section className="ops-panel">
      <div className="ops-panel-heading">
        <h2>รับแจ้งเหตุใหม่</h2>
        <button onClick={onCancel}>กลับไปคิวเหตุ</button>
      </div>
      <form
        className="ops-form ops-panel-body"
        onSubmit={(e) => {
          e.preventDefault();
          onCreate(Object.fromEntries(new FormData(e.currentTarget)));
        }}
      >
        <label>
          ประเภท/ชื่อเหตุ
          <input
            name="title"
            required
            maxLength="120"
            placeholder="เช่น น้ำท่วมขัง"
          />
        </label>
        <label>
          ความเร่งด่วน
          <select name="severity" defaultValue="MEDIUM">
            <option value="HIGH">สูง</option>
            <option value="MEDIUM">ปานกลาง</option>
            <option value="LOW">ต่ำ</option>
          </select>
        </label>
        <label className="full">
          สถานที่
          <input
            name="location"
            required
            maxLength="250"
            placeholder="หมู่บ้าน ถนน หรือจุดสังเกต"
          />
        </label>
        <label>
          ละติจูด
          <input
            name="lat"
            type="number"
            min="-90"
            max="90"
            step="any"
            required
            placeholder="เช่น 16.757"
          />
        </label>
        <label>
          ลองจิจูด
          <input
            name="lng"
            type="number"
            min="-180"
            max="180"
            step="any"
            required
            placeholder="เช่น 100.207"
          />
        </label>
        <label className="full">
          รายละเอียดเหตุ
          <textarea name="description" required maxLength="2000" />
        </label>
        <p className="ops-notice full">
          รุ่นทดลองนี้ไม่ส่งเรื่องให้หน่วยฉุกเฉิน ไม่ส่งข้อความ LINE
          และไม่มีข้อมูล GPS รถจริง
          กรุณาใช้ช่องทางฉุกเฉินของหน่วยงานสำหรับเหตุจริง
        </p>
        <div className="full">
          <button className="ops-primary">บันทึกเหตุใหม่</button>
        </div>
      </form>
    </section>
  );
}
export default function DisasterOperationsApp({ system, operations }) {
  const [active, A] = useState("incidents"),
    [model, M] = useState(null),
    [selected, setSelected] = useState("DIS-026"),
    [query, Q] = useState(""),
    [status, Status] = useState("all"),
    [create, C] = useState(false),
    [error, E] = useState(""),
    [success, S] = useState("");
  const detailRef = useRef(null);
  const [selectionRequest, requestSelection] = useState(0);
  const Select = (id) => { setSelected(id); requestSelection((value) => value + 1); };
  useEffect(() => {
    if (!selectionRequest || !window.matchMedia("(max-width: 1280px)").matches || !detailRef.current) return;
    detailRef.current.scrollIntoView({ block: "start", behavior: "instant" });
    detailRef.current.focus({ preventScroll: true });
  }, [selectionRequest]);
  useEffect(() => {
    try {
      M(operations.load());
    } catch (e) {
      E(e.message);
    }
  }, [operations]);
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
    A(id);
    C(false);
    E("");
    S("");
  };
  const filtered =
    model?.incidents.filter(
      (i) =>
        (status === "all" || i.status === status) &&
        `${i.id} ${i.title} ${i.location}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    ) || [];
  const item = model?.incidents.find((i) => i.id === selected);
  const detail = model && (
    <Detail
      panelRef={detailRef}
      key={item?.id}
      item={item}
      model={model}
      assign={(id, c) =>
        run(() => operations.assign(id, c), "มอบหมายทีมและรถแล้ว")
      }
      transition={(id, s, n) =>
        run(() => operations.transition(id, s, n), "บันทึกสถานะและประวัติแล้ว")
      }
    />
  );
  return (
    <OperationsShell
      title="ระบบป้องกันและบรรเทาสาธารณภัย"
      tone="disaster"
      navigation={NAV}
      active={active}
      onNavigate={nav}
      systemController={system}
    >
      <PageHeading
        title={
          {
            incidents: "คิวรับแจ้งเหตุ",
            map: "แผนที่เหตุสาธารณภัย",
            board: "ติดตามเหตุระหว่างดำเนินการ",
            resources: "ความพร้อมของทีมและรถ",
            reports: "รายงานเหตุและผลการปฏิบัติงาน",
          }[active]
        }
        description="ตรวจข้อมูลก่อนมอบหมาย ติดตามสถานะ และเก็บประวัติการดำเนินงาน"
      >
        <button
          className="ops-primary"
          onClick={() => {
            C(true);
            A("incidents");
          }}
        >
          รับแจ้งเหตุใหม่
        </button>
      </PageHeading>
      <p className="ops-notice disaster-warning">
        พื้นที่ทดลองขั้นตอนงาน ไม่ใช่ช่องทางรับเหตุฉุกเฉินจริง
        และไม่ใช่ตำแหน่งรถแบบ GPS
      </p>
      <Message error={error} success={success} />
      {model &&
        (create ? (
          <CreateIncident
            onCancel={() => C(false)}
            onCreate={(c) => {
              if (
                run(
                  () => operations.create(c),
                  "บันทึกเหตุใหม่แล้ว กรุณาตรวจข้อมูลก่อนมอบหมาย",
                )
              ) {
                C(false);
                Select(operations.view().incidents[0].id);
              }
            }}
          />
        ) : (
          <>
            {["incidents", "map", "reports"].includes(active) && (
              <div className="ops-toolbar">
                <input
                  type="search"
                  aria-label="ค้นหาเหตุ"
                  placeholder="ค้นหาเลขที่เหตุ สถานที่ หรือประเภทเหตุ"
                  value={query}
                  onChange={(e) => Q(e.target.value)}
                />
                <label>
                  สถานะ
                  <select
                    value={status}
                    onChange={(e) => Status(e.target.value)}
                  >
                    <option value="all">ทุกสถานะ</option>
                    {Object.entries(INCIDENT_STATUS).map(([id, label]) => (
                      <option key={id} value={id}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}
            {active === "incidents" && (
              <div className="disaster-workspace">
                <section className="ops-panel">
                  <div className="ops-panel-heading">
                    <h2>เหตุทั้งหมด ({filtered.length})</h2>
                    <span>
                      {model.teams.filter((t) => !t.busy).length} ทีมพร้อม
                    </span>
                  </div>
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>เลขที่ / เหตุ</th>
                          <th>ความเร่งด่วน</th>
                          <th>สถานะ</th>
                          <th>รับแจ้ง</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((i) => (
                          <tr
                            key={i.id}
                            className={selected === i.id ? "is-selected" : ""}
                          >
                            <td>
                              <button
                                className="disaster-row-button"
                                aria-label={`ดูเหตุ ${i.id}`}
                                onClick={() => Select(i.id)}
                              >
                                <strong>
                                  {i.id} • {i.title}
                                </strong>
                                <small>{i.location}</small>
                              </button>
                            </td>
                            <td>
                              <span
                                className={`ops-badge ${i.severity === "HIGH" ? "danger" : "warning"}`}
                              >
                                {SEVERITY[i.severity]}
                              </span>
                            </td>
                            <td>
                              <span className="ops-badge">{i.statusLabel}</span>
                            </td>
                            <td>
                              <small>{time(i.createdAt)}</small>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {!filtered.length && (
                      <div className="ops-empty">ไม่พบเหตุที่ตรงกับคำค้น</div>
                    )}
                  </div>
                </section>
                {detail}
              </div>
            )}
            {active === "map" && (
              <div className="disaster-workspace">
                <section className="ops-panel">
                  <div className="ops-panel-heading">
                    <h2>พิกัดเหตุที่บันทึก ({filtered.length})</h2>
                  </div>
                  <IncidentMap
                    incidents={filtered}
                    selectedId={selected}
                    onSelect={Select}
                  />
                  <p className="ops-panel-body ops-subtle">
                    คลิกจุดเพื่อดูเหตุ • แผนที่พื้นหลังต้องใช้อินเทอร์เน็ต •
                    ไม่มีการจำลองตำแหน่งรถเป็น GPS จริง
                  </p>
                </section>
                {detail}
              </div>
            )}
            {active === "board" && (
              <div className="ops-stack">
                <div className="disaster-board">
                  {[
                    ["รอตรวจและมอบหมาย", ["NEW", "VERIFIED"]],
                    ["กำลังปฏิบัติงาน", ["ASSIGNED", "EN_ROUTE", "ON_SITE"]],
                    ["รอตรวจผล / สิ้นสุด", ["RESOLVED", "CLOSED", "CANCELLED"]],
                  ].map(([label, states]) => (
                    <section key={label}>
                      <h2>{label}</h2>
                      {model.incidents
                        .filter((i) => states.includes(i.status))
                        .map((i) => (
                          <button
                            key={i.id}
                            onClick={() => {
                              Select(i.id);
                              A("incidents");
                            }}
                          >
                            <strong>
                              {i.id} • {i.title}
                            </strong>
                            <span>{i.location}</span>
                            <span className="ops-badge">{i.statusLabel}</span>
                            <small>{i.teamName || "ยังไม่มอบหมายทีม"}</small>
                          </button>
                        ))}
                    </section>
                  ))}
                </div>
              </div>
            )}
            {active === "resources" && (
              <div className="disaster-resource-grid">
                {[
                  ["ทีมปฏิบัติงาน", model.teams, "teamId"],
                  ["รถกู้ภัย", model.vehicles, "vehicleId"],
                ].map(([label, items, key]) => (
                  <section className="ops-panel" key={key}>
                    <div className="ops-panel-heading">
                      <h2>{label}</h2>
                    </div>
                    <table>
                      <thead>
                        <tr>
                          <th>รายการ</th>
                          <th>ความพร้อม</th>
                          <th>งาน</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((v) => (
                          <tr key={v.id}>
                            <td>{v.name}</td>
                            <td>
                              <span
                                className={`ops-badge ${v.busy ? "warning" : "success"}`}
                              >
                                {v.busy ? "มีงานอยู่" : "พร้อม"}
                              </span>
                            </td>
                            <td>
                              {model.incidents
                                .filter(
                                  (i) =>
                                    i[key] === v.id &&
                                    [
                                      "ASSIGNED",
                                      "EN_ROUTE",
                                      "ON_SITE",
                                    ].includes(i.status),
                                )
                                .map((i) => (
                                  <button
                                    key={i.id}
                                    onClick={() => {
                                      Select(i.id);
                                      A("incidents");
                                    }}
                                  >
                                    {i.id}
                                  </button>
                                ))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </section>
                ))}
              </div>
            )}
            {active === "reports" && (
              <section className="ops-panel">
                <div className="ops-panel-heading">
                  <h2>ผลการดำเนินงาน ({filtered.length} เหตุ)</h2>
                </div>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>เลขที่เหตุ</th>
                        <th>ประเภทเหตุ</th>
                        <th>สถานะ</th>
                        <th>ทีม / รถ</th>
                        <th>บันทึกล่าสุด</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((i) => (
                        <tr key={i.id}>
                          <td>
                            <button
                              onClick={() => {
                                Select(i.id);
                                A("incidents");
                              }}
                            >
                              {i.id}
                            </button>
                          </td>
                          <td>{i.title}</td>
                          <td>{i.statusLabel}</td>
                          <td>
                            {i.teamName || "—"}
                            <small>{i.vehicleName}</small>
                          </td>
                          <td>
                            {i.history.at(-1)?.note}
                            <small>{time(i.history.at(-1)?.at)}</small>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        ))}
    </OperationsShell>
  );
}
