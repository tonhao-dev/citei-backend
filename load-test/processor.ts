/**
 * Funções chamadas pelo Artillery durante o teste de carga.
 * O Artillery converte este arquivo TypeScript sozinho (esbuild): não precisa de ts-node.
 *
 * Cada função recebe o mesmo conjunto de argumentos que o Artillery entrega aos hooks:
 *  - requestParams: o pedido que vai ser enviado (dá para mudar o corpo, os headers etc.)
 *  - context: guarda as variáveis do usuário virtual (vars)
 *  - events: serve para emitir métricas próprias
 *  - next: avisa o Artillery que a função terminou
 *
 * Este backend não tem login, então não há JWT para assinar: o foco é gerar dados válidos.
 */
import { randomUUID } from 'node:crypto';

interface RequestParams {
  json?: unknown;
  [key: string]: unknown;
}

interface Context {
  vars: Record<string, unknown>;
}

interface Events {
  emit(type: 'counter' | 'histogram', name: string, value: number): void;
}

interface Response {
  statusCode: number;
}

type Next = (error?: Error) => void;

// O banco guarda até 100 caracteres em título, subtítulo e autor.
const MAX_TEXT = 100;

const AUTORES = ['Sêneca', 'Epicuro', 'Marco Aurélio', 'Simone de Beauvoir', 'Albert Camus'];

const cut = (text: string) => text.slice(0, MAX_TEXT);

export interface ColecaoGerada {
  titulo: string;
  subtitulo: string;
  autor: string;
  imagem: string;
}

/** Gera uma coleção válida e diferente a cada chamada. */
export function gerarDadosDaColecao(): ColecaoGerada {
  const id = randomUUID();
  return {
    titulo: cut(`Carga ${id}`),
    subtitulo: cut(`Coleção criada pelo teste de carga ${id.slice(0, 8)}`),
    autor: cut(AUTORES[Math.floor(Math.random() * AUTORES.length)]),
    imagem: `https://exemplo.com/capas/${id}.jpg`,
  };
}

/** Hook beforeRequest: troca o corpo do pedido por uma coleção nova. */
export function gerarColecao(
  requestParams: RequestParams,
  _context: Context,
  _events: Events,
  next: Next
) {
  requestParams.json = gerarDadosDaColecao();
  return next();
}

/** Hook afterResponse: conta as coleções criadas e as respostas fora do esperado. */
export function contarResposta(
  requestParams: RequestParams,
  response: Response,
  _context: Context,
  events: Events,
  next: Next
) {
  if (response.statusCode === 200) {
    events.emit('counter', 'colecoes.criadas', 1);
  } else {
    events.emit('counter', 'colecoes.falhas_ao_criar', 1);
  }
  return next();
}
