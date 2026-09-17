import { useCallback, useEffect, useMemo, useState } from "react";
import WaterTreatmentProcessDiagram from "./presentation/components/WaterTreatmentProcessDiagram.jsx";
import "./waterworks-dashboard.css";

const STATUS_ICONS = Object.freeze({ normal: "✓", watch: "!", critical: "×", offline: "–" });

function formatUpdatedAt(value) {
  if (!value) return "–";
  return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "medium" }).format(new Date(value));
}

function MetricValue({ metric }) {
  if (!metric) return <strong>–</strong>;
  return <strong>{metric.value}<small>{metric.unit}</small></strong>;
}

function KpiCard({ label, metric, detail, tone = "blue" }) {
  return <article className={`water-kpi water-kpi--${tone}`}><span>{label}</span><MetricValue metric={metric}/><small>{detail}</small></article>;
}

function StatusBadge({ point }) {
  return <span className={`water-status water-status--${point.status}`}><b>{STATUS_ICONS[point.status]}</b>{point.statusLabel}</span>;
}

function PointDetail({ point }) {
  if (!point) return null;
  return <aside className="water-detail" aria-live="polite"><header><div><span>จุดตรวจวัด {String(point.sequence).padStart(2, "0")}</span><h2>{point.name}</h2></div><StatusBadge point={point}/></header><p>{point.description}</p><section className="water-detail__metrics" aria-label="ค่าตรวจวัด">{point.metrics.map((metric) => <article key={metric.id}><span>{metric.label}</span><MetricValue metric={metric}/></article>)}</section><section className="water-detail__equipment"><h3>สถานะอุปกรณ์</h3>{point.equipment.map((item) => <div key={item.label}><span>{item.label}</span><b><i/> {item.state}</b></div>)}</section><footer>ข้อมูลล่าสุด {formatUpdatedAt(point.updatedAt)}</footer></aside>;
}

function PointCard({ point, selected, onSelect }) {
  return <button className={`water-point-card${selected ? " is-selected" : ""}`} type="button" onClick={() => onSelect(point.id)}><span className="water-point-card__number">{String(point.sequence).padStart(2, "0")}</span><span className="water-point-card__copy"><strong>{point.shortName}</strong><small>{point.metrics[0]?.label}</small></span><MetricValue metric={point.metrics[0]}/><StatusBadge point={point}/></button>;
}

export default function WaterworksManagementApp({ controller }) {
  if (!controller) throw new TypeError("WaterworksManagementApp requires an application controller");
  const session = useMemo(() => controller.getSession(), [controller]);
  const [dashboard, setDashboard] = useState(null);
  const [selectedPointId, setSelectedPointId] = useState("water-tower");
  const [showAlertsOnly, setShowAlertsOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    try { setError(""); setDashboard(await controller.loadDashboard()); }
    catch (loadError) { setError(loadError?.message || "ไม่สามารถโหลดข้อมูลระบบประปาได้"); }
    finally { setLoading(false); }
  }, [controller]);

  useEffect(() => {
    if (!session.authenticated) { controller.redirectToLogin(); return undefined; }
    loadDashboard();
    const intervalId = window.setInterval(loadDashboard, 30000);
    return () => window.clearInterval(intervalId);
  }, [controller, loadDashboard, session.authenticated]);
  useEffect(() => controller.subscribeToExpiration(() => controller.logout()), [controller]);

  if (!session.authenticated || loading) return <main className="water-loading"><span/><p>กำลังเชื่อมต่อศูนย์ควบคุมระบบประปา…</p></main>;
  if (error && !dashboard) return <main className="water-loading water-loading--error"><b>!</b><h1>ไม่สามารถแสดงข้อมูลได้</h1><p>{error}</p><button onClick={loadDashboard}>ลองอีกครั้ง</button></main>;

  const selectedPoint = dashboard.points.find((point) => point.id === selectedPointId) || dashboard.points[0];
  const visiblePoints = showAlertsOnly ? dashboard.points.filter((point) => point.status !== "normal") : dashboard.points;

  return <div className="water-app"><header className="water-topbar"><div className="water-brand"><span>ทพ</span><div><strong>Smart Tha Pho</strong><small>เทศบาลเมืองท่าโพธิ์</small></div></div><div className="water-user"><span aria-hidden="true">{String(session.user?.name || "ผู้").slice(0, 2)}</span><div><strong>{session.user?.name || "เจ้าหน้าที่ระบบประปา"}</strong><small>ศูนย์ควบคุมระบบประปา</small></div><button type="button" onClick={() => controller.switchSystem()}>เปลี่ยนระบบ</button><button type="button" onClick={() => controller.logout()}>ออกจากระบบ</button></div></header><div className="water-shell"><aside className="water-sidebar"><div className="water-system-mark"><span>ปร</span><div><small>WATERWORKS</small><strong>ระบบบริหารจัดการ<br/>การประปา</strong></div></div><nav aria-label="เมนูระบบประปา"><button className="is-active"><i>▦</i> ภาพรวมระบบผลิตน้ำ</button><button><i>◉</i> จุดตรวจวัดและอุปกรณ์</button><button><i>⌁</i> ระบบท่อและแรงดัน</button><button><i>≋</i> คุณภาพน้ำ</button><button><i>!</i> เหตุผิดปกติ</button><button><i>☷</i> รายงานการเดินระบบ</button></nav><div className="water-sidebar__connection"><i/><div><strong>ระบบมอนิเตอร์ทำงาน</strong><small>อัปเดตทุก 30 วินาที</small></div></div></aside><main className="water-content"><section className="water-page-head"><div><p>WATER CONTROL CENTER</p><h1>ภาพรวมระบบผลิตและจ่ายน้ำประปา</h1><span>ติดตามกระบวนการผลิต คุณภาพน้ำ อุปกรณ์ และแรงดันจ่ายจากจุดเดียว</span></div><div className="water-page-head__tools"><span className="water-live"><i/> กำลังรับข้อมูล</span><button type="button" onClick={loadDashboard}>↻ รีเฟรช</button></div></section><section className="water-mode-notice"><div><strong>โหมดสาธิตข้อมูลตรวจวัด</strong><span>โครงสร้างรองรับการเชื่อมต่อ PLC, IoT Gateway หรือ SCADA API โดยเปลี่ยนเฉพาะตัวรับข้อมูล</span></div><small>ล่าสุด {formatUpdatedAt(dashboard.updatedAt)}</small></section><section className="water-kpis"><KpiCard label="อัตราการผลิตน้ำ" metric={dashboard.summary.productionFlow} detail="ปริมาณน้ำเข้าสู่ระบบ"/><KpiCard label="ระดับน้ำหอถังสูง" metric={dashboard.summary.towerLevel} detail="พร้อมรักษาแรงดันจ่าย" tone="cyan"/><KpiCard label="แรงดันระบบจ่าย" metric={dashboard.summary.distributionPressure} detail="ค่าที่จุดวัดหลัก" tone="indigo"/><KpiCard label="คลอรีนคงเหลือปลายสาย" metric={dashboard.summary.residualChlorine} detail="ตรวจคุณภาพในพื้นที่บริการ" tone="teal"/><article className={`water-kpi water-kpi--${dashboard.summary.alertCount ? "warning" : "green"}`}><span>สถานะระบบ</span><strong>{dashboard.summary.normalCount}<small>/ {dashboard.summary.totalPoints} จุดปกติ</small></strong><small>{dashboard.summary.alertCount ? `${dashboard.summary.alertCount} จุดควรตรวจสอบ` : "ทุกจุดทำงานปกติ"}</small></article></section><section className="water-monitor-panel"><header><div><p>PROCESS FLOW MONITORING</p><h2>ผังการผลิตและจ่ายน้ำประปา</h2><span>เลือกอุปกรณ์หรือจุดตรวจวัดบนผังเพื่อดูรายละเอียด</span></div><div className="water-legend"><span><i className="normal"/>ปกติ</span><span><i className="watch"/>เฝ้าระวัง</span><span><b className="flow"/>ทิศทางการไหล</span></div></header><div className="water-monitor-panel__body"><div className="water-diagram-wrap"><WaterTreatmentProcessDiagram points={dashboard.points} selectedPointId={selectedPoint.id} onSelect={setSelectedPointId}/></div><PointDetail point={selectedPoint}/></div></section><section className="water-points-panel"><header><div><p>MONITORING POINTS</p><h2>สถานะจุดตรวจวัดทั้งหมด</h2></div><div className="water-segmented"><button className={!showAlertsOnly ? "is-active" : ""} onClick={() => setShowAlertsOnly(false)}>ทั้งหมด <b>{dashboard.points.length}</b></button><button className={showAlertsOnly ? "is-active" : ""} onClick={() => setShowAlertsOnly(true)}>ต้องตรวจสอบ <b>{dashboard.summary.alertCount}</b></button></div></header><div className="water-points-grid">{visiblePoints.map((point) => <PointCard key={point.id} point={point} selected={point.id === selectedPoint.id} onSelect={setSelectedPointId}/>)}</div></section></main></div></div>;
}
