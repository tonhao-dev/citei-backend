// O plugin é JavaScript: o Artillery carrega plugins por require.
import { buildReport, errorRate } from '../../../../load-test/plugins/artillery-plugin-stop-on-errors/index.js';

const window = (counters: Record<string, number>, summaries: Record<string, unknown> = {}) => ({
  counters,
  summaries,
  firstMetricAt: 1000,
  lastMetricAt: 11000,
});

describe('plugin stop-on-errors', () => {
  afterEach(() => {
    // Teardown
    vi.restoreAllMocks();
  });

  describe('errorRate', () => {
    it('deve ser 0% quando não houve pedidos', () => {
      // Arrange
      const stats = { counters: {} };

      // Act
      const result = errorRate(stats);

      // Assert
      expect(result).toEqual({ requests: 0, errors: 0, percent: 0 });
    });

    it('deve contar respostas 4xx, 5xx e erros de conexão, mas não respostas 2xx', () => {
      // Arrange
      const stats = {
        counters: {
          'http.requests': 100,
          'http.codes.200': 70,
          'http.codes.404': 5,
          'http.codes.500': 5,
          'errors.EADDRNOTAVAIL': 20,
        },
      };

      // Act
      const result = errorRate(stats);

      // Assert
      expect(result).toEqual({ requests: 100, errors: 30, percent: 30 });
    });
  });

  describe('buildReport', () => {
    it('deve somar os contadores das janelas e guardar o motivo da parada', () => {
      // Arrange
      const windows = [window({ 'http.requests': 10 }), window({ 'http.requests': 15, 'errors.ETIMEDOUT': 3 })];
      const reason = { percent: 12, errors: 3, requests: 25, maxErrorRate: 5 };

      // Act
      const report: any = buildReport(windows, reason);

      // Assert
      expect(report.aggregate.counters).toEqual({ 'http.requests': 25, 'errors.ETIMEDOUT': 3 });
      expect(report.stoppedEarly).toEqual(reason);
      expect(report.intermediate).toHaveLength(2);
    });

    it('deve calcular os percentis gerais como média ponderada pelo número de respostas', () => {
      // Arrange
      const summary = (count: number, p95: number) => ({ count, min: 1, max: 9, mean: p95, p50: p95, p95, p99: p95 });
      const windows = [
        window({}, { 'http.response_time': summary(10, 100) }),
        window({}, { 'http.response_time': summary(30, 200) }),
      ];

      // Act
      const report: any = buildReport(windows, {});

      // Assert
      expect(report.aggregate.summaries['http.response_time'].p95).toBe(175);
      expect(report.aggregate.summaries['http.response_time'].count).toBe(40);
    });
  });
});
