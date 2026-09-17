import { useMemo } from "react";

const STATUS_LABELS = Object.freeze({
  normal: "ปกติ",
  watch: "เฝ้าระวัง",
  critical: "ผิดปกติ",
  offline: "ไม่เชื่อมต่อ",
});

const PROCESS_STEPS = Object.freeze([
  { id: "raw-water", x: 18, width: 162, title: "01 น้ำดิบ", subtitle: "แหล่งน้ำและสูบแรงต่ำ" },
  { id: "chemical", x: 190, width: 162, title: "02 จ่ายสารเคมี", subtitle: "ปรับสภาพน้ำดิบ" },
  { id: "clarifier", x: 362, width: 162, title: "03 ตกตะกอน", subtitle: "รวมและแยกตะกอน" },
  { id: "filter", x: 534, width: 162, title: "04 กรองน้ำ", subtitle: "กรองอนุภาคละเอียด" },
  { id: "clear-well", x: 706, width: 162, title: "05 ถังน้ำใส", subtitle: "ฆ่าเชื้อและสำรองน้ำ" },
  { id: "high-lift", x: 878, width: 162, title: "06 สูบแรงสูง", subtitle: "ส่งน้ำเข้าหอถัง" },
  { id: "water-tower", x: 1050, width: 162, title: "07 หอถังสูง", subtitle: "เก็บน้ำและรักษาแรงดัน" },
  { id: "distribution", x: 1222, width: 192, title: "08 ระบบจ่ายน้ำ", subtitle: "ท่อเมนและพื้นที่บริการ" },
]);

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, Number(value) || 0));
}

function keyboardSelect(event, select) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    select();
  }
}

function Stage({ id, point, selectedPointId, onSelect, children, className = "" }) {
  const select = () => onSelect(id);
  const status = point?.status || "offline";
  const selected = selectedPointId === id;
  return (
    <g
      className={`water-plant-unit water-plant-unit--${status}${selected ? " is-selected" : ""} ${className}`}
      role="button"
      tabIndex="0"
      aria-label={`${point?.name || id} สถานะ${STATUS_LABELS[status]}`}
      onClick={select}
      onKeyDown={(event) => keyboardSelect(event, select)}
    >
      {children}
    </g>
  );
}

function MonitorBadge({ x, y, sequence, status = "offline" }) {
  return (
    <g className={`water-monitor-badge water-monitor-badge--${status}`} transform={`translate(${x} ${y})`} aria-hidden="true">
      <circle r="17" />
      <text textAnchor="middle" dominantBaseline="central">{String(sequence).padStart(2, "0")}</text>
    </g>
  );
}

function ProcessNode({ step, point, selectedPointId, onSelect }) {
  const select = () => onSelect(step.id);
  const status = point?.status || "offline";
  const selected = selectedPointId === step.id;
  return (
    <g
      className={`process-node process-node--${status}${selected ? " is-selected" : ""}`}
      role="button"
      tabIndex="0"
      aria-label={`${step.title} ${step.subtitle} สถานะ${STATUS_LABELS[status]}`}
      onClick={select}
      onKeyDown={(event) => keyboardSelect(event, select)}
    >
      <rect x={step.x} y="538" width={step.width} height="67" rx="15" />
      <foreignObject x={step.x + 11} y="547" width={step.width - 22} height="49" pointerEvents="none">
        <div className="process-node__content" xmlns="http://www.w3.org/1999/xhtml">
          <span className="process-node__status" aria-hidden="true" />
          <span className="process-node__copy"><strong>{step.title}</strong><small>{step.subtitle}</small></span>
        </div>
      </foreignObject>
    </g>
  );
}

function FlowPipe({ d, className = "" }) {
  return (
    <g aria-hidden="true">
      <path className={`flow-pipe flow-pipe--base ${className}`} d={d} />
      <path className={`flow-pipe flow-pipe--moving ${className}`} d={d} markerEnd="url(#flowArrow)" />
    </g>
  );
}

export default function WaterTreatmentProcessDiagram({ points, selectedPointId, onSelect }) {
  const byId = useMemo(() => Object.fromEntries(points.map((point) => [point.id, point])), [points]);
  const towerLevel = clamp(byId["water-tower"]?.metrics.find((metric) => metric.id === "level")?.value, 0, 100);
  const towerWaterTop = 176 - (towerLevel * 0.78);

  return (
    <svg className="water-process-map" viewBox="0 0 1440 620" role="img" aria-labelledby="water-process-title water-process-desc">
      <title id="water-process-title">ผังกระบวนการผลิต สูบส่ง และจ่ายน้ำประปา</title>
      <desc id="water-process-desc">น้ำไหลจากแหล่งน้ำดิบ ผ่านการจ่ายสารเคมี ตกตะกอน กรอง และฆ่าเชื้อในถังน้ำใส ก่อนสูบขึ้นหอถังสูงและจ่ายผ่านท่อเมนสู่พื้นที่บริการ</desc>
      <defs>
        <linearGradient id="diagramSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#eaf8ff" /><stop offset="1" stopColor="#f8fcfb" /></linearGradient>
        <linearGradient id="diagramWater" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#39bee9" /><stop offset="1" stopColor="#0c78ad" /></linearGradient>
        <linearGradient id="towerMetal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f4f7f8" /><stop offset=".5" stopColor="#c3ced3" /><stop offset="1" stopColor="#84959d" /></linearGradient>
        <linearGradient id="concrete" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f9fbfb" /><stop offset="1" stopColor="#d7e1e4" /></linearGradient>
        <filter id="equipmentShadow" x="-25%" y="-25%" width="150%" height="160%"><feDropShadow dx="0" dy="8" stdDeviation="7" floodColor="#123f53" floodOpacity=".14" /></filter>
        <marker id="flowArrow" markerWidth="11" markerHeight="11" refX="8" refY="5.5" orient="auto" markerUnits="strokeWidth"><path d="M0 0 L10 5.5 L0 11 Z" fill="#2fc0ec" /></marker>
        <clipPath id="towerBowlClip"><path d="M1057 94 Q1057 68 1087 59 H1173 Q1203 68 1203 94 L1196 145 Q1186 174 1158 181 H1102 Q1074 174 1064 145Z" /></clipPath>
      </defs>

      <rect width="1440" height="620" rx="22" fill="url(#diagramSky)" />
      <rect x="20" y="20" width="830" height="36" rx="18" className="water-process-zone" />
      <rect x="860" y="20" width="340" height="36" rx="18" className="water-process-zone" />
      <rect x="1210" y="20" width="210" height="36" rx="18" className="water-process-zone" />
      <text x="435" y="43" textAnchor="middle" className="water-process-zone__label">กระบวนการผลิตและควบคุมคุณภาพน้ำ</text>
      <text x="1030" y="43" textAnchor="middle" className="water-process-zone__label">ระบบสูบส่งและเก็บน้ำ</text>
      <text x="1315" y="43" textAnchor="middle" className="water-process-zone__label">ระบบจำหน่ายน้ำ</text>

      <path d="M0 438 C170 421 303 451 458 431 C650 407 809 454 972 427 C1131 401 1270 420 1440 397 V520 H0Z" fill="#e2f1dd" />
      <path d="M0 470 H1440" stroke="#bfd2c3" strokeWidth="2" />

      <FlowPipe d="M151 361 H270 V326 H354" />
      <FlowPipe d="M508 286 H548" />
      <FlowPipe d="M686 321 H724 V362 H758" />
      <FlowPipe d="M832 362 H888" />
      <FlowPipe d="M966 353 H1015 V148 H1062" className="flow-pipe--rising" />
      <FlowPipe d="M1198 148 H1224 V365 H1400" className="flow-pipe--distribution" />

      <Stage id="raw-water" point={byId["raw-water"]} selectedPointId={selectedPointId} onSelect={onSelect} className="water-source">
        <path d="M0 355 C35 330 74 340 108 353 C139 365 170 359 201 340 V477 H0Z" fill="#7ad5ef" />
        <path d="M0 379 C39 354 72 367 108 380 C142 392 171 382 201 367" fill="none" stroke="#fff" strokeWidth="4" opacity=".75" />
        <path d="M0 410 C43 389 79 401 113 412 C146 422 176 414 201 399" fill="none" stroke="#d7f5ff" strokeWidth="3" />
        <g filter="url(#equipmentShadow)">
          <rect x="91" y="285" width="87" height="73" rx="8" fill="#fff" stroke="#557886" strokeWidth="3" />
          <path d="M82 285 L132 246 L188 285Z" fill="#d9e6ea" stroke="#557886" strokeWidth="3" />
          <rect x="107" y="306" width="24" height="36" rx="3" fill="#bae8f6" stroke="#557886" strokeWidth="2" />
          <circle cx="153" cy="325" r="15" fill="#1388bb" /><path d="M153 314 V336 M142 325 H164" stroke="#fff" strokeWidth="3" />
          <path d="M153 340 V361" stroke="#355e70" strokeWidth="9" />
        </g>
        <text x="101" y="224" className="equipment-label">แหล่งน้ำดิบ</text>
        <text x="135" y="272" textAnchor="middle" className="equipment-subtitle">สถานีสูบน้ำแรงต่ำ</text>
        <MonitorBadge x="178" y="265" sequence={byId["raw-water"]?.sequence || 1} status={byId["raw-water"]?.status} />
      </Stage>

      <Stage id="chemical" point={byId.chemical} selectedPointId={selectedPointId} onSelect={onSelect} className="chemical-plant">
        <g filter="url(#equipmentShadow)">
          <rect x="212" y="219" width="126" height="104" rx="12" fill="#fff" stroke="#6f8993" strokeWidth="3" />
          <rect x="228" y="248" width="31" height="59" rx="7" fill="#f2b2cf" stroke="#a95077" strokeWidth="2" />
          <rect x="272" y="235" width="31" height="72" rx="7" fill="#f5d36a" stroke="#9d7b1e" strokeWidth="2" />
          <path d="M243 248 V226 M287 235 V214" stroke="#54717c" strokeWidth="3" />
          <path d="M244 307 V337 M287 307 V337" stroke="#875271" strokeWidth="4" />
          <rect x="263" y="313" width="50" height="48" rx="5" fill="#b6e9f7" stroke="#3a7f9c" strokeWidth="3" />
          <path d="M271 326 C282 315 294 338 305 326 M271 342 C282 331 294 354 305 342" fill="none" stroke="#fff" strokeWidth="3" />
        </g>
        <text x="275" y="197" textAnchor="middle" className="equipment-label">ระบบจ่ายสารเคมี</text>
        <text x="275" y="375" textAnchor="middle" className="equipment-subtitle">จุดผสมเร็ว</text>
        <MonitorBadge x="330" y="208" sequence={byId.chemical?.sequence || 2} status={byId.chemical?.status} />
      </Stage>

      <Stage id="clarifier" point={byId.clarifier} selectedPointId={selectedPointId} onSelect={onSelect}>
        <g filter="url(#equipmentShadow)">
          <path d="M354 258 H510 V353 Q510 383 432 383 Q354 383 354 353Z" fill="url(#concrete)" stroke="#527b8a" strokeWidth="3" />
          <path d="M365 278 H499 V347 Q499 367 432 367 Q365 367 365 347Z" fill="#bceaf8" />
          <path d="M370 290 H494" stroke="#fff" strokeWidth="4" opacity=".78" />
          <path d="M432 258 V349 M386 349 H478" stroke="#527b8a" strokeWidth="3" />
          <circle cx="432" cy="300" r="9" fill="#1385b5" />
          <path d="M377 347 L392 358 L407 347 L422 358 L437 347 L452 358 L467 347 L482 358" fill="none" stroke="#9b7553" strokeWidth="5" opacity=".65" />
        </g>
        <text x="432" y="235" textAnchor="middle" className="equipment-label">ถังรวมตะกอนและตกตะกอน</text>
        <MonitorBadge x="497" y="244" sequence={byId.clarifier?.sequence || 3} status={byId.clarifier?.status} />
      </Stage>

      <Stage id="filter" point={byId.filter} selectedPointId={selectedPointId} onSelect={onSelect}>
        <g filter="url(#equipmentShadow)">
          <rect x="548" y="231" width="138" height="132" rx="11" fill="#fff" stroke="#527989" strokeWidth="3" />
          {[0, 1].map((index) => <g key={index} transform={`translate(${560 + index * 59} 248)`}><rect width="52" height="99" rx="5" fill="#bceaf8" /><path d="M0 49 H52" stroke="#d3b47e" strokeWidth="14" /><path d="M0 76 H52" stroke="#746d65" strokeWidth="14" /><path d="M26 0 V20" stroke="#fff" strokeWidth="4" /></g>)}
          <path d="M558 363 H676" stroke="#527989" strokeWidth="4" />
        </g>
        <text x="617" y="207" textAnchor="middle" className="equipment-label">ถังกรองน้ำแบบกรองเร็ว</text>
        <text x="617" y="384" textAnchor="middle" className="equipment-subtitle">ชั้นทรายกรองและระบบล้างย้อน</text>
        <MonitorBadge x="674" y="218" sequence={byId.filter?.sequence || 4} status={byId.filter?.status} />
      </Stage>

      <Stage id="clear-well" point={byId["clear-well"]} selectedPointId={selectedPointId} onSelect={onSelect}>
        <g filter="url(#equipmentShadow)">
          <path d="M758 322 H846 V418 H718 V362 H758Z" fill="url(#concrete)" stroke="#527989" strokeWidth="3" />
          <path d="M730 369 H834 V405 H730Z" fill="#8fd8ef" />
          <path d="M711 322 H853 L837 298 H729Z" fill="#e3eaed" stroke="#527989" strokeWidth="3" />
          <path d="M743 384 H821" stroke="#fff" strokeWidth="4" opacity=".72" />
          <circle cx="748" cy="310" r="7" fill="#20aa9c" /><path d="M748 302 V283" stroke="#527989" strokeWidth="4" />
        </g>
        <text x="781" y="275" textAnchor="middle" className="equipment-label">ถังน้ำใสและฆ่าเชื้อ</text>
        <text x="781" y="442" textAnchor="middle" className="equipment-subtitle">สำรองน้ำหลังผ่านการกรอง</text>
        <MonitorBadge x="838" y="289" sequence={byId["clear-well"]?.sequence || 5} status={byId["clear-well"]?.status} />
      </Stage>

      <Stage id="high-lift" point={byId["high-lift"]} selectedPointId={selectedPointId} onSelect={onSelect}>
        <g filter="url(#equipmentShadow)">
          <path d="M865 326 L924 279 L986 326Z" fill="#ee9d59" stroke="#6e5c4d" strokeWidth="3" />
          <rect x="874" y="326" width="103" height="69" rx="5" fill="#fff" stroke="#6e5c4d" strokeWidth="3" />
          {[898, 947].map((x) => <g key={x}><circle cx={x} cy="359" r="16" fill="#1386b7" stroke="#164a61" strokeWidth="3" /><path d={`M${x - 8} 359 H${x + 8} M${x} 351 V367`} stroke="#fff" strokeWidth="3" /></g>)}
          <path d="M850 378 H874 M977 359 H1000" stroke="#355e70" strokeWidth="9" />
        </g>
        <text x="923" y="258" textAnchor="middle" className="equipment-label">สถานีสูบน้ำแรงสูง</text>
        <MonitorBadge x="973" y="278" sequence={byId["high-lift"]?.sequence || 6} status={byId["high-lift"]?.status} />
      </Stage>

      <Stage id="water-tower" point={byId["water-tower"]} selectedPointId={selectedPointId} onSelect={onSelect} className="water-tower">
        <g filter="url(#equipmentShadow)">
          <path d="M1057 94 Q1057 68 1087 59 H1173 Q1203 68 1203 94 L1196 145 Q1186 174 1158 181 H1102 Q1074 174 1064 145Z" fill="url(#towerMetal)" stroke="#314e5a" strokeWidth="5" />
          <rect x="1057" y={towerWaterTop} width="146" height={176 - towerWaterTop} fill="url(#diagramWater)" opacity=".92" clipPath="url(#towerBowlClip)" />
          <path d="M1077 181 L1046 426 M1183 181 L1214 426 M1103 181 L1088 426 M1157 181 L1172 426" stroke="#3f5964" strokeWidth="7" />
          <path d="M1056 272 H1204 M1049 344 H1211 M1070 218 H1190" stroke="#78909a" strokeWidth="5" />
          <path d="M1071 218 L1198 344 M1189 218 L1062 344 M1056 272 L1209 426 M1204 272 L1051 426" stroke="#91a3aa" strokeWidth="3" />
          <path d="M1121 190 V405 M1140 190 V405" stroke="#687f89" strokeWidth="3" />
          {[218, 244, 270, 296, 322, 348, 374, 400].map((y) => <path key={y} d={`M1121 ${y} H1140`} stroke="#687f89" strokeWidth="3" />)}
          <path d="M1130 59 V35 M1117 35 H1143" stroke="#314e5a" strokeWidth="4" />
          <path d="M1203 90 L1224 80" stroke="#314e5a" strokeWidth="6" />
          <path d="M1038 426 H1222" stroke="#718890" strokeWidth="8" />
          <text x="1130" y="113" textAnchor="middle" className="tower-label">หอถังสูง</text>
          <text x="1130" y="140" textAnchor="middle" className="tower-level">{towerLevel}%</text>
        </g>
        <MonitorBadge x="1197" y="61" sequence={byId["water-tower"]?.sequence || 7} status={byId["water-tower"]?.status} />
      </Stage>

      <Stage id="distribution" point={byId.distribution} selectedPointId={selectedPointId} onSelect={onSelect} className="distribution">
        <g filter="url(#equipmentShadow)">
          <rect x="1238" y="326" width="64" height="38" rx="8" fill="#fff" stroke="#527989" strokeWidth="3" />
          <circle cx="1270" cy="345" r="12" fill="#e8f7fb" stroke="#1684b4" strokeWidth="3" /><path d="M1270 345 L1277 338" stroke="#1684b4" strokeWidth="3" />
          <text x="1270" y="315" textAnchor="middle" className="equipment-subtitle">มาตรวัดหลัก</text>
          {[1245, 1322, 1381].map((x, index) => <g key={x} transform={`translate(${x} ${235 - index * 12})`}><path d="M0 40 L27 16 L57 40Z" fill={index === 1 ? "#70b9da" : "#ee9b61"} stroke="#466877" strokeWidth="3" /><rect x="7" y="40" width="44" height="54" rx="3" fill="#fff" stroke="#466877" strokeWidth="3" /><rect x="17" y="56" width="11" height="14" fill="#a8ddf1" /><rect x="35" y="56" width="9" height="38" fill="#d2b18b" /><path d="M28 94 V130" stroke="#1385b5" strokeWidth="6" /></g>)}
          <path d="M1224 365 H1422" stroke="#355e70" strokeWidth="18" strokeLinecap="round" />
          <path d="M1224 365 H1422" stroke="#24b9e9" strokeWidth="8" strokeDasharray="16 13" strokeLinecap="round" />
          <path d="M1273 365 V411 M1349 365 V411 M1409 365 V411" stroke="#1686b6" strokeWidth="8" />
          <circle cx="1347" cy="352" r="19" fill="#fff" stroke="#527989" strokeWidth="3" /><path d="M1347 352 L1355 343" stroke="#1684b4" strokeWidth="3" /><path d="M1338 359 A13 13 0 0 1 1356 359" fill="none" stroke="#1684b4" strokeWidth="3" />
        </g>
        <text x="1323" y="202" textAnchor="middle" className="equipment-label">ท่อเมนและพื้นที่บริการ</text>
        <MonitorBadge x="1400" y="214" sequence={byId.distribution?.sequence || 8} status={byId.distribution?.status} />
      </Stage>

      <g className="water-flow-callout" transform="translate(996 188)"><rect width="58" height="25" rx="12" /><text x="29" y="17" textAnchor="middle">ท่อส่ง</text></g>
      <g className="water-flow-callout" transform="translate(1210 386)"><rect width="58" height="25" rx="12" /><text x="29" y="17" textAnchor="middle">ท่อจ่าย</text></g>

      {PROCESS_STEPS.map((step) => <ProcessNode key={step.id} step={step} point={byId[step.id]} selectedPointId={selectedPointId} onSelect={onSelect} />)}
    </svg>
  );
}
