import { contarResposta, gerarColecao, gerarDadosDaColecao } from '../../../../load-test/processor';

describe('load-test/processor', () => {
  afterEach(() => {
    // Teardown
    vi.restoreAllMocks();
  });

  describe('gerarDadosDaColecao', () => {
    it('deve gerar textos que cabem no limite de 100 caracteres do banco', () => {
      // Arrange
      const limite = 100;

      // Act
      const colecao = gerarDadosDaColecao();

      // Assert
      expect(colecao.titulo.length).toBeLessThanOrEqual(limite);
      expect(colecao.subtitulo.length).toBeLessThanOrEqual(limite);
      expect(colecao.autor.length).toBeLessThanOrEqual(limite);
    });

    it('deve gerar um titulo diferente a cada chamada', () => {
      // Arrange
      const quantidade = 50;

      // Act
      const titulos = new Set(Array.from({ length: quantidade }, () => gerarDadosDaColecao().titulo));

      // Assert
      expect(titulos.size).toBe(quantidade);
    });
  });

  describe('gerarColecao (hook beforeRequest)', () => {
    it('deve trocar o corpo do pedido e chamar o next sem erro', () => {
      // Arrange
      const requestParams: { json?: unknown } = {};
      const next = vi.fn();

      // Act
      gerarColecao(requestParams, { vars: {} }, { emit: vi.fn() }, next);

      // Assert
      expect(requestParams.json).toMatchObject({ titulo: expect.any(String), autor: expect.any(String) });
      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('contarResposta (hook afterResponse)', () => {
    it('deve contar uma coleção criada quando a resposta for 200', () => {
      // Arrange
      const emit = vi.fn();

      // Act
      contarResposta({}, { statusCode: 200 }, { vars: {} }, { emit }, vi.fn());

      // Assert
      expect(emit).toHaveBeenCalledWith('counter', 'colecoes.criadas', 1);
    });

    it('deve contar uma falha quando a resposta não for 200', () => {
      // Arrange
      const emit = vi.fn();

      // Act
      contarResposta({}, { statusCode: 500 }, { vars: {} }, { emit }, vi.fn());

      // Assert
      expect(emit).toHaveBeenCalledWith('counter', 'colecoes.falhas_ao_criar', 1);
    });
  });
});
