function numberValue(value) {
  return Number(value || 0);
}

function guestState() {
  return {
    linked: false,
    menuKey: "guest",
    owner: null,
    location: { latitude: null, longitude: null, missing: true },
    counts: {
      pets: 0,
      pending: 0,
      needsAttention: 0,
      vaccinationDue: 0,
      unsterilized: 0,
      missingPets: 0,
    },
    actions: ["REGISTER", "TRACK", "LINK"],
  };
}

function selectMenuKey(state) {
  if (!state.linked) return "guest";

  return state.counts.needsAttention > 0 ||
    state.counts.pending > 0 ||
    state.counts.vaccinationDue > 0 ||
    state.counts.missingPets > 0 ||
    state.location.missing
    ? "action"
    : "owner";
}

export class CitizenExperienceService {
  constructor({ citizenExperienceRepository }) {
    if (!citizenExperienceRepository) {
      throw new TypeError("CitizenExperienceService requires citizenExperienceRepository");
    }

    this.citizenExperienceRepository = citizenExperienceRepository;
  }

  async loadByLineUserId(lineUserId) {
    const normalizedLineUserId = String(lineUserId || "").trim();
    if (!normalizedLineUserId) return guestState();

    const owner = await this.citizenExperienceRepository.findOwnerByLineUserId(
      normalizedLineUserId,
    );
    if (!owner) return guestState();

    const [petStats, requestStats] = await Promise.all([
      this.citizenExperienceRepository.loadPetStats(owner.id),
      this.citizenExperienceRepository.loadRequestStats(owner.id),
    ]);
    const latitude = owner.latitude === null ? null : Number(owner.latitude);
    const longitude = owner.longitude === null ? null : Number(owner.longitude);

    const state = {
      linked: true,
      menuKey: "owner",
      owner: {
        id: owner.id,
        fullName: owner.fullName,
        phone: owner.phone,
        houseNo: owner.houseNo,
        addressDetail: owner.addressDetail || "",
        villageId: numberValue(owner.villageId),
        villageNo: numberValue(owner.villageNo),
        villageName: owner.villageName,
      },
      location: {
        latitude,
        longitude,
        missing: !Number.isFinite(latitude) || !Number.isFinite(longitude),
      },
      counts: {
        pets: numberValue(petStats.pets),
        pending: numberValue(requestStats.pending),
        needsAttention: numberValue(requestStats.needsAttention),
        vaccinationDue: numberValue(petStats.vaccinationDue),
        unsterilized: numberValue(petStats.unsterilized),
        missingPets: numberValue(petStats.missingPets),
      },
      actions: [],
    };

    if (state.counts.needsAttention > 0) state.actions.push("REVIEW_REQUIRED");
    if (state.counts.vaccinationDue > 0) state.actions.push("VACCINATION_DUE");
    if (state.counts.unsterilized > 0) state.actions.push("STERILIZATION");
    if (state.counts.missingPets > 0) state.actions.push("MISSING_PET");
    if (state.location.missing) state.actions.push("LOCATION_REQUIRED");
    if (state.counts.pending > 0) state.actions.push("PENDING");
    if (!state.actions.length) state.actions.push("READY");

    state.menuKey = selectMenuKey(state);
    return state;
  }
}
