import type ColecaoEntity from '../../../app/entities/ColecaoEntity';
import type CitacaoEntity from '../../../app/entities/CitacaoEntity';
import type ColecaoInterface from '../../../app/interfaces/entities/ColecaoInterface';
import type CitacaoInterface from '../../../app/interfaces/entities/CitacaoInterface';
import type { ColecaoRepositoryInterface } from '../../../app/interfaces/repositories/ColecaoRepositoryInterface';
import type { CitacaoRepositoryInterface } from '../../../app/interfaces/repositories/CitacaoRepositoryInterface';

// Banco falso em memória. Responde com o mesmo formato dos repositórios reais
// (linhas "colecao_*" nas listas), sem abrir conexão nenhuma.

let colecoes: ColecaoEntity[] = [];
let citacoes: CitacaoEntity[] = [];
let nextColecaoId = 1;
let nextCitacaoId = 1;

const contains = (value: string, text?: string) =>
  !text || value.toLowerCase().includes(text.toLowerCase());

export function resetStore() {
  colecoes = [];
  citacoes = [];
  nextColecaoId = 1;
  nextCitacaoId = 1;
}

export const colecaoRepository: ColecaoRepositoryInterface = {
  async findAll(titulo) {
    return colecoes
      .filter(colecao => contains(colecao.titulo, titulo))
      .map(toColecaoRow) as unknown as ColecaoEntity[];
  },

  async findById(id) {
    const colecao = colecoes.find(item => item.id === id);
    return (colecao ? toColecaoRow(colecao) : undefined) as unknown as ColecaoEntity;
  },

  async getColecaoOnly(id) {
    return (colecoes.find(item => item.id === id) ?? null) as ColecaoEntity;
  },

  async create(data: ColecaoInterface) {
    const colecao = { ...data, id: nextColecaoId++, created_at: new Date() } as ColecaoEntity;
    colecoes.push(colecao);
    return colecao;
  },

  async update(id, data: ColecaoInterface) {
    const colecao = colecoes.find(item => item.id === id) as ColecaoEntity;
    Object.assign(colecao, data);
    return colecao;
  },

  async delete(id) {
    colecoes = colecoes.filter(item => item.id !== id);
    // Mesmo efeito do ON DELETE CASCADE da chave estrangeira.
    citacoes = citacoes.filter(item => item.id_colecao !== id);
  },
};

export const citacaoRepository: CitacaoRepositoryInterface = {
  async findAll(titulo) {
    return citacoes
      .filter(citacao => contains(citacao.titulo, titulo))
      .map(toCitacaoRow) as unknown as CitacaoEntity[];
  },

  async findById(id) {
    const citacao = citacoes.find(item => item.id === id);
    return (citacao ? toCitacaoRow(citacao) : null) as unknown as CitacaoEntity;
  },

  async getCitacaoOnly(id) {
    return (citacoes.find(item => item.id === id) ?? null) as CitacaoEntity;
  },

  async create(data: CitacaoInterface) {
    const citacao = { ...data, id: nextCitacaoId++, created_at: new Date() } as CitacaoEntity;
    citacoes.push(citacao);
    return citacao;
  },

  async update(id, data: CitacaoInterface) {
    const citacao = citacoes.find(item => item.id === id) as CitacaoEntity;
    Object.assign(citacao, data);
    return citacao;
  },

  async delete(id) {
    citacoes = citacoes.filter(item => item.id !== id);
  },
};

function toColecaoRow(colecao: ColecaoEntity) {
  return {
    colecao_id: colecao.id,
    colecao_titulo: colecao.titulo,
    colecao_subtitulo: colecao.subtitulo ?? null,
    colecao_imagem: colecao.imagem,
    colecao_autor: colecao.autor,
    created_at: colecao.created_at,
  };
}

function toCitacaoRow(citacao: CitacaoEntity) {
  const colecao = colecoes.find(item => item.id === citacao.id_colecao);
  return {
    id: citacao.id,
    citacao_titulo: citacao.titulo,
    citacao_created_at: citacao.created_at,
    colecao_id: colecao?.id ?? null,
    colecao_titulo: colecao?.titulo ?? null,
    colecao_subtitulo: colecao?.subtitulo ?? null,
    colecao_imagem: colecao?.imagem ?? null,
    colecao_autor: colecao?.autor ?? null,
  };
}
