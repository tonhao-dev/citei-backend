import { Verifier } from '@pact-foundation/pact';
import { execSync } from 'node:child_process';
import type { Server } from 'http';
import { close, createApp, listen } from '../config/app';
import { colecaoRepository, resetStore } from '../config/fakes/inMemoryStore';

// Banco falso: o backend responde sem Postgres, como nos outros testes.
vi.mock('../../app/repositories/ColecaoRepository', async () => ({
  default: (await import('../config/fakes/inMemoryStore')).colecaoRepository,
}));
vi.mock('../../app/repositories/CitacaoRepository', async () => ({
  default: (await import('../config/fakes/inMemoryStore')).citacaoRepository,
}));

const brokerUrl = process.env.PACT_BROKER_BASE_URL ?? 'http://localhost:9292';
const localPact = process.env.PACT_URL; // opcional: caminho de um arquivo de contrato

function git(command: string) {
  return execSync(`git ${command}`, { encoding: 'utf8' }).trim();
}

function providerVersion() {
  if (process.env.PACT_VERSION) return process.env.PACT_VERSION;
  const sha = git('rev-parse --short HEAD');
  const dirty = git('status --porcelain') !== '';
  return dirty ? `${sha}-dirty-${Date.now()}` : sha;
}

const sampleColecao = {
  titulo: 'Stoicismo',
  subtitulo: 'Frases',
  autor: 'Seneca',
  imagem: 'http://localhost:5173/assets/collection.jpg',
};

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

describe('contrato citei-webapp -> citei-backend (verificação do provedor)', () => {
  it('o backend cumpre todos os contratos do frontend', async () => {
    // Arrange
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const port = (server.address() as { port: number }).port;
    const publish = process.env.PACT_PUBLISH_VERIFICATION === 'true';

    const verifier = new Verifier({
      provider: 'citei-backend',
      providerBaseUrl: `http://127.0.0.1:${port}`,
      ...(localPact
        ? { pactUrls: [localPact] }
        : {
            pactBrokerUrl: brokerUrl,
            consumerVersionSelectors: [{ latest: true }],
          }),
      providerVersionBranch: git('rev-parse --abbrev-ref HEAD'),
      ...(publish && {
        publishVerificationResult: true,
        providerVersion: providerVersion(),
      }),
      stateHandlers: {
        'não existem coleções': async () => {
          resetStore();
        },
        'existe uma coleção': async () => {
          resetStore();
          await colecaoRepository.create(sampleColecao);
        },
        'existe uma coleção sem subtítulo': async () => {
          resetStore();
          const { subtitulo: _subtitulo, ...semSubtitulo } = sampleColecao;
          await colecaoRepository.create(semSubtitulo);
        },
      },
    });

    // Act
    const output = verifier.verifyProvider();

    // Assert
    await expect(output).resolves.toBeDefined();
  });
});
