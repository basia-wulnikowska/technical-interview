import { test, expect } from '../../baseTest';
import { PetService } from '../pageObjects/petService';

test.describe('Petstore Pet API', () => {
  test('should list sold pets as {id, name} tuples', async ({ request }) => {
    const petService = new PetService(request);

    const soldPets = await petService.findPetsByStatus('sold');
    const soldPetSummaries = petService.listSoldPetSummaries(soldPets);

    expect(soldPets.length).toBeGreaterThan(0);
    expect(soldPetSummaries.length).toBeGreaterThan(0);

    for (const pet of soldPetSummaries) {
      expect(pet).toEqual(
        expect.objectContaining({
          id: expect.any(Number),
          name: expect.any(String),
        }),
      );
    }

    console.log(JSON.stringify(soldPetSummaries, null, 2));
  });
});
