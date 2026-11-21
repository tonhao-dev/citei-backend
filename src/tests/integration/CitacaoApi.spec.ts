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

const colecao = { titulo: 'Stoicismo', autor: 'Seneca', imagem: 'http://img/1.jpg' };

let server: Server;

async function createColecao() {
  const response = await request(server).post('/colecao').send(colecao);
  return response.body.id as number;
}

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

describe('API /citacao (rotas, validação e serviço com banco falso)', () => {
  it('deve gravar a citação ligada à coleção', async () => {
    // Arrange
    const idColecao = await createColecao();

    // Act
    const response = await request(server)
      .post('/citacao')
      .send({ titulo: 'Memento mori', id_colecao: idColecao });

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ titulo: 'Memento mori', id_colecao: idColecao, id: 1 });
  });

  it('deve devolver a citação junto com os dados da coleção', async () => {
    // Arrange
    const idColecao = await createColecao();
    await request(server).post('/citacao').send({ titulo: 'Memento mori', id_colecao: idColecao });

    // Act
    const response = await request(server).get('/citacao/1');

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      citacao_titulo: 'Memento mori',
      colecao_titulo: 'Stoicismo',
      colecao_autor: 'Seneca',
    });
  });

  it('deve listar só as citações que combinam com o titulo buscado', async () => {
    // Arrange
    const idColecao = await createColecao();
    await request(server).post('/citacao').send({ titulo: 'Memento mori', id_colecao: idColecao });
    await request(server).post('/citacao').send({ titulo: 'Carpe diem', id_colecao: idColecao });

    // Act
    const response = await request(server).get('/citacao').query({ titulo: 'memento' });

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
  });

  it('deve responder 404 quando a citação não existir', async () => {
    // Arrange
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    // Act
    const response = await request(server).get('/citacao/999');

    // Assert
    expect(response.status).toBe(404);
  });

  it('deve responder 404 ao mover a citação para uma coleção que não existe', async () => {
    // Arrange
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const idColecao = await createColecao();
    await request(server).post('/citacao').send({ titulo: 'Memento mori', id_colecao: idColecao });

    // Act
    const response = await request(server).put('/citacao/1').send({ id_colecao: 999 });

    // Assert
    expect(response.status).toBe(404);
  });

  it('deve remover a citação', async () => {
    // Arrange
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const idColecao = await createColecao();
    await request(server).post('/citacao').send({ titulo: 'Memento mori', id_colecao: idColecao });

    // Act
    const response = await request(server).delete('/citacao/1');

    // Assert
    expect(response.status).toBe(200);
    expect((await request(server).get('/citacao/1')).status).toBe(404);
  });

  it('deve responder 400 quando o id_colecao não for um número', async () => {
    // Arrange
    const payload = { titulo: 'Memento mori', id_colecao: 'abc' };

    // Act
    const response = await request(server).post('/citacao').send(payload);

    // Assert
    expect(response.status).toBe(400);
  });
});
