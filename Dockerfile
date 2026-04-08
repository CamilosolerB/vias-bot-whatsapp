# ============================================
# Dockerfile - VíasBot Telegram
# ============================================
# Build: docker build -t vias-bot .
# Run: docker run -p 3000:3000 vias-bot

FROM node:18-alpine

# Establecer directorio de trabajo
WORKDIR /app

# Instalar pnpm
RUN npm install -g pnpm

# Copiar archivos de dependencias
COPY package.json pnpm-lock.yaml ./

# Instalar dependencias
RUN pnpm install --frozen-lockfile

# Copiar código fuente
COPY drizzle ./drizzle
COPY server ./server
COPY client ./client
COPY shared ./shared
COPY tsconfig.json vite.config.ts vitest.config.ts drizzle.config.ts ./

# Build de la aplicación
RUN pnpm build

# Establecer variables de entorno
ENV NODE_ENV=production
ENV PORT=3000

# Exponer puerto
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Comando para iniciar la aplicación
CMD ["node", "dist/index.js"]
