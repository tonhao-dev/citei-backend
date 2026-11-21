import { validationResult } from 'express-validator';
import type { ValidationChain } from 'express-validator';
import type { Request } from 'express';
import {
  CreateColecaoValidator,
  GetColecaoValidator,
  UpdateColecaoValidator,
} from '../../../app/validators/ColecaoValidator';

async function run(chains: ValidationChain[], data: { body?: object; query?: object }) {
  const req = { body: data.body ?? {}, query: data.query ?? {} } as Request;
  for (const chain of chains) {
    await chain.run(req);
  }
  return validationResult(req).array().map(error => ('path' in error ? error.path : ''));
}

describe('ColecaoValidator', () => {
  let valid: { titulo: string; autor: string; imagem: string; subtitulo: string };

  beforeEach(() => {
    // Arrange
    valid = { titulo: 'titulo', autor: 'autor', imagem: 'http://img', subtitulo: 'sub' };
  });

  afterEach(() => {
    // Teardown
    vi.restoreAllMocks();
  });

  describe('CreateColecaoValidator', () => {
    it('should accept a complete body', async () => {
      // Arrange
      const body = valid;

      // Act
      const paths = await run(CreateColecaoValidator, { body });

      // Assert
      expect(paths).toEqual([]);
    });

    it('should accept a body without the optional fields', async () => {
      // Arrange
      const body = { titulo: 't', autor: 'a' };

      // Act
      const paths = await run(CreateColecaoValidator, { body });

      // Assert
      expect(paths).toEqual([]);
    });

    it('should require titulo and autor', async () => {
      // Arrange
      const body = {};

      // Act
      const paths = await run(CreateColecaoValidator, { body });

      // Assert
      expect(paths).toContain('titulo');
      expect(paths).toContain('autor');
    });

    it('should reject fields longer than 255 characters', async () => {
      // Arrange
      const body = { ...valid, titulo: 'a'.repeat(256), subtitulo: 'a'.repeat(256) };

      // Act
      const paths = await run(CreateColecaoValidator, { body });

      // Assert
      expect(paths).toEqual(expect.arrayContaining(['titulo', 'subtitulo']));
    });
  });

  describe('UpdateColecaoValidator', () => {
    it('should accept an empty body', async () => {
      // Arrange
      const body = {};

      // Act
      const paths = await run(UpdateColecaoValidator, { body });

      // Assert
      expect(paths).toEqual([]);
    });

    it('should reject a non string titulo', async () => {
      // Arrange
      const body = { titulo: 123 };

      // Act
      const paths = await run(UpdateColecaoValidator, { body });

      // Assert
      expect(paths).toContain('titulo');
    });
  });

  describe('GetColecaoValidator', () => {
    it('should accept a missing titulo', async () => {
      // Arrange
      const query = {};

      // Act
      const paths = await run(GetColecaoValidator, { query });

      // Assert
      expect(paths).toEqual([]);
    });

    it('should reject a titulo longer than 255 characters', async () => {
      // Arrange
      const query = { titulo: 'a'.repeat(256) };

      // Act
      const paths = await run(GetColecaoValidator, { query });

      // Assert
      expect(paths).toContain('titulo');
    });
  });
});