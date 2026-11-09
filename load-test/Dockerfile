# O Artillery 2.0.34 pede Node 22.18 ou mais novo e quebra no Node 26
# (o compilador de TypeScript dele, esbuild-wasm, falha ali).
# Por isso ele roda neste container com Node 22, igual para todo mundo.
FROM node:22-slim

WORKDIR /opt/artillery
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# Tudo roda por npx local: nada é instalado globalmente.
ENV PATH=/opt/artillery/node_modules/.bin:$PATH

WORKDIR /work
