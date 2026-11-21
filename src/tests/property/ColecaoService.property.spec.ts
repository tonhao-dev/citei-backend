import { test, fc } from '@fast-check/vitest';
import ColecaoService from '../../app/services/ColecaoService';
import { ColecaoRepositoryMock } from '../config/mocks/ColecaoRepositoryMock';
import { OneColecaoFixture } from '../config/fixtures/ColecaoFixture';
import type ColecaoInterface from '../../app/interfaces/entities/ColecaoInterface';

const text = fc.string({ maxLength: 50 });

describe('ColecaoService (propriedades)', () => {
  afterEach(() => {
    // Teardown
    vi.restoreAllMocks();
  });

  test.prop({
    autor: fc.option(text, { nil: undefined }),
    titulo: fc.option(text, { nil: undefined }),
    subtitulo: fc.option(text, { nil: undefined }),
    imagem: fc.option(text, { nil: undefined }),
  })(
    'deve atualizar só os campos preenchidos e nunca sobrescrever com valor vazio',
    async changes => {
      // Arrange
      const original = { ...OneColecaoFixture };
      const repository = ColecaoRepositoryMock();
      repository.getColecaoOnly.mockResolvedValue(original);
      const service = new ColecaoService(repository);
      const input = { autor: 'a', titulo: 't', imagem: 'i', ...changes } as ColecaoInterface;
      const before = { ...OneColecaoFixture };

      // Act
      await service.update(1, input);

      // Assert
      const [, saved] = repository.update.mock.calls[0];
      for (const field of ['autor', 'titulo', 'subtitulo', 'imagem'] as const) {
        const provided = input[field];
        expect(saved[field]).toBe(provided ? provided : before[field]);
      }
    }
  );

  test.prop({
    autor: text,
    titulo: text,
    subtitulo: fc.option(text, { nil: undefined }),
    imagem: text,
    id: fc.integer(),
    extra: fc.string(),
  })(
    'deve repassar ao repositório só os quatro campos permitidos ao criar',
    async ({ id, extra, ...fields }) => {
      // Arrange
      const repository = ColecaoRepositoryMock();
      const service = new ColecaoService(repository);
      const input = { ...fields, id, extra } as ColecaoInterface;

      // Act
      await service.create(input);

      // Assert
      expect(repository.create).toHaveBeenCalledWith({
        autor: fields.autor,
        titulo: fields.titulo,
        subtitulo: fields.subtitulo,
        imagem: fields.imagem,
      });
    }
  );

  test.prop({ titulo: fc.option(text, { nil: undefined }) })(
    'deve repassar ao repositório exatamente o titulo da busca',
    async ({ titulo }) => {
      // Arrange
      const repository = ColecaoRepositoryMock();
      const service = new ColecaoService(repository);

      // Act
      await service.findAll(titulo);

      // Assert
      expect(repository.findAll).toHaveBeenCalledWith(titulo);
    }
  );
});
