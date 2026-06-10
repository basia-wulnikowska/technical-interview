import { expect, type APIRequestContext } from '@playwright/test';
import { PETSTORE_BASE_URL } from '../utils/constants';

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

  async getPetById(petId: number) {
    const response = await this.request.get(`${PETSTORE_BASE_URL}/pet/${petId}`);

    await expect(response).toBeOK();
    return response.json() as Promise<Pet>;
  }

  async findPetsByStatus(status: PetStatus) {
    const response = await this.request.get(
      `${PETSTORE_BASE_URL}/pet/findByStatus`,
      {
        params: { status },
      },
    );

    await expect(response).toBeOK();
    return response.json() as Promise<Pet[]>;
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
