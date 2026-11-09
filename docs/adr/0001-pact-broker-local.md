# O Pact Broker roda só localmente, no compose do backend

## Contexto

Os contratos entre o frontend e o backend precisam de um Pact Broker. Os dois repositórios são separados e hoje não têm CI.

## Decisão

O broker sobe por `docker-compose.pact.yml` no repositório do backend, com Postgres próprio, em http://localhost:9292. Não há workflow de GitHub Actions por enquanto.

## Consequências

- Funciona na oficina e na máquina de cada pessoa, sem custo e sem segredos.
- O CI do GitHub não alcança o `localhost`. Para usar contratos no CI será preciso um broker em endereço público e os segredos `PACT_BROKER_BASE_URL` e `PACT_BROKER_TOKEN`.
- Os scripts já leem `PACT_BROKER_BASE_URL`, então trocar o endereço do broker não exige mudar código.
