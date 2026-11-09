# Glossário

**Coleção**
Um conjunto de citações de um mesmo autor, com título, subtítulo opcional e imagem de capa.

**Citação**
Uma frase que pertence a uma coleção.

**Consumidor**
O sistema que chama a API e depende dela. Aqui é o frontend (`citei-webapp`).

**Provedor**
O sistema que responde às chamadas. Aqui é o backend (`citei-backend`).

**Contrato**
O acordo escrito entre consumidor e provedor: quais pedidos o consumidor faz e quais respostas espera.

**Estado do provedor**
A situação dos dados em que um contrato foi gravado, como "existe uma coleção" ou "não existem coleções".

**Pact Broker**
O lugar que guarda os contratos e os resultados das verificações.

**Verificação**
O provedor rodar os contratos do consumidor e provar que responde como o combinado.
