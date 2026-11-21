import { validationResult } from 'express-validator';
import type { ValidationChain } from 'express-validator';
import type { Request } from 'express';
import { CreateCitacaoValidator, UpdateCitacaoValidator } from '../../../app/validators/CitacaoValidator';

async function run(chains: ValidationChain[], body: object) {
  const req = { body } as Request;
  for (const chain of chains) {
    await chain.run(req);
  }
  return validationResult(req).array().map(error => ('path' in error ? error.path : ''));
}

describe('CitacaoValidator', () => {
  afterEach(() => {
    // Teardown
    vi.restoreAllMocks();
  });

  describe('CreateCitacaoValidator', () => {
    it('should accept titulo and a numeric id_colecao', async () => {
      // Arrange
      const body = { titulo: 'frase', id_colecao: 1 };

      // Act
      const paths = await run(CreateCitacaoValidator, body);

      // Assert
      expect(paths).toEqual([]);
    });

    it('should require titulo and id_colecao', async () => {
      // Arrange
      const body = {};

      // Act
      const paths = await run(CreateCitacaoValidator, body);

      // Assert
      expect(paths).toEqual(expect.arrayContaining(['titulo', 'id_colecao']));
    });

    it('should reject a non integer id_colecao', async () => {
      // Arrange
      const body = { titulo: 'frase', id_colecao: 'abc' };

      // Act
      const paths = await run(CreateCitacaoValidator, body);

      // Assert
      expect(paths).toContain('id_colecao');
    });
  });

  describe('UpdateCitacaoValidator', () => {
    it('should accept an empty body', async () => {
      // Arrange
      const body = {};

      // Act
      const paths = await run(UpdateCitacaoValidator, body);

      // Assert
      expect(paths).toEqual([]);
    });

    it('should reject a titulo shorter than 3 characters', async () => {
      // Arrange
      const body = { titulo: 'ab' };

      // Act
      const paths = await run(UpdateCitacaoValidator, body);

      // Assert
      expect(paths).toContain('titulo');
    });

    it('should reject a non integer id_colecao', async () => {
      // Arrange
      const body = { id_colecao: 1.5 };

      // Act
      const paths = await run(UpdateCitacaoValidator, body);

      // Assert
      expect(paths).toContain('id_colecao');
    });
  });
});