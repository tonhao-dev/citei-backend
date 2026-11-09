import type { NextFunction, Request, Response } from 'express';
import { AppError, HttpCode } from '../../../app/Errors/AppError';
import errorHandler from '../../../app/Errors/ErrorHandle';

function responseMock() {
  const res = { status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  return res;
}

describe('errorHandler', () => {
  let res: ReturnType<typeof responseMock>;

  beforeEach(() => {
    // Arrange
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    res = responseMock();
  });

  afterEach(() => {
    // Teardown
    vi.restoreAllMocks();
  });

  it('should answer with the AppError http code and message', () => {
    // Arrange
    const error = new AppError({ httpCode: HttpCode.NOT_FOUND, description: 'nao encontrado' });

    // Act
    errorHandler(error, {} as Request, res as unknown as Response, vi.fn() as NextFunction);

    // Assert
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'nao encontrado' });
  });

  it('should answer 500 with a generic message for unknown errors', () => {
    // Arrange
    const error = new Error('segredo interno');

    // Act
    errorHandler(error, {} as Request, res as unknown as Response, vi.fn() as NextFunction);

    // Assert
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
  });
});