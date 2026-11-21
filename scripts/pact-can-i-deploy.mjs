// Pergunta ao Pact Broker se esta versão pode ir para produção.
// Uso: npm run pact:can-i-deploy
import { execSync } from 'node:child_process';

const broker = (process.env.PACT_BROKER_BASE_URL ?? 'http://localhost:9292').replace(/\/$/, '');
const pacticipant = process.env.PACTICIPANT ?? 'citei-backend';

const git = command => execSync(`git ${command}`, { encoding: 'utf8' }).trim();

function version() {
  if (process.env.PACT_VERSION) return process.env.PACT_VERSION;
  const sha = git('rev-parse --short HEAD');
  const dirty = git('status --porcelain') !== '';
  return dirty ? `${sha}-dirty-${Date.now()}` : sha;
}

// Sem PACT_VERSION, pergunta pela última versão publicada da branch atual.
async function latestVersion() {
  const branch = git('rev-parse --abbrev-ref HEAD');
  const url = `${broker}/pacticipants/${pacticipant}/branches/${encodeURIComponent(branch)}/latest-version`;
  const response = await fetch(url, { headers: { Accept: 'application/hal+json' } });
  if (!response.ok) throw new Error(`Nenhuma versão de ${pacticipant} na branch ${branch}. Publique antes.`);
  return (await response.json()).number;
}

const target = process.env.PACT_VERSION ?? (await latestVersion().catch(() => version()));
const query = new URLSearchParams({
  'q[][pacticipant]': pacticipant,
  'q[][version]': target,
  latestby: 'cvp',
});

const response = await fetch(`${broker}/matrix?${query}`, { headers: { Accept: 'application/hal+json' } });
const body = await response.json();
if (!response.ok) {
  console.error('Falha ao consultar:', JSON.stringify(body, null, 2));
  process.exit(1);
}

const { deployable, reason } = body.summary;
console.log(`${pacticipant} ${target}: ${deployable ? 'PODE' : 'NÃO PODE'} ir para produção`);
console.log(reason);
process.exit(deployable ? 0 : 1);
