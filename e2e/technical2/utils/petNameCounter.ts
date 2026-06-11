import type { PetSummary } from '../pageObjects/petService';

export class PetNameCounter {
  constructor(private readonly pets: PetSummary[]) {}

  countPetsByName(): Record<string, number> {
    const nameCounts: Record<string, number> = {};

    for (const pet of this.pets) {
      nameCounts[pet.name] = (nameCounts[pet.name] ?? 0) + 1;
    }

    return nameCounts;
  }

  countSharedPetNames(): Record<string, number> {
    const shared = Object.fromEntries(
      Object.entries(this.countPetsByName()).filter(([, count]) => count > 1),
    );

    return Object.fromEntries(
      Object.entries(shared).sort(([left], [right]) =>
        left.localeCompare(right),
      ),
    );
  }
}
