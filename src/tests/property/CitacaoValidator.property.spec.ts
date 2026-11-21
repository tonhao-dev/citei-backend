import { test, fc } from '@fast-check/vitest';
import { validationResult } from 'express-validator';
import type { ValidationChain } from 'express-validator';
import type { Request } from 'express';
import {
  CreateCitacaoValidator,
  UpdateCitacaoValidator,
} from '../../app/validators/CitacaoValidator';

async function invalidPaths(chains: ValidationChain[], body: object) {
  const req = { body } as Request;
  for (const chain of chains) {
    await chain.run(req);
  }
  return validationResult(req).array().map(error => ('path' in error ? error.path : ''));
}

describe('CitacaoValidator (propriedades)', () => {
  test.prop({ titulo: fc.string({ minLength: 1 }), id_colecao: fc.integer({ min: 0 }) })(
    'deve aceitar qualquer titulo não vazio com id_colecao inteiro',
    async body => {
      // Arrange
      const payload = body;

      // Act
      const paths = await invalidPaths(CreateCitacaoValidator, payload);

      // Assert
      expect(paths).toEqual([]);
    }
  );

  test.prop({
    titulo: fc.string({ minLength: 1 }),
    id_colecao: fc.double({ noNaN: true, noDefaultInfinity: true }).filter(n => !Number.isInteger(n)),
  })('deve rejeitar qualquer id_colecao que não seja inteiro', async body => {
    // Arrange
    const payload = body;

    // Act
    const paths = await invalidPaths(CreateCitacaoValidator, payload);

    // Assert
    expect(paths).toContain('id_colecao');
  });

  test.prop({ titulo: fc.string({ minLength: 3, maxLength: 255 }) })(
    'deve aceitar na atualização qualquer titulo de 3 a 255 caracteres',
    async body => {
      // Arrange
      const payload = body;

      // Act
      const paths = await invalidPaths(UpdateCitacaoValidator, payload);

      // Assert
      expect(paths).toEqual([]);
    }
  );

  test.prop({ titulo: fc.string({ maxLength: 2 }) })(
    'deve rejeitar na atualização qualquer titulo com menos de 3 caracteres',
    async body => {
      // Arrange
      const payload = body;

      // Act
      const paths = await invalidPaths(UpdateCitacaoValidator, payload);

      // Assert
      expect(paths).toContain('titulo');
    }
  );
});
