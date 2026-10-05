export class ListActiveVillagesUseCase {
  constructor({ villageRepository }) {
    if (!villageRepository) {
      throw new TypeError("ListActiveVillagesUseCase requires villageRepository");
    }
    this.villageRepository = villageRepository;
  }

  execute() {
    return this.villageRepository.listActive();
  }
}
