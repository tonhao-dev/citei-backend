import { AppError } from "../../../app/Errors/AppError";
import { CitacaoRepositoryInterface } from "../../../app/interfaces/repositories/CitacaoRepositoryInterface";
import { ColecaoRepositoryInterface } from "../../../app/interfaces/repositories/ColecaoRepositoryInterface";
import CitacaoService from "../../../app/services/CitacaoService";
import { OneCitacaoFixture, OneCitacaoOnlyFixture, manyCitacoesFixture, newCitacaoFixture } from "../../config/fixtures/CitacaoFixtures";
import { CitacaoRepositoryMock } from "../../config/mocks/CitacaoRepositoryMock";
import { ColecaoRepositoryMock } from "../../config/mocks/ColecaoRepositoryMock";


describe('CitacaoService', () => {
  let citacaoService: CitacaoService;
  let citacaoRepositoryMock: CitacaoRepositoryInterface;
  let colecaoRepositoryMock: ColecaoRepositoryInterface;

  beforeEach(() => {
    // Arrange
    citacaoRepositoryMock = CitacaoRepositoryMock();
    colecaoRepositoryMock = ColecaoRepositoryMock();
    citacaoService = new CitacaoService(citacaoRepositoryMock, colecaoRepositoryMock);
  });

  afterEach(() => {
    // Teardown
    vi.resetAllMocks();
  });

  describe('findAll', () => {
    it('should return all CitacaoEntity objects', async () => {
      // Arrange
      const expected = manyCitacoesFixture;

      // Act
      const result = await citacaoService.findAll();

      // Assert
      expect(result).toEqual(expected);
      expect(citacaoRepositoryMock.findAll).toHaveBeenCalled();
    });

    it('should send params to CitacaoRepository', async () => {
      // Arrange
      const titulo = 'Citacao';

      // Act
      const result = await citacaoService.findAll(titulo);

      // Assert
      expect(result).toEqual(manyCitacoesFixture);
      expect(citacaoRepositoryMock.findAll).toHaveBeenCalledWith(titulo);
    });
  });

  describe('findById', () => {
    it('should return the CitacaoEntity object with the specified ID', async () => {
      // Arrange
      const expected = OneCitacaoFixture;

      // Act
      const result = await citacaoService.findById(1);

      // Assert
      expect(result).toEqual(expected);
      expect(citacaoRepositoryMock.findById).toHaveBeenCalledWith(1);
    });

    it('should throw an error if the CitacaoEntity with the specified ID is not found', async () => {
      // Arrange
      vi.spyOn(citacaoRepositoryMock, 'findById').mockResolvedValue(null);

      // Act
      const promise = citacaoService.findById(1);

      // Assert
      await expect(promise).rejects.toThrow(AppError);
      expect(citacaoRepositoryMock.findById).toHaveBeenCalledWith(1);
    });
  });

  describe('create', () => {
    it('should create a new CitacaoEntity object', async () => {
      // Arrange
      const expected = OneCitacaoFixture;

      // Act
      const result = await citacaoService.create(newCitacaoFixture);

      // Assert
      expect(result).toEqual(expected);
      expect(citacaoRepositoryMock.create).toHaveBeenCalledWith(newCitacaoFixture);
    });
  });

  describe('update', () => {
    it('should update the CitacaoEntity object with the specified ID', async () => {
      // Arrange
      const expected = OneCitacaoFixture;

      // Act
      const result = await citacaoService.update(1, { titulo: 'Updated Citacao', id_colecao: 2 });

      // Assert
      expect(result).toEqual(expected);
      expect(citacaoRepositoryMock.getCitacaoOnly).toHaveBeenCalledWith(1);
      expect(colecaoRepositoryMock.getColecaoOnly).toHaveBeenCalledWith(2);
      expect(citacaoRepositoryMock.update).toHaveBeenCalledWith(1, { ...OneCitacaoOnlyFixture, id_colecao: 2, titulo: 'Updated Citacao'});
    });

    it('should throw an error if the ColecaoEntity with the specified ID is not found', async () => {
      // Arrange
      vi.spyOn(colecaoRepositoryMock, 'getColecaoOnly').mockResolvedValue(null);

      // Act
      const promise = citacaoService.update(1, { titulo: 'Updated Citacao', id_colecao: 2 });

      // Assert
      await expect(promise).rejects.toThrow(AppError);
      expect(colecaoRepositoryMock.getColecaoOnly).toHaveBeenCalledWith(2);
    });

    it('should throw an error if the CitacaoEntity with the specified ID is not found', async () => {
      // Arrange
      vi.spyOn(citacaoRepositoryMock, 'getCitacaoOnly').mockResolvedValue(null);

      // Act
      const promise = citacaoService.update(1, { titulo: 'Updated Citacao', id_colecao: 2 });

      // Assert
      await expect(promise).rejects.toThrow(AppError);
      expect(citacaoRepositoryMock.getCitacaoOnly).toHaveBeenCalledWith(1);
    });
  });

  describe('delete', () => {
    it('should delete the CitacaoEntity object with the specified ID', async () => {
      // Arrange
      const id = 1;

      // Act
      await citacaoService.delete(id);

      // Assert
      expect(citacaoRepositoryMock.getCitacaoOnly).toHaveBeenCalledWith(1);
      expect(citacaoRepositoryMock.delete).toHaveBeenCalledWith(1);
    });

    it('should throw an error if the CitacaoEntity with the specified ID is not found', async () => {
      // Arrange
      vi.spyOn(citacaoRepositoryMock, 'getCitacaoOnly').mockResolvedValue(null);

      // Act
      const promise = citacaoService.delete(1);

      // Assert
      await expect(promise).rejects.toThrow(AppError);
      expect(citacaoRepositoryMock.getCitacaoOnly).toHaveBeenCalledWith(1);
    });
  });
});