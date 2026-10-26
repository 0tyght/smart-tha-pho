import { useCallback, useEffect, useMemo, useState } from "react";
import { createWasteFleetTracking } from "../composition-root/createWasteFleetTracking.js";
import { useSilentPolling } from "../lib/useSilentPolling.js";
import WasteMap from "../components/WasteMap.jsx";
import { ErrorNotice, LoadingState, PageHead, StatusBadge, formatDate } from "../components/ui.jsx";
import { routeMapColor } from "../lib/wasteMapConfig.js";

const EMPTY_PLANS = [];

export default function FleetTrackingPage({ token, onOpenHistory }) {
  const controller = useMemo(() => createWasteFleetTracking(token), [token]);
  const [state, setState] = useState(() => controller.snapshot());
  useEffect(() => { const unsubscribe = controller.subscribe(setState); return () => { unsubscribe(); controller.dispose(); }; }, [controller]);
  const refresh = useCallback((options) => controller.refresh(options), [controller]);
  const selectVehicle = useCallback((id) => controller.selectVehicle(id), [controller]);
  useSilentPolling(refresh, { intervalMs: 8_000 });
  const selected = state.selected;

  return <>
    <PageHead title="ติดตามรถเก็บขยะ" detail="ตำแหน่งล่าสุดของรถทั้งหมด เลือกรถเพื่อดูเส้นทางและความคืบหน้าของงานที่กำลังปฏิบัติ"
      actions={<button className="waste-button waste-button--secondary" onClick={onOpenHistory}>ประวัติแผนตามวันที่</button>} />
    <ErrorNotice error={state.error} onRetry={() => void controller.refresh()} />
    {state.loading ? <LoadingState /> : <>
      <section className="waste-fleet-toolbar" aria-label="ภาพรวมรถทั้งหมด">
        <div className="waste-fleet-counts"><strong>รถทั้งหมด {state.total} คัน</strong><span>กำลังปฏิบัติงาน {state.operating}</span><span>มีตำแหน่ง {state.positioned}</span><span>ยังไม่มีตำแหน่ง {state.unknown}</span></div>
        <div className="waste-fleet-actions">
          {state.example ? <>
            <button className="waste-button waste-button--secondary" onClick={() => controller.toggleMotion()}>{state.motionPaused ? "ให้รถวิ่งต่อ" : "พักการเคลื่อนที่"}</button>
            <label className="waste-fleet-speed">ความเร็วรถ <select aria-label="ความเร็วรถทุกคัน" value={state.speedKph} onChange={(event) => controller.setSpeed(event.target.value)}><option value="10">10 กม./ชม.</option><option value="20">20 กม./ชม.</option><option value="30">30 กม./ชม.</option><option value="40">40 กม./ชม.</option></select></label>
          </> : null}
          {state.example ? <button className="waste-button waste-button--secondary" onClick={() => controller.showActual()}>กลับข้อมูล GPS</button>
            : <button className="waste-button" disabled={!state.canShowExample} onClick={() => controller.showExample()}>ดูตัวอย่างการวิ่ง</button>}
          <button className="waste-button waste-button--secondary" disabled={state.refreshing} onClick={() => void controller.refresh()}>{state.refreshing ? "กำลังรีเฟรช…" : "รีเฟรชตำแหน่ง"}</button>
        </div>
      </section>
      {state.example ? <p className="waste-fleet-notice" role="status"><strong>ตัวอย่างการปฏิบัติงาน</strong> รถที่กำลังปฏิบัติงานเคลื่อนอัตโนมัติ คลิกรถเพื่อแสดงเส้นทาง สีรถตรงกับสีเส้นทาง · ไม่บันทึก GPS จริง</p>
        : <p className="waste-fleet-note">อัปเดตอัตโนมัติทุก 8 วินาที{state.updatedAt ? ` · ตรวจสอบล่าสุด ${formatDate(state.updatedAt, {hour:"2-digit",minute:"2-digit",second:"2-digit"})}` : ""} · ตำแหน่งที่ขาดการอัปเดตไม่ถือเป็น GPS สด</p>}
      <section className="waste-fleet-layout">
        <article className="waste-panel waste-panel--map waste-fleet-map-panel">
          <header className="waste-panel__head waste-fleet-map-heading">
            <div><h2>{selected ? `${selected.vehicleCode} · ${selected.route?.routeName || "ไม่มีงานที่กำลังปฏิบัติ"}` : "ตำแหน่งรถทั้งหมด"}</h2>
              <small>{selected ? selected.gpsLabel : "คลิกที่รถบนแผนที่หรือเลือกจากรายการด้านข้าง"}</small></div>
            {selected ? <button className="waste-text-button" onClick={() => controller.selectVehicle("")}>ดูรถทั้งหมด</button> : null}
          </header>
          <WasteMap plans={EMPTY_PLANS} routeGeojson={state.routeGeojson} routeStops={state.stops}
            history={state.history} historySegments={state.historySegments} trackingMode
            trackingStatus={selected?.plan?.status || ""} focusKey={`fleet:${state.example}:${state.selectedId}:${state.positioned > 0}`}
            onVehicleClick={selectVehicle} selectedVehicleId={state.selectedId}
            fleetVehicles={state.vehicles} fleetExample={state.example} fleetPaused={state.motionPaused}
            fleetSpeedKph={state.speedKph}
            routeColor={selected?.route ? routeMapColor(selected.route.routeCode || selected.route.id) : ""} />
          {!state.positioned && !state.example ? <div className="waste-fleet-map-message"><strong>ยังไม่มีรถส่งตำแหน่ง GPS</strong><span>รถทั้ง {state.total} คันยังอยู่ในรายการ ไม่วางรถที่พิกัดสมมติบนแผนที่</span><button className="waste-text-button" disabled={!state.canShowExample} onClick={() => controller.showExample()}>ดูตัวอย่างรถวิ่งตามเส้นทาง</button></div> : null}
          <div className="waste-fleet-map-footer"><span>สีรถตรงกับสีเส้นทาง</span><span>คลิกรถเพื่อแสดงเส้นทางเฉพาะคัน</span><span>{state.example ? "รถที่กำลังปฏิบัติงานวิ่งต่อเนื่อง แม้ไม่ได้เลือก" : "เมื่อรับ GPS ใหม่ ตำแหน่งรถจะอัปเดตบนแผนที่"}</span></div>
        </article>
        <aside className="waste-panel waste-fleet-list" aria-label="รายการรถเก็บขยะ">
          <header className="waste-panel__head"><h2>รถทั้งหมด</h2><span>{state.total} คัน</span></header>
          {!state.vehicles.length ? <p className="waste-fleet-note">ยังไม่มีรถในทะเบียนรถเก็บขยะ</p> : <ul>{state.vehicles.map((vehicle) => <li key={vehicle.id}>
            <button className={`waste-fleet-vehicle${state.selectedId === vehicle.id ? " is-selected" : ""}`} aria-pressed={state.selectedId === vehicle.id} onClick={() => controller.selectVehicle(vehicle.id)}>
              <span className="waste-fleet-vehicle__heading"><strong><i className="waste-fleet-route-color" style={{backgroundColor:vehicle.route ? routeMapColor(vehicle.route.routeCode || vehicle.route.id) : "#60756a"}} aria-hidden="true" />{vehicle.vehicleCode}</strong><StatusBadge value={vehicle.status} /></span>
              <span>{vehicle.registrationNo}</span>
              <span className={`waste-fleet-gps is-${vehicle.gpsKey}`}><i aria-hidden="true" />{vehicle.gpsLabel}</span>
              <small>{vehicle.plan ? vehicle.route?.routeName || vehicle.plan.routeName : "ไม่มีงานที่กำลังปฏิบัติ"}</small>
              {!state.example && vehicle.position && vehicle.lastGpsAt ? <small>รับพิกัด {formatDate(vehicle.lastGpsAt, {dateStyle:"short",timeStyle:"short"})}</small> : null}
            </button>
          </li>)}</ul>}
        </aside>
      </section>
      {selected ? <section className="waste-panel waste-fleet-detail" aria-label="งานของรถที่เลือก">
        <h2>{selected.vehicleCode} · {state.example ? "ตัวอย่างการปฏิบัติงาน" : "งานที่กำลังปฏิบัติ"}</h2>
        {selected.plan ? <><dl><div><dt>แผนปฏิบัติงานเก็บขยะ</dt><dd>{selected.plan.planNo}</dd></div><div><dt>เส้นทาง</dt><dd>{selected.route?.routeName || selected.plan.routeName}</dd></div><div><dt>สถานะงาน</dt><dd><StatusBadge value={selected.plan.status} /></dd></div></dl>
          {state.stops.length ? <ol className="waste-fleet-stop-list">{state.stops.map((stop) => <li key={stop.id}><span>{stop.sequenceNo}. {stop.stopName}</span><StatusBadge value={stop.confirmationStatus || "SCHEDULED"} /></li>)}</ol> : null}
        </> : <p>รถคันนี้ไม่มีแผนที่กำลังปฏิบัติงานในวันนี้ จึงยังไม่มีเส้นทางงานให้แสดง ตำแหน่งล่าสุดจะแสดงเมื่อรถส่ง GPS</p>}
      </section> : null}
    </>}
  </>;
}
