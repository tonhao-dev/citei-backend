import type { Mocked } from 'vitest';
import { CitacaoRepositoryInterface } from "../../../app/interfaces/repositories/CitacaoRepositoryInterface";
import { OneCitacaoFixture, OneCitacaoOnlyFixture, manyCitacoesFixture } from "../fixtures/CitacaoFixtures";


export const CitacaoRepositoryMock = (): Mocked<CitacaoRepositoryInterface> => {
  return {
    findAll: vi.fn().mockResolvedValue(manyCitacoesFixture),
    findById: vi.fn().mockResolvedValue(OneCitacaoFixture),
    create: vi.fn().mockResolvedValue(OneCitacaoFixture),
    update: vi.fn().mockResolvedValue(OneCitacaoFixture),
    delete: vi.fn(),
    getCitacaoOnly: vi.fn().mockResolvedValue(OneCitacaoOnlyFixture),
  } as Mocked<CitacaoRepositoryInterface>;
};
