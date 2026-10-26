import { useEffect, useMemo } from "react";
import { createWasteFleetMotion } from "../composition-root/createWasteFleetMotion.js";

export default function WasteFleetMotion({ map, mapElement, vehicles, example, selectedId, speedKph, paused, onSelect }) {
  const controller = useMemo(() => createWasteFleetMotion(map, onSelect), [map, onSelect]);
  useEffect(() => () => controller.dispose(), [controller]);
  useEffect(() => { controller.configure({ vehicles, example, selectedId, speedKph }); }, [controller, vehicles, example, selectedId, speedKph]);
  useEffect(() => {
    let inView = true;
    // Continuous fleet movement is explicitly requested for this tracking view.
    // Do not silently replace it with manual stepping; the global Pause remains available.
    const update = () => controller.setEnabled(!paused && !document.hidden && inView);
    const observer = typeof IntersectionObserver === "function" ? new IntersectionObserver((entries) => { inView = Boolean(entries[0]?.isIntersecting); update(); }) : null;
    if (mapElement) observer?.observe(mapElement);
    document.addEventListener("visibilitychange", update); update();
    return () => { observer?.disconnect(); document.removeEventListener("visibilitychange", update); controller.setEnabled(false); };
  }, [controller, mapElement, paused]);
  return null;
}
