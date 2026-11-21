// Roda o Snyk com o SNYK_TOKEN do .env.
// Sem token (ou sem Docker, no caso do container): avisa e sai com 0.
// Com token: falha (código 1) se achar problema de severidade alta ou maior.
// Uso: node scripts/snyk.mjs <test|code|container|monitor>
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const IMAGE = 'citei-backend:snyk';
const THRESHOLD = '--severity-threshold=high';
const isWindows = process.platform === 'win32';

if (existsSync('.env')) process.loadEnvFile('.env');

const run = (command, args) =>
  spawnSync(command, args, { stdio: 'inherit', shell: isWindows }).status ?? 1;

const commands = {
  test: () => run('npx', ['--no-install', 'snyk', 'test', THRESHOLD]),
  code: () => run('npx', ['--no-install', 'snyk', 'code', 'test', THRESHOLD]),
  monitor: () => run('npx', ['--no-install', 'snyk', 'monitor']),
  container: () => {
    const docker = spawnSync('docker', ['info'], { stdio: 'ignore', shell: isWindows });
    if (docker.status !== 0) {
      console.log('[snyk] Docker indisponível. Nada a fazer.');
      return 0;
    }
    const build = run('docker', ['build', '-t', IMAGE, '.']);
    if (build !== 0) return build;
    return run('npx', ['--no-install', 'snyk', 'container', 'test', IMAGE, THRESHOLD]);
  },
};

const name = process.argv[2];
if (!commands[name]) {
  console.error(`Uso: node scripts/snyk.mjs <${Object.keys(commands).join('|')}>`);
  process.exit(2);
}

if (!process.env.SNYK_TOKEN?.trim()) {
  console.log('[snyk] SNYK_TOKEN não encontrado no .env. Nada a fazer.');
  process.exit(0);
}

process.exit(commands[name]());