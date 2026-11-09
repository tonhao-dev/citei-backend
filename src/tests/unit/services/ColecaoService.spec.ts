import { AppError } from "../../../app/Errors/AppError";
import { ColecaoRepositoryInterface } from "../../../app/interfaces/repositories/ColecaoRepositoryInterface";
import ColecaoService from "../../../app/services/ColecaoService";
import { ColecaoInterfaceFixture, CreatedColecaoFixture, ManyColecaoFixture, OneColecaoFixture } from "../../config/fixtures/ColecaoFixture";
import { ColecaoRepositoryMock } from "../../config/mocks/ColecaoRepositoryMock";

describe('ColecaoService', () => {
  let colecaoService: ColecaoService;
  let colecaoRepositoryMock: ColecaoRepositoryInterface;

  beforeEach(() => {
    // Arrange
    colecaoRepositoryMock = ColecaoRepositoryMock();
    colecaoService = new ColecaoService(colecaoRepositoryMock);
  });

  afterEach(() => {
    // Teardown
    vi.resetAllMocks();
  });

  describe('findAll', () => {
    it('should return all ColecaoEntity objects', async () => {
      // Arrange
      const expected = ManyColecaoFixture;

      // Act
      const result = await colecaoService.findAll();

      // Assert
      expect(result).toEqual(expected);
      expect(colecaoRepositoryMock.findAll).toHaveBeenCalled();
    });

    it('should call the repository with the specified title', async () => {
      // Arrange
      const titulo = 'titulo';

      // Act
      await colecaoService.findAll(titulo);

      // Assert
      expect(colecaoRepositoryMock.findAll).toHaveBeenCalledWith('titulo');
    });
  });

  describe('findById', () => {
    it('should return the ColecaoEntity object with the specified ID', async () => {
      // Arrange
      const expected = OneColecaoFixture;

      // Act
      const result = await colecaoService.findById(1);

      // Assert
      expect(result).toEqual(expected);
      expect(colecaoRepositoryMock.findById).toHaveBeenCalledWith(1);
    });

    it('should throw an error if the ColecaoEntity with the specified ID is not found', async () => {
      // Arrange
      vi.spyOn(colecaoRepositoryMock, 'findById').mockResolvedValue(null);

      // Act
      const promise = colecaoService.findById(1);

      // Assert
      await expect(promise).rejects.toThrow(AppError);
      expect(colecaoRepositoryMock.findById).toHaveBeenCalledWith(1);
    });
  });

  describe('create', () => {
    it('should create a new ColecaoEntity object', async () => {
      // Arrange
      const expected = CreatedColecaoFixture;

      // Act
      const result = await colecaoService.create(ColecaoInterfaceFixture);

      // Assert
      expect(result).toEqual(expected);
      expect(colecaoRepositoryMock.create).toHaveBeenCalledWith({ ...OneColecaoFixture, ...ColecaoInterfaceFixture, id: undefined });
    });
  });

  describe('update', () => {
    it('should update the ColecaoEntity object with the specified ID', async () => {
      // Arrange
      const expected = OneColecaoFixture;

      // Act
      const result = await colecaoService.update(1, ColecaoInterfaceFixture);

      // Assert
      expect(result).toEqual(expected);
      expect(colecaoRepositoryMock.getColecaoOnly).toHaveBeenCalledWith(1);
      expect(colecaoRepositoryMock.update).toHaveBeenCalledWith(1, { ...OneColecaoFixture, ...ColecaoInterfaceFixture });
    });

    it('should throw an error if the ColecaoEntity with the specified ID is not found', async () => {
      // Arrange
      vi.spyOn(colecaoRepositoryMock, 'getColecaoOnly').mockResolvedValue(null);

      // Act
      const promise = colecaoService.update(1, ColecaoInterfaceFixture);

      // Assert
      await expect(promise).rejects.toThrow(AppError);
      expect(colecaoRepositoryMock.getColecaoOnly).toHaveBeenCalledWith(1);
    });
  });

  describe('delete', () => {
    it('should delete the ColecaoEntity object with the specified ID', async () => {
      // Arrange
      const id = 1;

      // Act
      await colecaoService.delete(id);

      // Assert
      expect(colecaoRepositoryMock.getColecaoOnly).toHaveBeenCalledWith(1);
      expect(colecaoRepositoryMock.delete).toHaveBeenCalledWith(1);
    });

    it('should throw an error if the ColecaoEntity with the specified ID is not found', async () => {
      // Arrange
      vi.spyOn(colecaoRepositoryMock, 'getColecaoOnly').mockResolvedValue(null);

      // Act
      const promise = colecaoService.delete(1);

      // Assert
      await expect(promise).rejects.toThrow(AppError);
      expect(colecaoRepositoryMock.getColecaoOnly).toHaveBeenCalledWith(1);
    });
  });
});