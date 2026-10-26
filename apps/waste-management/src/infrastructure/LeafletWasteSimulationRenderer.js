export class LeafletWasteSimulationRenderer {
  #map;
  #leaflet;
  #marker = null;

  constructor({ map, leaflet }) {
    this.#map = map;
    this.#leaflet = leaflet;
  }

  render({ position }) {
    if (!position) return;
    const point = [position.latitude, position.longitude];
    if (!this.#marker) {
      const icon = this.#leaflet.divIcon({
        className: "waste-simulation-truck-icon", iconSize: [48, 42], iconAnchor: [24, 29],
        html: `<span class="waste-simulation-truck" aria-hidden="true"><svg data-truck-facing viewBox="0 0 64 44" focusable="false"><path d="M7 10h32v24H7zM39 18h10l8 9v7H39z" fill="currentColor"/><path d="M44 21h4.5l4.8 5.5H44z" fill="#fff8e8"/><path d="M10 6h27l-3 6H10z" fill="currentColor"/><circle cx="18" cy="35" r="6" fill="#473321"/><circle cx="47" cy="35" r="6" fill="#473321"/><circle cx="18" cy="35" r="2.5" fill="#fff"/><circle cx="47" cy="35" r="2.5" fill="#fff"/></svg></span>`,
      });
      this.#marker = this.#leaflet.marker(point, { icon, zIndexOffset: 1500,
        title: "รถเก็บขยะ — แสดงตามเส้นทางที่กำหนด", keyboard: true }).addTo(this.#map);
      this.#marker.bindTooltip("รถเก็บขยะ", { permanent: true, direction: "top", offset: [0, -26], className: "waste-simulation-truck-label" });
    }
    this.#marker.setLatLng(point);
    const facing = this.#marker.getElement()?.querySelector("[data-truck-facing]");
    if (facing) facing.style.transform = position.facingWest ? "scaleX(-1)" : "none";
  }

  clear() {
    this.#marker?.remove();
    this.#marker = null;
  }
}
