import type { Mocked } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import cors from 'cors';
import ColecaoController from '../../app/controllers/ColecaoController';
import { ColecaoRepositoryInterface } from '../../app/interfaces/repositories/ColecaoRepositoryInterface';
import type { Server } from 'http';
import ColecaoRepository from '../../app/repositories/ColecaoRepository';

vi.mock('../../app/repositories/ColecaoRepository', () => {
  const colecao = {
    id: 1,
    titulo: 'titulo',
    autor: 'autor',
    imagem: 'imagem',
  };

  const repository = {
    findAll: vi.fn().mockResolvedValue([colecao]),
    findById: vi.fn().mockResolvedValue(colecao),
    create: vi.fn().mockResolvedValue(colecao),
    update: vi.fn().mockResolvedValue(colecao),
    delete: vi.fn(),
    getColecaoOnly: vi.fn().mockResolvedValue(colecao),
  } as Mocked<ColecaoRepositoryInterface>;

  return { default: repository };
});

let app: Express;
let server: Server;

beforeAll(async () => {
  // Arrange
  app = express();

  app.use(cors());
  app.use(express.json());
  app.use(ColecaoController.routes);

  await new Promise<void>((resolve) => {
    server = app.listen(0, resolve);
  });
});

afterAll(async () => {
  // Teardown
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

describe('ColecaoController', () => {
  const colecao = {
    id: 1,
    titulo: 'titulo',
    autor: 'autor',
    imagem: 'imagem',
  };

  afterEach(() => {
    // Teardown
    vi.clearAllMocks();
  });

  it('deve retornar 422 ao enviar um título com mais de 255 caracteres', async () => {
    // Arrange
    const query = { titulo: 'a'.repeat(256) };

    // Act
    const response = await request(app).get('/colecao').query(query);

    // Assert
    expect(response.status).toBe(422);
  });

  it('deve retornar um código de status 200 OK e um objeto colecao para GET /colecao/:id', async () => {
    // Arrange
    const url = '/colecao/1';

    // Act
    const response = await request(app).get(url);

    // Assert
    expect(response.status).toBe(200);
    expect(typeof response.body === 'object').toBe(true);
    expect(response.body).toEqual(colecao);
  });

  it('deve retornar um código de status 404 quando a colecao nao existir para GET /colecao/:id', async () => {
    // Arrange
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.mocked(ColecaoRepository.findById).mockResolvedValueOnce(null);

    // Act
    const response = await request(app).get('/colecao/999');

    // Assert
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error');
  });

  it('deve retornar um código de status 200 OK e um novo objeto colecao para POST /colecao', async () => {
    // Arrange
    const payload = {
      titulo: 'titulo',
      autor: 'autor',
      imagem: 'imagem',
    };

    // Act
    const response = await request(app).post('/colecao').send(payload);

    // Assert
    expect(response.status).toBe(200);
    expect(typeof response.body === 'object').toBe(true);
    expect(response.body).toEqual(colecao);
  });

  it('deve retornar um código de status 422 ao enviar campos com mais de 255 caracteres', async () => {
    // Arrange
    const payload = { ...colecao, titulo: 'a'.repeat(256), subtitulo: 'a'.repeat(256), autor: 'a'.repeat(256), imagem: 'a'.repeat(256) };

    // Act
    const response = await request(app).post('/colecao').send(payload);

    // Assert
    expect(response.status).toBe(422);
  });

  it('deve retornar um código de status 422 ao deixar de enviar o titulo', async () => {
    // Arrange
    const payload: Record<string, unknown> = { ...colecao, titulo: undefined };

    // Act
    const response = await request(app).post('/colecao').send(payload);

    // Assert
    expect(response.status).toBe(422);
  });

  it('deve retornar um código de status 422 ao deixar de enviar o autor', async () => {
    // Arrange
    const payload: Record<string, unknown> = { ...colecao, autor: undefined };

    // Act
    const response = await request(app).post('/colecao').send(payload);

    // Assert
    expect(response.status).toBe(422);
    expect(response.body).toMatchSnapshot();
  });

  it('deve retornar um código de status 422 ao deixar de enviar dados obrigatorios', async () => {
    // Arrange
    const payload: Record<string, unknown> = { ...colecao, autor: undefined, titulo: undefined, imagem: undefined };

    // Act
    const response = await request(app).post('/colecao').send(payload);

    // Assert
    expect(response.status).toBe(422);
    expect(response.body).toMatchSnapshot();
  });

  it('deve retornar um código de status 200 OK e um objeto colecao atualizado para PUT /colecao/:id', async () => {
    // Arrange
    const payload = colecao;

    // Act
    const response = await request(app).put('/colecao/1').send(payload);

    // Assert
    expect(response.status).toBe(200);
    expect(typeof response.body === 'object').toBe(true);
    expect(response.body).toEqual(colecao);
  });

  it('deve retornar um código de status 200 OK e uma mensagem de sucesso para DELETE /colecao/:id', async () => {
    // Arrange
    const url = '/colecao/1';

    // Act
    const response = await request(app).delete(url);

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Colecao removida com sucesso!' });
  });
});