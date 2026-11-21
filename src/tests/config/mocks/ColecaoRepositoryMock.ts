import type { Mocked } from 'vitest';
import { ColecaoRepositoryInterface } from "../../../app/interfaces/repositories/ColecaoRepositoryInterface";
import { CreatedColecaoFixture, ManyColecaoFixture, OneColecaoFixture } from "../fixtures/ColecaoFixture";

export const ColecaoRepositoryMock = (): Mocked<ColecaoRepositoryInterface> => {
  return {
    findAll: vi.fn().mockResolvedValue(ManyColecaoFixture),
    findById: vi.fn().mockResolvedValue(OneColecaoFixture),
    create: vi.fn().mockResolvedValue(CreatedColecaoFixture),
    update: vi.fn().mockResolvedValue(OneColecaoFixture),
    delete: vi.fn(),
    getColecaoOnly: vi.fn().mockResolvedValue(OneColecaoFixture),
  } as Mocked<ColecaoRepositoryInterface>;
};