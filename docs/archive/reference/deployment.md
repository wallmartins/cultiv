---
title: Deployment Guide
doc_type: reference
status: active
domain: deployment
last_updated: 2026-05-16
---

# Deployment Guide

Guia de deploy e validação da AI Writing Engine API.

## Pré-requisitos

- Node.js 18+
- npm ou yarn
- Variáveis de ambiente configuradas

## Variáveis de Ambiente

```bash
# Obrigatórias
PORT=3000
OLLAMA_API_KEY=your_api_key

# Opcionais
NODE_ENV=production
OLLAMA_URL=http://localhost:11434
REQUEST_TIMEOUT_MS=300000
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

## Build

```bash
# Instalar dependências
npm ci --only=production

# Build
npm run build
```

## Iniciar Servidor

```bash
# Produção
npm run server

# Ou diretamente
node dist/server.js
```

## Validação de Deploy

Após iniciar o servidor, execute o script de validação:

```bash
# Validação completa
node scripts/validate-deployment.js

# Com URL customizada
node scripts/validate-deployment.js http://localhost:3000
```

Este script verifica:
- ✅ Health endpoint
- ✅ Validação de pipelines
- ✅ CRUD de skills
- ✅ Validação de query params
- ✅ Swagger UI
- ✅ OpenAPI spec
- ✅ Tratamento de erros 404
- ✅ CORS headers

## Load Testing

Execute testes de carga para validar performance:

```bash
# Teste padrão (100 requests, 10 concorrentes, 30s)
node scripts/load-test.js

# Configurações customizadas
node scripts/load-test.js --url http://localhost:3000 --requests 500 --concurrency 20 --duration 60
```

Métricas medidas:
- Latência (min, avg, max, p95, p99)
- Throughput (requests/second)
- Taxa de sucesso
- Performance thresholds

### Thresholds de Performance

| Endpoint | Latência Média Máxima |
|----------|----------------------|
| GET /health | 100ms |
| GET /skills/declarative | 200ms |

## Docker

### Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/

EXPOSE 3000

CMD ["node", "dist/server.js"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  engine:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - OLLAMA_API_KEY=${OLLAMA_API_KEY}
    healthcheck:
      test: ["CMD", "node", "scripts/validate-deployment.js"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## Endpoints Disponíveis

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/health` | GET | Health check |
| `/run` | POST | Executar pipeline |
| `/skills/declarative` | GET | Listar skills |
| `/skills/declarative` | POST | Criar skill |
| `/skills/declarative/:name` | GET | Obter skill |
| `/skills/declarative/:name` | PUT | Atualizar skill |
| `/skills/declarative/:name` | DELETE | Deletar skill |
| `/docs` | GET | Swagger UI |
| `/docs/json` | GET | OpenAPI spec |

## Solução de Problemas

### Servidor não inicia

1. Verifique se a porta está disponível
2. Confirme que todas as variáveis de ambiente estão configuradas
3. Verifique os logs com `NODE_ENV=development`

### Validação falha

1. Confirme que o servidor está rodando
2. Verifique a URL no script de validação
3. Verifique os logs do servidor

### Performance baixa

1. Verifique recursos do servidor (CPU/Memória)
2. Ajuste `RATE_LIMIT_MAX_REQUESTS` se necessário
3. Considere usar Redis para rate limiting

## Checklist de Deploy

- [ ] Build completo sem erros
- [ ] Todas as variáveis de ambiente configuradas
- [ ] Servidor iniciando sem erros
- [ ] Script de validação passando (100%)
- [ ] Load test passando (todos os thresholds)
- [ ] Documentação acessível (/docs)
- [ ] Logs configurados corretamente

## Monitoramento

O servidor Fastify gera logs estruturados automaticamente. Para produção, considere:

- Exportar logs para serviço externo (Datadog, CloudWatch, etc)
- Configurar alertas para erros 500
- Monitorar latência média
- Acompanhar taxa de requests/minuto
