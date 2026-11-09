# Teste de carga (Artillery)

Arquitetura: um arquivo YAML descreve as fases e os cenários, e um arquivo TypeScript (`processor.ts`) cria os dados e conta métricas próprias.
O Artillery roda dentro de um container com Node 22, porque a versão 2.0.34 quebra no Node 26 (o compilador de TypeScript dele falha).

| Arquivo | Para que serve |
|---|---|
| `load-test.yml` | Fases de carga, cenários, plugins e metas (`ensure`). |
| `processor.ts` | Hooks `beforeRequest` e `afterResponse` que geram dados e emitem métricas. |
| `report.ts` | Transforma o JSON do Artillery em uma página HTML. |
| `Dockerfile` e `docker-compose.yml` | Container com Node 22 e o Artillery. |

## Passo a passo (na sua máquina)

1. `npm run load:up` sobe a API e o banco e espera a API ficar saudável (`GET /health`).
2. `npm run load:test` roda o teste de carga. Dura cerca de 2 min 30 s.
3. `npm run load:report` gera `load-test/reports/report.html`. Abra o arquivo no navegador.
4. `npm run load:down` desliga a API e o banco.

O `load:test` termina com erro se a meta falhar: p95 acima de 500 ms ou mais de 1% de erros.

## Fases (o que cada número quer dizer)

- `duration`: quantos segundos a fase dura.
- `arrivalRate`: quantos usuários virtuais novos chegam por segundo.
- `rampTo`: a chegada sobe aos poucos até este valor.

| Fase | Duração | Chegada |
|---|---|---|
| Aquecimento | 30 s | 2 por segundo |
| Subida | 60 s | de 2 até 10 por segundo |
| Carga pesada | 60 s | 10 por segundo |

## Cenários

- 60%: lista as coleções (`GET /colecao`).
- 40%: cria uma coleção, lê e apaga a mesma. Assim o banco não acumula lixo.

Este backend não tem login, então o `processor.ts` só gera dados válidos (título de até 100 caracteres).

## Outro ambiente (staging)

No PowerShell:

```powershell
$env:API_URL = "https://staging.exemplo.com"
npm run load:test:staging
```

O ambiente `staging` do `load-test.yml` usa fases mais longas e mais pesadas, até 50 usuários por segundo.
Quando a API não está no Docker local, o `load:up` não é preciso, mas a rede `citei-net` precisa existir. Rode `docker network create citei-net` uma vez.

## Teste de estresse (achar o ponto de ruptura)

`npm run load:test:stress` sobe a carga em 6 degraus de 45 s, de 10 até 1000 usuários novos por segundo (no máximo 2000 ao mesmo tempo). Dura cerca de 4 min 30 s.
`npm run load:report:stress` gera `load-test/reports/report-stress.html`.

O ponto de ruptura é o degrau em que o p95 dispara ou os erros começam. Se as metas do `ensure` falharem, o comando termina com erro.
Cuidado: pode travar a API e a sua máquina. Use só em local ou em staging, nunca em produção.

## Parar o teste quando os erros sobem (stop-on-errors)

O plugin `ensure` só confere as metas no fim do teste. Para parar na hora, o projeto tem o plugin próprio `load-test/plugins/artillery-plugin-stop-on-errors`.

A cada janela de 10 s ele calcula a taxa de erros (respostas 4xx e 5xx, mais erros de conexão como `ETIMEDOUT`). Se ela passar do limite por algumas janelas seguidas, ele encerra o teste e grava o JSON do que já rodou.

```yaml
plugins:
  stop-on-errors:
    maxErrorRate: 5         # para se mais de 5% dos pedidos da janela derem erro
    minRequests: 100        # ignora janelas com poucos pedidos
    consecutiveWindows: 2   # janelas seguidas acima do limite
```

A regra é a mesma em qualquer máquina. Um computador mais fraco chega no limite antes e o teste termina sozinho. Um mais forte vai mais longe. O arquivo é o mesmo para todos.
O relatório de um teste interrompido mostra um aviso no topo, e os percentis gerais passam a ser uma média das janelas.