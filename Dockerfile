# ============================================
# Dockerfile - VíasBot Telegram
# ============================================
# Build: docker build -t vias-bot .
# Run:   docker run -p 3000:3000 --env-file .env vias-bot

FROM node:22-alpine

# Establecer directorio de trabajo
WORKDIR /app

# Instalar pnpm
RUN npm install -g pnpm

# Copiar archivos de dependencias + patches en el mismo paso
# (pnpm necesita los patches ANTES de ejecutar install)
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

# Instalar dependencias (usa el lockfile exacto, sin red extra)
RUN pnpm install --frozen-lockfile

# Copiar el resto del código fuente
COPY drizzle ./drizzle
COPY server ./server
COPY client ./client
COPY shared ./shared
COPY tsconfig.json vite.config.ts vitest.config.ts drizzle.config.ts ./

# Compilar la aplicación (cliente Vite + servidor esbuild)
RUN pnpm build

# Variables de entorno de producción
ENV NODE_ENV=production
ENV PORT=3000

# Exponer puerto
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Iniciar el servidor
CMD ["node", "dist/index.js"]
