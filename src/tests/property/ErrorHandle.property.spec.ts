import { test, fc } from '@fast-check/vitest';
import type { NextFunction, Request, Response } from 'express';
import { AppError, HttpCode } from '../../app/Errors/AppError';
import errorHandler from '../../app/Errors/ErrorHandle';

function responseMock() {
  const res = { status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  return res;
}

function handle(error: Error) {
  const res = responseMock();
  errorHandler(error, {} as Request, res as unknown as Response, vi.fn() as NextFunction);
  return res;
}

describe('errorHandler (propriedades)', () => {
  beforeEach(() => {
    // Arrange
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    // Teardown
    vi.restoreAllMocks();
  });

  test.prop({
    httpCode: fc.constantFrom(HttpCode.BAD_REQUEST, HttpCode.NOT_FOUND, HttpCode.CONFLICT),
    description: fc.string(),
  })('deve responder com o código e a mensagem de qualquer AppError', ({ httpCode, description }) => {
    // Arrange
    const error = new AppError({ httpCode, description });

    // Act
    const res = handle(error);

    // Assert
    expect(res.status).toHaveBeenCalledWith(httpCode);
    expect(res.json).toHaveBeenCalledWith({ error: description });
  });

  test.prop({ message: fc.string({ minLength: 1 }) })(
    'deve responder 500 com mensagem genérica e nunca vazar a mensagem de um erro desconhecido',
    ({ message }) => {
      // Arrange
      const error = new Error(message);

      // Act
      const res = handle(error);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
    }
  );
});
