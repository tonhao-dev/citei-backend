import { test, fc } from '@fast-check/vitest';
import { AppError, HttpCode } from '../../app/Errors/AppError';

const httpCodes = fc.constantFrom(
  HttpCode.BAD_REQUEST,
  HttpCode.UNAUTHORIZED,
  HttpCode.FORBIDDEN,
  HttpCode.NOT_FOUND,
  HttpCode.CONFLICT,
  HttpCode.INTERNAL_SERVER_ERROR
);

describe('AppError (propriedades)', () => {
  test.prop({ httpCode: httpCodes, description: fc.string() })(
    'deve preservar o código http e a descrição como message',
    ({ httpCode, description }) => {
      // Arrange
      const args = { httpCode, description };

      // Act
      const error = new AppError(args);

      // Assert
      expect(error.httpCode).toBe(httpCode);
      expect(error.message).toBe(description);
    }
  );

  test.prop({ httpCode: httpCodes, description: fc.string(), name: fc.string({ minLength: 1 }) })(
    'deve ser sempre uma instância de Error e de AppError, com o nome informado',
    ({ httpCode, description, name }) => {
      // Arrange
      const args = { httpCode, description, name };

      // Act
      const error = new AppError(args);

      // Assert
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.name).toBe(name);
    }
  );

  test.prop({ httpCode: httpCodes, description: fc.string(), isOperational: fc.boolean() })(
    'deve respeitar o valor de isOperational quando ele for informado',
    ({ httpCode, description, isOperational }) => {
      // Arrange
      const args = { httpCode, description, isOperational };

      // Act
      const error = new AppError(args);

      // Assert
      expect(error.isOperational).toBe(isOperational);
    }
  );
});
