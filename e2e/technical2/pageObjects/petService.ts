import type { APIRequestContext } from '@playwright/test';
import { parseOkJson } from '../utils/http';

export type PetStatus = 'available' | 'pending' | 'sold';

export type Pet = {
  id: number;
  name: string;
  status?: PetStatus;
  photoUrls: string[];
};

export type PetSummary = {
  id: number;
  name: string;
};

export class PetService {
  constructor(private readonly request: APIRequestContext) {}

  async findPetsByStatus(status: PetStatus): Promise<Pet[]> {
    const response = await this.request.get('pet/findByStatus', {
      params: { status },
    });

    return parseOkJson<Pet[]>(response);
  }

  listSoldPetSummaries(pets: Pet[]): PetSummary[] {
    return pets
      .filter((pet) => pet.status === 'sold' && pet.name)
      .map((pet) => ({
        id: pet.id,
        name: pet.name,
      }));
  }
}
