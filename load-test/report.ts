/**
 * Transforma o JSON do Artillery em uma página HTML sozinha (sem internet, sem conta).
 *
 *   npm run load:report   ->  load-test/reports/report.html
 *
 * O comando "artillery report" está obsoleto e não gera mais HTML.
 */
import { readFileSync, writeFileSync } from 'node:fs';

interface Summary {
  min: number;
  max: number;
  count: number;
  mean: number;
  p50: number;
  p95: number;
  p99: number;
}

interface Bucket {
  period: string | number;
  counters: Record<string, number>;
  rates: Record<string, number>;
  summaries: Record<string, Summary>;
  firstMetricAt: number;
  lastMetricAt: number;
}

interface StoppedEarly {
  percent: number;
  errors: number;
  requests: number;
  maxErrorRate: number;
}

interface Report {
  stoppedEarly?: StoppedEarly;
  aggregate: Bucket;
  intermediate: Bucket[];
}

// Mesma meta do load-test.yml (ensure.thresholds). Mude os dois juntos.
const P95_LIMIT_MS = 500;
const ERROR_LIMIT_PERCENT = 1;

const [input = 'load-test/reports/report.json', output = 'load-test/reports/report.html'] =
  process.argv.slice(2);

const report: Report = JSON.parse(readFileSync(input, 'utf8'));
const { aggregate, intermediate, stoppedEarly } = report;

const escape = (text: string) =>
  text.replace(/[&<>"']/g, char => `&#${char.charCodeAt(0)};`);

const number = (value: number | undefined, digits = 0) =>
  (value ?? 0).toLocaleString('pt-BR', { maximumFractionDigits: digits });

function lineChart(title: string, unit: string, series: { name: string; color: string; values: number[] }[]) {
  const width = 640;
  const height = 220;
  const pad = { left: 48, right: 12, top: 12, bottom: 28 };
  const points = intermediate.length;
  const max = Math.max(1, ...series.flatMap(item => item.values)) * 1.1;
  const x = (index: number) =>
    pad.left + (points <= 1 ? 0 : (index / (points - 1)) * (width - pad.left - pad.right));
  const y = (value: number) => pad.top + (1 - value / max) * (height - pad.top - pad.bottom);

  const grid = [0, 0.25, 0.5, 0.75, 1]
    .map(step => {
      const value = max * step;
      return `<line x1="${pad.left}" x2="${width - pad.right}" y1="${y(value)}" y2="${y(value)}" stroke="#e5e7eb"/>` +
        `<text x="${pad.left - 6}" y="${y(value) + 4}" text-anchor="end" font-size="10" fill="#6b7280">${number(value)}</text>`;
    })
    .join('');

  const first = Number(intermediate[0]?.period ?? 0);
  const labels = intermediate
    .map((bucket, index) =>
      index % Math.ceil(points / 8) === 0
        ? `<text x="${x(index)}" y="${height - 8}" text-anchor="middle" font-size="10" fill="#6b7280">${Math.round((Number(bucket.period) - first) / 1000)}s</text>`
        : ''
    )
    .join('');

  const lines = series
    .map(item => {
      const path = item.values.map((value, index) => `${index === 0 ? 'M' : 'L'}${x(index)},${y(value)}`).join(' ');
      return `<path d="${path}" fill="none" stroke="${item.color}" stroke-width="2"/>`;
    })
    .join('');

  const legend = series
    .map(item => `<span><i style="background:${item.color}"></i>${escape(item.name)}</span>`)
    .join('');

  return `<section class="card"><h2>${escape(title)} <small>(${unit})</small></h2>
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${escape(title)}">${grid}${labels}${lines}</svg>
    <div class="legend">${legend}</div></section>`;
}

const counters = aggregate.counters;
const latency = aggregate.summaries['http.response_time'];
const requests = counters['http.requests'] ?? 0;
const responses = counters['http.responses'] ?? 0;
const failedUsers = counters['vusers.failed'] ?? 0;
const createdUsers = counters['vusers.created'] ?? 0;
const errorResponses = Object.entries(counters)
  .filter(([name]) => /^http\.codes\.[45]\d\d$/.test(name))
  .reduce((sum, [, value]) => sum + value, 0);
const networkErrors = Object.entries(counters)
  .filter(([name]) => name.startsWith('errors.'))
  .reduce((sum, [, value]) => sum + value, 0);
const errorPercent = requests === 0 ? 0 : ((errorResponses + networkErrors) / requests) * 100;
const seconds = Math.max(1, (aggregate.lastMetricAt - aggregate.firstMetricAt) / 1000);

const p95Ok = (latency?.p95 ?? 0) <= P95_LIMIT_MS;
const errorOk = errorPercent <= ERROR_LIMIT_PERCENT;

const stoppedBanner = stoppedEarly
  ? `<p class="alert"><strong>Teste interrompido pelo plugin stop-on-errors.</strong> ${number(stoppedEarly.percent, 1)} % de erros (${number(stoppedEarly.errors)} de ${number(stoppedEarly.requests)} pedidos) na janela final, acima do limite de ${stoppedEarly.maxErrorRate} %. Os percentis gerais são uma média das janelas (aproximação).</p>`
  : '';

const cards = [
  ['Duração', `${number(seconds)} s`, ''],
  ['Requisições', number(requests), `${number(requests / seconds, 1)} por segundo`],
  ['Usuários virtuais', number(createdUsers), `${number(failedUsers)} com falha`],
  ['Latência p95', `${number(latency?.p95, 1)} ms`, p95Ok ? `ok (meta ${P95_LIMIT_MS} ms)` : `acima da meta de ${P95_LIMIT_MS} ms`],
  ['Erros', `${number(errorPercent, 2)} %`, errorOk ? `ok (meta ${ERROR_LIMIT_PERCENT} %)` : `acima da meta de ${ERROR_LIMIT_PERCENT} %`],
]
  .map(([label, value, note]) => {
    const bad = note.startsWith('acima');
    return `<div class="stat${bad ? ' bad' : ''}"><span>${label}</span><strong>${value}</strong><em>${note}</em></div>`;
  })
  .join('');

const latencyTable = Object.entries(aggregate.summaries)
  .filter(([name]) => name === 'http.response_time' || name.startsWith('plugins.metrics-by-endpoint.response_time.'))
  .map(([name, item]) => {
    const label = name === 'http.response_time' ? 'Todas as rotas' : name.replace('plugins.metrics-by-endpoint.response_time.', '');
    return `<tr><td>${escape(label)}</td><td>${number(item.count)}</td><td>${number(item.p50, 1)}</td><td>${number(item.p95, 1)}</td><td>${number(item.p99, 1)}</td><td>${number(item.max)}</td></tr>`;
  })
  .join('');

const counterRows = Object.entries(counters)
  .filter(([name]) => name.startsWith('http.codes.') || name.startsWith('colecoes.') || name.startsWith('errors.') || name.startsWith('vusers.created_by_name.'))
  .map(([name, value]) => `<tr><td>${escape(name)}</td><td>${number(value)}</td></tr>`)
  .join('');

const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Relatório de carga | citei-backend</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 0; background: #f3f4f6; color: #111827; }
  main { max-width: 1100px; margin: 0 auto; padding: 24px; }
  h1 { margin: 0 0 4px; }
  .sub { color: #6b7280; margin: 0 0 20px; }
  .alert { background: #fef2f2; border-left: 4px solid #dc2626; padding: 10px 14px; border-radius: 8px; margin: 0 0 16px; }
  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 12px; margin-bottom: 20px; }
  .stat { background: #fff; border-radius: 8px; padding: 14px; border-left: 4px solid #16a34a; display: grid; gap: 2px; }
  .stat.bad { border-left-color: #dc2626; }
  .stat span { color: #6b7280; font-size: 13px; }
  .stat strong { font-size: 24px; }
  .stat em { font-size: 12px; color: #6b7280; font-style: normal; }
  .stat.bad em { color: #dc2626; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(420px, 1fr)); gap: 12px; margin-bottom: 20px; }
  .card { background: #fff; border-radius: 8px; padding: 14px; overflow-x: auto; }
  .card h2 { font-size: 15px; margin: 0 0 8px; }
  small { color: #6b7280; font-weight: normal; }
  svg { width: 100%; height: auto; }
  .legend { display: flex; gap: 14px; font-size: 12px; margin-top: 6px; }
  .legend i { display: inline-block; width: 10px; height: 10px; border-radius: 2px; margin-right: 4px; }
  table { border-collapse: collapse; width: 100%; font-size: 13px; }
  th, td { text-align: right; padding: 6px 8px; border-bottom: 1px solid #e5e7eb; }
  th:first-child, td:first-child { text-align: left; }
</style>
</head>
<body>
<main>
  <h1>Relatório de carga</h1>
  <p class="sub">citei-backend | ${escape(new Date(aggregate.firstMetricAt).toLocaleString('pt-BR'))} | arquivo ${escape(input)}</p>
  ${stoppedBanner}
  <div class="stats">${cards}</div>
  <div class="grid">
    ${lineChart('Tempo de resposta por janela de 10 s', 'ms', [
      { name: 'p50', color: '#16a34a', values: intermediate.map(item => item.summaries['http.response_time']?.p50 ?? 0) },
      { name: 'p95', color: '#f59e0b', values: intermediate.map(item => item.summaries['http.response_time']?.p95 ?? 0) },
      { name: 'p99', color: '#dc2626', values: intermediate.map(item => item.summaries['http.response_time']?.p99 ?? 0) },
    ])}
    ${lineChart('Requisições por janela de 10 s', 'requisições', [
      { name: 'requisições', color: '#2563eb', values: intermediate.map(item => item.counters['http.requests'] ?? 0) },
    ])}
    ${lineChart('Usuários virtuais novos por janela de 10 s', 'usuários', [
      { name: 'criados', color: '#7c3aed', values: intermediate.map(item => item.counters['vusers.created'] ?? 0) },
      { name: 'com falha', color: '#dc2626', values: intermediate.map(item => item.counters['vusers.failed'] ?? 0) },
    ])}
  </div>
  <section class="card"><h2>Tempo de resposta por rota <small>(ms)</small></h2>
    <table><thead><tr><th>Rota</th><th>Chamadas</th><th>p50</th><th>p95</th><th>p99</th><th>máx</th></tr></thead><tbody>${latencyTable}</tbody></table>
  </section>
  <br>
  <section class="card"><h2>Contadores</h2>
    <table><thead><tr><th>Nome</th><th>Valor</th></tr></thead><tbody>${counterRows}</tbody></table>
  </section>
  <p class="sub">Respostas: ${number(responses)} | Janelas de 10 s: ${intermediate.length}</p>
</main>
</body>
</html>
`;

writeFileSync(output, html);
console.log(`Relatório gravado em ${output}`);
