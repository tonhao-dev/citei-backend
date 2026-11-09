import { AppError, HttpCode } from '../../../app/Errors/AppError';

describe('AppError', () => {
  afterEach(() => {
    // Teardown
    vi.restoreAllMocks();
  });

  it('should keep the description as message and the http code', () => {
    // Arrange
    const params = { httpCode: HttpCode.NOT_FOUND, description: 'nao encontrado' };

    // Act
    const error = new AppError(params);

    // Assert
    expect(error.message).toBe('nao encontrado');
    expect(error.httpCode).toBe(404);
  });

  it('should be an instance of Error and AppError', () => {
    // Arrange
    const params = { httpCode: HttpCode.BAD_REQUEST, description: 'x' };

    // Act
    const error = new AppError(params);

    // Assert
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
  });

  it('should use "Error" as default name', () => {
    // Arrange
    const params = { httpCode: 400, description: 'x' };

    // Act
    const error = new AppError(params);

    // Assert
    expect(error.name).toBe('Error');
  });

  it('should accept a custom name', () => {
    // Arrange
    const params = { name: 'Custom', httpCode: 400, description: 'x' };

    // Act
    const error = new AppError(params);

    // Assert
    expect(error.name).toBe('Custom');
  });

  it('should be operational by default', () => {
    // Arrange
    const params = { httpCode: 500, description: 'x' };

    // Act
    const error = new AppError(params);

    // Assert
    expect(error.isOperational).toBe(true);
  });

  it('should allow overriding isOperational', () => {
    // Arrange
    const params = { httpCode: 500, description: 'x', isOperational: false };

    // Act
    const error = new AppError(params);

    // Assert
    expect(error.isOperational).toBe(false);
  });
});