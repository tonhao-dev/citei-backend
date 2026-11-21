/**
 * Plugin do Artillery: PARA o teste quando a taxa de erros passa de um limite.
 *
 * Por que existe: o plugin "ensure" só confere as metas no FIM do teste.
 * Este plugin confere a cada janela de 10 s e encerra na hora, então o mesmo
 * arquivo load-test.yml serve para a máquina do professor e para a dos alunos:
 * quem tem menos recursos chega no limite mais cedo e o teste termina sozinho.
 *
 * Uso no load-test.yml:
 *   config:
 *     plugins:
 *       stop-on-errors:
 *         maxErrorRate: 5     # para quando mais de 5% dos pedidos da janela derem erro
 *         minRequests: 100    # ignora janelas com menos pedidos (evita falso alarme)
 *         consecutiveWindows: 2   # quantas janelas seguidas precisam estourar o limite
 *
 * Conta como erro: respostas 4xx e 5xx e erros de conexão (errors.*, como ETIMEDOUT).
 *
 * Roda no processo principal do Artillery (onde existe global.artillery).
 */

const fs = require('node:fs');

const DEFAULTS = { maxErrorRate: 5, minRequests: 100, consecutiveWindows: 2 };

function sum(counters, matches) {
  return Object.entries(counters || {})
    .filter(([name]) => matches(name))
    .reduce((total, [, value]) => total + value, 0);
}

/** Taxa de erros (em %) de uma janela de estatísticas do Artillery. */
function errorRate(stats) {
  const counters = stats.counters || {};
  const requests = counters['http.requests'] || 0;
  const errors =
    sum(counters, name => /^http\.codes\.[45]\d\d$/.test(name)) +
    sum(counters, name => name.startsWith('errors.'));
  return { requests, errors, percent: requests === 0 ? 0 : (errors / requests) * 100 };
}


/**
 * Quando o teste para antes da hora, o Artillery NÃO grava o arquivo --output.
 * Por isso o plugin grava um no mesmo formato ({ aggregate, intermediate }),
 * para o relatório (load:report:stress) continuar funcionando.
 * Os contadores somados são exatos; os percentis gerais são uma média das
 * janelas ponderada pelo número de respostas (aproximação).
 */
function buildReport(windows, reason) {
  const counters = {};
  const weighted = {};
  for (const window of windows) {
    for (const [name, value] of Object.entries(window.counters || {})) {
      counters[name] = (counters[name] || 0) + value;
    }
    for (const [name, summary] of Object.entries(window.summaries || {})) {
      const acc = (weighted[name] = weighted[name] || { count: 0, min: Infinity, max: 0, sums: {} });
      acc.count += summary.count;
      acc.min = Math.min(acc.min, summary.min);
      acc.max = Math.max(acc.max, summary.max);
      for (const key of ['mean', 'p50', 'median', 'p75', 'p90', 'p95', 'p99', 'p999']) {
        acc.sums[key] = (acc.sums[key] || 0) + (summary[key] || 0) * summary.count;
      }
    }
  }
  const summaries = {};
  for (const [name, acc] of Object.entries(weighted)) {
    summaries[name] = { min: acc.min, max: acc.max, count: acc.count };
    for (const [key, sum] of Object.entries(acc.sums)) {
      summaries[name][key] = acc.count === 0 ? 0 : Math.round((sum / acc.count) * 10) / 10;
    }
  }
  const first = windows[0];
  const last = windows[windows.length - 1];
  const seconds = Math.max(1, (last.lastMetricAt - first.firstMetricAt) / 1000);
  return {
    stoppedEarly: reason,
    aggregate: {
      counters,
      rates: { 'http.request_rate': Math.round(((counters['http.requests'] || 0) / seconds) * 10) / 10 },
      summaries,
      firstMetricAt: first.firstMetricAt,
      lastMetricAt: last.lastMetricAt,
    },
    intermediate: windows,
  };
}
/** Caminho do --output (ou -o) da linha de comando do Artillery. */
function outputPath(opts) {
  if (opts?.cliArgs?.output) return opts.cliArgs.output;
  const args = process.argv;
  const index = args.findIndex(arg => arg === '--output' || arg === '-o');
  if (index >= 0) return args[index + 1];
  const inline = args.find(arg => arg.startsWith('--output='));
  return inline ? inline.slice('--output='.length) : undefined;
}

function Plugin(script, events, opts) {
  const config = Object.assign({}, DEFAULTS, script.config?.plugins?.['stop-on-errors']);
  let strikes = 0;
  let stopped = false;
  const windows = [];

  events.on('stats', stats => {
    if (stopped || typeof global.artillery?.shutdown !== 'function') return;

    const { histograms: _histograms, ...window } = stats;
    windows.push(window);

    const { requests, errors, percent } = errorRate(stats);
    if (requests < config.minRequests) return;

    strikes = percent > config.maxErrorRate ? strikes + 1 : 0;
    if (strikes < config.consecutiveWindows) return;

    stopped = true;
    global.artillery.log(
      `\nstop-on-errors: ${percent.toFixed(1)}% de erros (${errors} de ${requests} pedidos) ` +
        `em ${strikes} janelas seguidas, acima de ${config.maxErrorRate}%. Parando o teste.\n`
    );
    const output = outputPath(opts);
    if (output) {
      const reason = { percent, errors, requests, maxErrorRate: config.maxErrorRate };
      fs.writeFileSync(output, JSON.stringify(buildReport(windows, reason)));
    }
    global.artillery.suggestedExitCode = 1;
    global.artillery.shutdown({ earlyStop: true, exitCode: 1 });
  });
}

// LEGACY_METRICS_FORMAT = false: pede ao Artillery as estatísticas no formato novo (counters e summaries).
module.exports = { Plugin, errorRate, buildReport, LEGACY_METRICS_FORMAT: false };
