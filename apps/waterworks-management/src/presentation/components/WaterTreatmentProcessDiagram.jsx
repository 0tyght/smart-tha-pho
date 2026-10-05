import { useMemo } from "react";

const STATUS_LABELS = Object.freeze({ normal: "ปกติ", watch: "เฝ้าระวัง", critical: "ผิดปกติ", offline: "ไม่เชื่อมต่อ" });
const STAGES = Object.freeze([
  { id: "raw-water", short: "รับน้ำดิบ" }, { id: "chemical", short: "จ่ายสารเคมี" },
  { id: "clarifier", short: "ตกตะกอน" }, { id: "filter", short: "กรองน้ำ" },
  { id: "clear-well", short: "ถังน้ำใส" }, { id: "high-lift", short: "สูบแรงสูง" },
  { id: "water-tower", short: "หอถังสูง" }, { id: "distribution", short: "ระบบจ่ายน้ำ" },
]);

function clamp(value, minimum, maximum) { return Math.min(maximum, Math.max(minimum, Number(value) || 0)); }
function statusClass(point) { return point?.status || "offline"; }
function firstMetric(point) { return point?.metrics?.[0] || { label: "ไม่มีข้อมูล", value: "–", unit: "" }; }
function keyboardSelect(event, select) {
  if (event.key === "Enter" || event.key === " ") { event.preventDefault(); select(); }
}

function SelectableUnit({ id, point, selectedPointId, onSelect, children }) {
  const select = () => onSelect(id);
  const status = statusClass(point);
  return <g className={`water-plant-unit water-plant-unit--${status}${selectedPointId === id ? " is-selected" : ""}`} role="button" tabIndex="0" aria-label={`${point?.name || id} สถานะ${STATUS_LABELS[status]}`} onClick={select} onKeyDown={(event) => keyboardSelect(event, select)}>{children}</g>;
}

function StatusPin({ x, y, point }) {
  const status = statusClass(point);
  return <g className={`plant-status-pin plant-status-pin--${status}`} transform={`translate(${x} ${y})`} aria-hidden="true"><circle r="12"/><text textAnchor="middle" dominantBaseline="central">{String(point?.sequence || "–").padStart(2, "0")}</text></g>;
}

function MetricTag({ x, y, point }) {
  const metric = firstMetric(point);
  return <g className="plant-metric-tag" transform={`translate(${x} ${y})`} aria-hidden="true"><rect x="-59" width="118" height="34" rx="8"/><text x="-50" y="13">{metric.label}</text><text x="-50" y="27" className="plant-metric-tag__value">{metric.value} {metric.unit}</text></g>;
}

function FlowPipe({ d, variant = "treated" }) {
  return <g className={`plant-flow plant-flow--${variant}`} aria-hidden="true"><path className="plant-flow__casing" d={d}/><path className="plant-flow__water" d={d} markerEnd="url(#plantFlowArrow)"/></g>;
}

function StageButton({ stage, point, selected, onSelect }) {
  const metric = firstMetric(point);
  const status = statusClass(point);
  return <button type="button" className={`water-stage-button water-stage-button--${status}${selected ? " is-selected" : ""}`} onClick={() => onSelect(stage.id)} aria-pressed={selected}>
    <span className="water-stage-button__number">{String(point?.sequence || "–").padStart(2, "0")}</span>
    <span className="water-stage-button__copy"><strong>{stage.short}</strong><small>{metric.label}</small></span>
    <span className="water-stage-button__value">{metric.value}<small>{metric.unit}</small></span>
    <i aria-label={STATUS_LABELS[status]} title={STATUS_LABELS[status]}/>
  </button>;
}

export default function WaterTreatmentProcessDiagram({ points, selectedPointId, onSelect }) {
  const byId = useMemo(() => Object.fromEntries(points.map((point) => [point.id, point])), [points]);
  const towerLevel = clamp(byId["water-tower"]?.metrics.find((metric) => metric.id === "level")?.value, 0, 100);
  const clearWellLevel = clamp(byId["clear-well"]?.metrics.find((metric) => metric.id === "level")?.value, 0, 100);
  const towerFillTop = 129 - (towerLevel * 0.48);
  const clearWellTop = 323 - (clearWellLevel * 0.55);

  return <div className="water-process-visual">
    <svg className="water-process-map" viewBox="0 0 1240 430" role="img" aria-labelledby="water-process-title water-process-desc">
      <title id="water-process-title">ผังมอนิเตอร์กระบวนการผลิตและจ่ายน้ำประปา</title>
      <desc id="water-process-desc">แสดงทิศทางน้ำจากแหล่งน้ำดิบ ผ่านระบบจ่ายสารเคมี ถังตกตะกอน ถังกรอง ถังน้ำใส สถานีสูบน้ำแรงสูง หอถังสูง และระบบจ่ายน้ำ</desc>
      <defs>
        <pattern id="plantGrid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="#dce9ec" strokeWidth="1"/></pattern>
        <linearGradient id="plantWater" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#45c7ee"/><stop offset="1" stopColor="#118bbd"/></linearGradient>
        <linearGradient id="plantCleanWater" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#49d5d0"/><stop offset="1" stopColor="#19a9be"/></linearGradient>
        <linearGradient id="plantSteel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f8fbfc"/><stop offset=".52" stopColor="#cbd8dc"/><stop offset="1" stopColor="#879da6"/></linearGradient>
        <filter id="plantShadow" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#163e4c" floodOpacity=".14"/></filter>
        <marker id="plantFlowArrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto" markerUnits="strokeWidth"><path d="M0 0L9 5L0 10Z" fill="#20afcf"/></marker>
        <clipPath id="towerTankClip"><path d="M889 65Q889 43 913 38H985Q1009 43 1009 65L1004 107Q996 130 976 135H922Q902 130 894 107Z"/></clipPath>
        <clipPath id="clearWellClip"><rect x="675" y="251" width="104" height="79" rx="4"/></clipPath>
      </defs>

      <rect width="1240" height="430" rx="18" fill="#f7fbfc"/><rect width="1240" height="430" rx="18" fill="url(#plantGrid)" opacity=".56"/>
      <g className="plant-zone-labels" aria-hidden="true">
        <g transform="translate(18 16)"><rect width="165" height="28" rx="7"/><text x="82.5" y="19" textAnchor="middle">รับน้ำดิบ</text></g>
        <g transform="translate(195 16)"><rect width="440" height="28" rx="7"/><text x="220" y="19" textAnchor="middle">ปรับปรุงคุณภาพน้ำ</text></g>
        <g transform="translate(647 16)"><rect width="375" height="28" rx="7"/><text x="187.5" y="19" textAnchor="middle">สูบส่งและสำรองน้ำ</text></g>
        <g transform="translate(1034 16)"><rect width="188" height="28" rx="7"/><text x="94" y="19" textAnchor="middle">ระบบจ่ายน้ำ</text></g>
      </g>
      <path className="plant-ground" d="M16 351H1224V414H16Z"/><path className="plant-baseline" d="M16 351H1224"/>

      <FlowPipe d="M135 294H215V274H251" variant="raw"/><FlowPipe d="M322 274H356" variant="raw"/><FlowPipe d="M486 252H520"/><FlowPipe d="M638 276H682"/><FlowPipe d="M780 310H814"/><FlowPipe d="M878 286H894V116H907"/><FlowPipe d="M996 116H1024V294H1213"/>

      <SelectableUnit id="raw-water" point={byId["raw-water"]} selectedPointId={selectedPointId} onSelect={onSelect}>
        <g filter="url(#plantShadow)"><path d="M18 285C48 267 78 278 104 288C127 297 149 292 171 278V350H18Z" fill="url(#plantWater)"/><path d="M28 300C59 286 80 301 107 308C129 314 149 306 163 298" fill="none" stroke="#d9f6ff" strokeWidth="3"/><rect x="84" y="222" width="69" height="64" rx="5" className="plant-building"/><path d="M75 222L118 188L162 222Z" className="plant-roof"/><circle cx="120" cy="255" r="15" className="plant-pump"/><path d="M110 255H130M120 245V265" className="plant-pump-mark"/><path d="M120 270V294" className="plant-pipe-dark"/></g>
        <text x="96" y="177" textAnchor="middle" className="plant-equipment-title">แหล่งน้ำดิบ</text><text x="118" y="211" textAnchor="middle" className="plant-equipment-subtitle">สถานีสูบแรงต่ำ</text><StatusPin x="154" y="203" point={byId["raw-water"]}/><MetricTag x="95" y="363" point={byId["raw-water"]}/>
      </SelectableUnit>

      <SelectableUnit id="chemical" point={byId.chemical} selectedPointId={selectedPointId} onSelect={onSelect}>
        <g filter="url(#plantShadow)"><rect x="215" y="198" width="107" height="77" rx="7" className="plant-building"/><rect x="228" y="222" width="25" height="42" rx="5" className="chemical-tank chemical-tank--pink"/><rect x="264" y="210" width="25" height="54" rx="5" className="chemical-tank chemical-tank--amber"/><path d="M240 222V203M276 210V191M240 264V286M276 264V286" className="plant-thin-pipe"/><rect x="294" y="226" width="18" height="38" rx="3" className="plant-control-box"/></g>
        <text x="268" y="177" textAnchor="middle" className="plant-equipment-title">ระบบจ่ายสารเคมี</text><StatusPin x="313" y="190" point={byId.chemical}/><MetricTag x="268" y="304" point={byId.chemical}/>
      </SelectableUnit>

      <SelectableUnit id="clarifier" point={byId.clarifier} selectedPointId={selectedPointId} onSelect={onSelect}>
        <g filter="url(#plantShadow)"><path d="M356 218H486V291Q486 321 421 321Q356 321 356 291Z" className="clarifier-shell"/><path d="M365 238H477V286Q477 307 421 307Q365 307 365 286Z" fill="#9fdef0"/><path d="M421 218V286M377 286H465" className="plant-thin-pipe"/><circle cx="421" cy="253" r="7" className="plant-pump"/><path d="M371 286L386 297L401 286L416 297L431 286L446 297L461 286L474 297" fill="none" stroke="#a3815e" strokeWidth="4" opacity=".65"/></g>
        <text x="421" y="185" textAnchor="middle" className="plant-equipment-title">ถังตกตะกอน</text><text x="421" y="204" textAnchor="middle" className="plant-equipment-subtitle">รวมตะกอนและแยกตะกอน</text><StatusPin x="473" y="202" point={byId.clarifier}/><MetricTag x="421" y="335" point={byId.clarifier}/>
      </SelectableUnit>

      <SelectableUnit id="filter" point={byId.filter} selectedPointId={selectedPointId} onSelect={onSelect}>
        <g filter="url(#plantShadow)"><rect x="520" y="205" width="118" height="118" rx="7" className="filter-shell"/>{[0, 1].map((index) => <g key={index} transform={`translate(${530 + index * 50} 221)`}><rect width="43" height="87" rx="3" fill="#a8e2f2"/><path d="M0 43H43" stroke="#dcc69c" strokeWidth="15"/><path d="M0 67H43" stroke="#7a746d" strokeWidth="14"/><path d="M21.5 0V20" stroke="#fff" strokeWidth="3"/></g>)}</g>
        <text x="579" y="174" textAnchor="middle" className="plant-equipment-title">ถังกรองน้ำ</text><text x="579" y="192" textAnchor="middle" className="plant-equipment-subtitle">กรองเร็วและล้างย้อน</text><StatusPin x="628" y="190" point={byId.filter}/><MetricTag x="579" y="336" point={byId.filter}/>
      </SelectableUnit>

      <SelectableUnit id="clear-well" point={byId["clear-well"]} selectedPointId={selectedPointId} onSelect={onSelect}>
        <g filter="url(#plantShadow)"><path d="M669 251H785L773 230H682Z" className="plant-roof plant-roof--flat"/><rect x="675" y="251" width="104" height="79" rx="4" className="clear-well-shell"/><rect x="675" y={clearWellTop} width="104" height={330 - clearWellTop} fill="url(#plantCleanWater)" clipPath="url(#clearWellClip)"/><path d="M693 247V222M761 247V222" className="plant-thin-pipe"/></g>
        <text x="727" y="188" textAnchor="middle" className="plant-equipment-title">ถังน้ำใส</text><text x="727" y="207" textAnchor="middle" className="plant-equipment-subtitle">ฆ่าเชื้อและสำรองน้ำ</text><StatusPin x="773" y="218" point={byId["clear-well"]}/><MetricTag x="727" y="342" point={byId["clear-well"]}/>
      </SelectableUnit>

      <SelectableUnit id="high-lift" point={byId["high-lift"]} selectedPointId={selectedPointId} onSelect={onSelect}>
        <g filter="url(#plantShadow)"><path d="M804 242L843 211L884 242Z" className="pump-house-roof"/><rect x="811" y="242" width="67" height="61" rx="4" className="plant-building"/>{[831, 858].map((x) => <g key={x}><circle cx={x} cy="274" r="12" className="plant-pump"/><path d={`M${x - 7} 274H${x + 7}M${x} 267V281`} className="plant-pump-mark"/></g>)}<path d="M795 286H811M878 286H894" className="plant-pipe-dark"/></g>
        <text x="844" y="183" textAnchor="middle" className="plant-equipment-title">สถานีสูบน้ำแรงสูง</text><StatusPin x="878" y="207" point={byId["high-lift"]}/><MetricTag x="844" y="317" point={byId["high-lift"]}/>
      </SelectableUnit>

      <SelectableUnit id="water-tower" point={byId["water-tower"]} selectedPointId={selectedPointId} onSelect={onSelect}>
        <g filter="url(#plantShadow)"><path d="M889 65Q889 43 913 38H985Q1009 43 1009 65L1004 107Q996 130 976 135H922Q902 130 894 107Z" fill="url(#plantSteel)" className="tower-tank"/><rect x="889" y={towerFillTop} width="120" height={135 - towerFillTop} fill="url(#plantWater)" opacity=".9" clipPath="url(#towerTankClip)"/><path d="M913 135L888 344M985 135L1010 344M932 135L921 344M966 135L977 344" className="tower-leg"/><path d="M901 207H997M894 270H1004M889 326H1009" className="tower-platform"/><path d="M908 160L992 270M990 160L902 270M899 207L1005 326M999 207L893 326" className="tower-brace"/><path d="M941 144V331M957 144V331" className="tower-ladder"/>{[166, 188, 210, 232, 254, 276, 298, 320].map((y) => <path key={y} d={`M941 ${y}H957`} className="tower-ladder"/>)}<path d="M949 38V20M938 20H960M1009 61L1024 54" className="tower-antenna"/><path d="M878 344H1020" className="tower-foundation"/><text x="949" y="79" textAnchor="middle" className="tower-label">หอถังสูง</text><text x="949" y="103" textAnchor="middle" className="tower-level">{towerLevel}%</text></g>
        <StatusPin x="1004" y="42" point={byId["water-tower"]}/><MetricTag x="949" y="361" point={byId["water-tower"]}/>
      </SelectableUnit>

      <SelectableUnit id="distribution" point={byId.distribution} selectedPointId={selectedPointId} onSelect={onSelect}>
        <g filter="url(#plantShadow)"><rect x="1042" y="257" width="64" height="45" rx="7" className="plant-building"/><circle cx="1074" cy="279" r="14" className="network-gauge"/><path d="M1074 279L1082 270M1064 287A15 15 0 0 1 1084 287" className="network-gauge-mark"/>{[1088, 1151, 1191].map((x, index) => <g key={x} transform={`translate(${x} ${207 - index * 7})`}><path d="M0 31L23 12L47 31Z" className={`network-roof network-roof--${index}`}/><rect x="5" y="31" width="37" height="47" rx="2" className="network-house"/><rect x="13" y="45" width="9" height="11" className="network-window"/><rect x="29" y="45" width="8" height="33" className="network-door"/></g>)}<path d="M1024 294H1214" className="distribution-main"/><path d="M1111 294V332M1174 294V332M1211 294V332" className="distribution-branch"/></g>
        <text x="1128" y="174" textAnchor="middle" className="plant-equipment-title">ระบบท่อจ่ายน้ำ</text><text x="1128" y="192" textAnchor="middle" className="plant-equipment-subtitle">มาตรวัดหลักและพื้นที่บริการ</text><StatusPin x="1201" y="188" point={byId.distribution}/><MetricTag x="1129" y="342" point={byId.distribution}/>
      </SelectableUnit>

      <g className="plant-flow-key" transform="translate(20 402)" aria-hidden="true"><path d="M0 0H34"/><text x="43" y="4">น้ำดิบ</text><path d="M99 0H133" className="treated"/><text x="142" y="4">น้ำผ่านการปรับปรุงคุณภาพ</text></g>
    </svg>
    <div className="water-stage-strip" aria-label="เลือกจุดตรวจวัดในกระบวนการ">{STAGES.map((stage) => <StageButton key={stage.id} stage={stage} point={byId[stage.id]} selected={selectedPointId === stage.id} onSelect={onSelect}/>)}</div>
  </div>;
}
