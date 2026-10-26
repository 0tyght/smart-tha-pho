import {
  ACTIVE_STATUSES,
  DisasterIncident,
  INCIDENT_STATUS,
} from "../domain/DisasterIncident.js";
export class DisasterOperationsController {
  constructor({
    repository,
    clock = () => new Date(),
    idFactory = () => crypto.randomUUID(),
  }) {
    this.repository = repository;
    this.clock = clock;
    this.idFactory = idFactory;
    this.state = null;
  }
  load() {
    this.state = this.repository.load();
    return this.view();
  }
  view() {
    const state = structuredClone(this.state);
    const busy = state.incidents.filter((item) =>
      ACTIVE_STATUSES.includes(item.status),
    );
    return {
      ...state,
      incidents: state.incidents.map((item) => ({
        ...item,
        statusLabel: INCIDENT_STATUS[item.status],
        allowedStatuses: new DisasterIncident(item).allowedStatuses,
        teamName: state.teams.find((team) => team.id === item.teamId)?.name,
        vehicleName: state.vehicles.find(
          (vehicle) => vehicle.id === item.vehicleId,
        )?.name,
      })),
      teams: state.teams.map((team) => ({
        ...team,
        busy: busy.some((item) => item.teamId === team.id),
      })),
      vehicles: state.vehicles.map((vehicle) => ({
        ...vehicle,
        busy: busy.some((item) => item.vehicleId === vehicle.id),
      })),
    };
  }
  #commit(next) {
    this.repository.save(next);
    this.state = next;
    return this.view();
  }
  create(command) {
    const now = this.clock().toISOString();
    const incident = new DisasterIncident({
      ...command,
      lat: Number(command.lat),
      lng: Number(command.lng),
      id: `DIS-${this.idFactory().slice(0, 8).toUpperCase()}`,
      status: "NEW",
      createdAt: now,
      history: [{ status: "NEW", at: now, note: "รับแจ้งเหตุ" }],
    });
    if (command.lat === "" || command.lng === "")
      throw new Error("กรุณาระบุพิกัดเหตุ");
    const next = structuredClone(this.state);
    next.incidents.unshift(incident.toJSON());
    return this.#commit(next);
  }
  #busy(next, teamId, vehicleId, excludeId) {
    return next.incidents.some(
      (item) =>
        item.id !== excludeId &&
        ACTIVE_STATUSES.includes(item.status) &&
        (item.teamId === teamId || item.vehicleId === vehicleId),
    );
  }
  assign(id, command) {
    const next = structuredClone(this.state);
    const index = next.incidents.findIndex((item) => item.id === id);
    if (index < 0) throw new Error("ไม่พบเหตุ");
    if (
      !next.teams.some((team) => team.id === command.teamId) ||
      !next.vehicles.some((vehicle) => vehicle.id === command.vehicleId)
    )
      throw new Error("ไม่พบทีมและรถที่เลือก");
    if (this.#busy(next, command.teamId, command.vehicleId, id))
      throw new Error("ทีมและรถที่เลือกมีงานอยู่ กรุณาเลือกทรัพยากรที่พร้อม");
    const incident = new DisasterIncident(next.incidents[index]);
    incident.assign(command, this.clock().toISOString());
    next.incidents[index] = incident.toJSON();
    return this.#commit(next);
  }
  transition(id, status, note) {
    const next = structuredClone(this.state);
    const index = next.incidents.findIndex((item) => item.id === id);
    if (index < 0) throw new Error("ไม่พบเหตุ");
    const item = next.incidents[index];
    if (
      ACTIVE_STATUSES.includes(status) &&
      this.#busy(next, item.teamId, item.vehicleId, id)
    )
      throw new Error("ทีมและรถมีงานอื่นอยู่ ไม่สามารถเปิดงานซ้ำได้");
    const incident = new DisasterIncident(item);
    incident.transition(status, note, this.clock().toISOString());
    next.incidents[index] = incident.toJSON();
    return this.#commit(next);
  }
}
