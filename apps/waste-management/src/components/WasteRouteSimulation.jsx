import { useEffect, useMemo, useState } from "react";
import { createWasteRouteSimulation } from "../composition-root/createWasteRouteSimulation.js";

export default function WasteRouteSimulation({ map, mapElement, routeGeojson, routes, selectedRouteId, routeLabel, focusKey, autoPlay = false }) {
  const controller = useMemo(() => createWasteRouteSimulation(map), [map]);
  const [state, setState] = useState(() => controller.snapshot());

  useEffect(() => {
    const unsubscribe = controller.subscribe(setState);
    return () => { unsubscribe(); controller.dispose(); };
  }, [controller]);

  useEffect(() => {
    controller.configureSource({ routeGeojson, routes, selectedRouteId, routeLabel, focusKey });
  }, [controller, routeGeojson, routes, selectedRouteId, routeLabel, focusKey]);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => controller.setReducedMotion(preference.matches);
    const pauseWhenHidden = () => { if (document.hidden) controller.pause(); };
    updatePreference();
    preference.addEventListener("change", updatePreference);
    document.addEventListener("visibilitychange", pauseWhenHidden);
    const observer = typeof IntersectionObserver === "function"
      ? new IntersectionObserver((entries) => { if (!entries[0]?.isIntersecting) controller.pause(); }) : null;
    if (mapElement) observer?.observe(mapElement);
    return () => {
      preference.removeEventListener("change", updatePreference);
      document.removeEventListener("visibilitychange", pauseWhenHidden);
      observer?.disconnect();
    };
  }, [controller, mapElement]);

  useEffect(() => {
    if (autoPlay) controller.play();
  }, [controller, autoPlay, focusKey]);

  return <section className={`waste-route-simulation${state.active ? " is-active" : ""}`} aria-label="การวิ่งของรถเก็บขยะตามเส้นทาง">
    <div className="waste-route-simulation__context">
      <strong>การวิ่งของรถเก็บขยะ</strong>
      <small>{state.hasRoute ? state.label : state.emptyReason}</small>
    </div>
    <div className="waste-route-simulation__controls">
      <button type="button" className="waste-button waste-button--secondary" disabled={!state.hasRoute}
        onClick={() => state.status === "playing" ? controller.pause() : controller.play()}>
        {state.reducedMotion ? "เลื่อนรถทีละ 50 ม." : state.status === "playing" ? "พักการแสดง" : state.status === "paused" ? "เล่นต่อ" : state.status === "completed" ? "เล่นอีกครั้ง" : "แสดงการวิ่ง"}
      </button>
      {state.active ? <>
        <button type="button" className="waste-button waste-button--quiet" onClick={() => controller.reset()}>กลับจุดเริ่ม</button>
        <button type="button" className="waste-button waste-button--quiet" onClick={() => controller.stop()}>ปิดการแสดง</button>
      </> : null}
      {!state.reducedMotion ? <label>ความเร็วรถ
        <select aria-label="ความเร็วรถเก็บขยะ" value={state.speedKph} onChange={(event) => controller.setSpeed(event.target.value)}>
          <option value="10">10 กม./ชม.</option><option value="20">20 กม./ชม.</option><option value="40">40 กม./ชม.</option>
        </select>
      </label> : <small>ลดการเคลื่อนไหว: เลื่อนรถด้วยปุ่มแทนการเล่นต่อเนื่อง</small>}
    </div>
    {state.active ? <div className="waste-route-simulation__status">
      <span role="status">{state.statusLabel}</span>
      <span>{Math.round(state.progressPercent)}% ของเส้นทาง</span>
      <small>แสดงการเคลื่อนที่ตามเส้นทางที่กำหนด</small>
    </div> : null}
  </section>;
}
