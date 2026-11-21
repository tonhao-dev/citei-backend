import request from 'supertest';
import type { Server } from 'http';
import { close, createApp, listen } from '../config/app';
import { resetStore } from '../config/fakes/inMemoryStore';

// Banco falso: os repositórios reais (e o TypeORM) nunca são carregados.
vi.mock('../../app/repositories/ColecaoRepository', async () => ({
  default: (await import('../config/fakes/inMemoryStore')).colecaoRepository,
}));
vi.mock('../../app/repositories/CitacaoRepository', async () => ({
  default: (await import('../config/fakes/inMemoryStore')).citacaoRepository,
}));

const colecao = { titulo: 'Stoicismo', subtitulo: 'Frases', autor: 'Seneca', imagem: 'http://img/1.jpg' };

let server: Server;

beforeAll(async () => {
  // Arrange
  server = await listen(createApp());
});

afterEach(() => {
  // Teardown
  vi.restoreAllMocks();
  resetStore();
});

afterAll(async () => {
  // Teardown
  await close(server);
});

describe('GET /health', () => {
  it('deve responder 200 com status ok, sem depender do banco', async () => {
    // Arrange
    const url = '/health';

    // Act
    const response = await request(server).get(url);

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});

describe('API /colecao (rotas, validação e serviço com banco falso)', () => {
  it('deve gravar a coleção e devolver o id gerado', async () => {
    // Arrange
    const payload = colecao;

    // Act
    const response = await request(server).post('/colecao').send(payload);

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ ...payload, id: 1 });
    expect(response.body.created_at).toBeTruthy();
  });

  it('deve listar as coleções gravadas', async () => {
    // Arrange
    await request(server).post('/colecao').send(colecao);
    await request(server).post('/colecao').send({ ...colecao, titulo: 'Outra' });

    // Act
    const response = await request(server).get('/colecao');

    // Assert
    expect(response.status).toBe(200);
    expect(response.body.map((row: { colecao_titulo: string }) => row.colecao_titulo)).toEqual([
      'Stoicismo',
      'Outra',
    ]);
  });

  it('deve repassar o titulo da busca até o repositório', async () => {
    // Arrange
    await request(server).post('/colecao').send(colecao);
    await request(server).post('/colecao').send({ ...colecao, titulo: 'Outra' });

    // Act
    const response = await request(server).get('/colecao').query({ titulo: 'stoic' });

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].colecao_titulo).toBe('Stoicismo');
  });

  it('deve devolver a coleção pelo id', async () => {
    // Arrange
    await request(server).post('/colecao').send(colecao);

    // Act
    const response = await request(server).get('/colecao/1');

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ colecao_id: 1, colecao_titulo: 'Stoicismo' });
  });

  it('deve responder 404 quando o id não existir', async () => {
    // Arrange
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    // Act
    const response = await request(server).get('/colecao/999');

    // Assert
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error');
  });

  it('deve atualizar só os campos enviados', async () => {
    // Arrange
    await request(server).post('/colecao').send(colecao);

    // Act
    const response = await request(server).put('/colecao/1').send({ titulo: 'Novo titulo' });

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ id: 1, titulo: 'Novo titulo', autor: 'Seneca' });
  });

  it('deve responder 404 ao atualizar uma coleção que não existe', async () => {
    // Arrange
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    // Act
    const response = await request(server).put('/colecao/999').send({ titulo: 'x' });

    // Assert
    expect(response.status).toBe(404);
  });

  it('deve remover a coleção', async () => {
    // Arrange
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await request(server).post('/colecao').send(colecao);

    // Act
    const response = await request(server).delete('/colecao/1');

    // Assert
    expect(response.status).toBe(200);
    expect((await request(server).get('/colecao/1')).status).toBe(404);
  });

  it('deve responder 422 e não gravar nada quando faltar o autor', async () => {
    // Arrange
    const { autor: _autor, ...semAutor } = colecao;

    // Act
    const response = await request(server).post('/colecao').send(semAutor);

    // Assert
    expect(response.status).toBe(422);
    expect((await request(server).get('/colecao')).body).toEqual([]);
  });
});
