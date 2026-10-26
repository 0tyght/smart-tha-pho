const escapeHtml = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

export class LeafletFleetVehicleRenderer {
  #map; #leaflet; #colorForRoute; #onSelect; #markers = new Map(); #selected = new Set();
  constructor({ map, leaflet, colorForRoute, onSelect }) { this.#map = map; this.#leaflet = leaflet; this.#colorForRoute = colorForRoute; this.#onSelect = onSelect; }
  render(vehicles) {
    const seen = new Set();
    for (const vehicle of vehicles) {
      if (!vehicle.position) continue;
      seen.add(vehicle.id);
      const color = vehicle.route ? this.#colorForRoute(vehicle.route.routeCode || vehicle.route.id) : "#60756a";
      let marker = this.#markers.get(vehicle.id);
      const point = [vehicle.position.latitude, vehicle.position.longitude];
      if (!marker) {
        const icon = this.#leaflet.divIcon({ className: "waste-fleet-motion-icon", iconSize: [46, 42], iconAnchor: [23, 28],
          html: `<span class="waste-fleet-motion-truck"><svg data-fleet-facing viewBox="0 0 64 44" aria-hidden="true" focusable="false"><path d="M7 10h32v24H7zM39 18h10l8 9v7H39zM10 6h27l-3 6H10z" fill="currentColor"/><path d="M44 21h4.5l4.8 5.5H44z" fill="#fff"/><circle cx="18" cy="35" r="6" fill="#233a30"/><circle cx="47" cy="35" r="6" fill="#233a30"/><circle cx="18" cy="35" r="2.5" fill="#fff"/><circle cx="47" cy="35" r="2.5" fill="#fff"/></svg></span>` });
        marker = this.#leaflet.marker(point, { icon, keyboard: true, title: vehicle.vehicleCode, zIndexOffset: 1000 }).addTo(this.#map);
        marker.bindTooltip(escapeHtml(vehicle.vehicleCode), { permanent: false, direction: "top", offset: [0, -26], className: "waste-fleet-motion-label" });
        marker.on("click", () => this.#onSelect?.(vehicle.id));
        this.#markers.set(vehicle.id, marker);
      }
      marker.setLatLng(point); marker.setZIndexOffset(vehicle.selected ? 2000 : 1000);
      if (vehicle.selected && !this.#selected.has(vehicle.id)) marker.openTooltip();
      else if (!vehicle.selected && this.#selected.has(vehicle.id)) marker.closeTooltip();
      const element = marker.getElement();
      if (element) {
        // Leaflet rounds ordinary marker updates to pixels; retain sub-pixel
        // coordinates so a slowly moving truck stays fluid between GPS frames.
        const layerPoint = this.#map.project(point).subtract(this.#map.getPixelOrigin());
        this.#leaflet.DomUtil.setPosition(element, layerPoint);
        element.dataset.vehicleId = vehicle.id;
        element.style.setProperty("--vehicle-color", color);
        element.classList.toggle("is-selected", Boolean(vehicle.selected));
        const facing = element.querySelector("[data-fleet-facing]");
        if (facing) facing.style.transform = vehicle.position.facingWest ? "scaleX(-1)" : "none";
      }
    }
    for (const [id, marker] of this.#markers) if (!seen.has(id)) { marker.remove(); this.#markers.delete(id); }
    this.#selected = new Set(vehicles.filter((v) => v.selected).map((v) => v.id));
  }
  clear() { for (const marker of this.#markers.values()) marker.remove(); this.#markers.clear(); this.#selected.clear(); }
}
