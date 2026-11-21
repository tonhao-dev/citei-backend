# Projeto API Citei

Passos para executar este projeto:

1. Execute o comando `npm i` para instalar as dependências necessárias.
2. Configure as configurações do banco de dados criando um arquivo `.env` na raiz para o seu banco de dados local como no `.env.example`
3. Execute o comando `npm start` para iniciar o servidor.

## Executando Testes

Para executar os testes deste projeto, siga estes passos:

1. Execute o comando `npm test` para executar os testes utilizando o Jest.

## Testes de contrato (Pact)

O frontend (`citei-webapp`) é o consumidor e este backend é o provedor.
O Pact Broker guarda os contratos e roda só na sua máquina.

1. `npm run pact:broker:up` sobe o broker em http://localhost:9292.
2. No `citei-webapp`: `npm run test:pact` e depois `npm run pact:publish`.
3. Aqui: `npm run pact:verify` verifica os contratos e publica o resultado.
4. `npm run pact:can-i-deploy` diz se esta versão pode ir para produção.

`npm run test:pact` verifica sem publicar o resultado.
`npm run pact:broker:down` desliga o broker. Os dados ficam no volume.


## Segurança (Snyk)

1. Copie o token em https://app.snyk.io/account e ponha no `.env`: `SNYK_TOKEN=seu-token`.
2. Rode `npm run snyk:all` (dependências, código e imagem Docker).
3. Rode `npm run snyk:monitor` para guardar um snapshot no painel do Snyk.

Sem `SNYK_TOKEN` no `.env`, os scripts avisam e saem com código 0. Com token, falham se acharem problema de severidade alta ou maior.