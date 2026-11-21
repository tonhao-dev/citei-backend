import { test, fc } from '@fast-check/vitest';
import { validationResult } from 'express-validator';
import type { ValidationChain } from 'express-validator';
import type { Request } from 'express';
import {
  CreateColecaoValidator,
  UpdateColecaoValidator,
} from '../../app/validators/ColecaoValidator';

async function invalidPaths(chains: ValidationChain[], body: object) {
  const req = { body, query: {} } as Request;
  for (const chain of chains) {
    await chain.run(req);
  }
  return validationResult(req).array().map(error => ('path' in error ? error.path : ''));
}

const validText = fc.string({ minLength: 1, maxLength: 255 });
const tooLongText = fc.string({ minLength: 256, maxLength: 400 });
const notAString = fc.oneof(fc.integer(), fc.boolean(), fc.constant(null), fc.array(fc.string()));

describe('ColecaoValidator (propriedades)', () => {
  describe('CreateColecaoValidator', () => {
    test.prop({
      titulo: validText,
      autor: validText,
      imagem: fc.option(validText, { nil: undefined }),
      subtitulo: fc.option(validText, { nil: undefined }),
    })('deve aceitar qualquer texto de 1 a 255 caracteres nos campos', async body => {
      // Arrange
      const payload = body;

      // Act
      const paths = await invalidPaths(CreateColecaoValidator, payload);

      // Assert
      expect(paths).toEqual([]);
    });

    test.prop({ titulo: tooLongText, autor: validText })(
      'deve rejeitar qualquer titulo com mais de 255 caracteres',
      async body => {
        // Arrange
        const payload = body;

        // Act
        const paths = await invalidPaths(CreateColecaoValidator, payload);

        // Assert
        expect(paths).toContain('titulo');
      }
    );

    test.prop({ titulo: notAString, autor: validText })(
      'deve rejeitar qualquer titulo que não seja texto',
      async body => {
        // Arrange
        const payload = body;

        // Act
        const paths = await invalidPaths(CreateColecaoValidator, payload);

        // Assert
        expect(paths).toContain('titulo');
      }
    );

    test.prop({ titulo: validText })(
      'deve exigir o autor quando ele não for enviado',
      async body => {
        // Arrange
        const payload = body;

        // Act
        const paths = await invalidPaths(CreateColecaoValidator, payload);

        // Assert
        expect(paths).toContain('autor');
      }
    );
  });

  describe('UpdateColecaoValidator', () => {
    test.prop({
      titulo: fc.option(validText, { nil: undefined }),
      autor: fc.option(validText, { nil: undefined }),
      imagem: fc.option(validText, { nil: undefined }),
      subtitulo: fc.option(validText, { nil: undefined }),
    })('deve aceitar qualquer combinação parcial de campos válidos', async body => {
      // Arrange
      const payload = body;

      // Act
      const paths = await invalidPaths(UpdateColecaoValidator, payload);

      // Assert
      expect(paths).toEqual([]);
    });
  });
});
