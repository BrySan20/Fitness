# --- Etapa 1: Construir el Cliente (React) ---
FROM node:18-alpine AS client-builder

# Mover solo los package.json del cliente
WORKDIR /app
COPY client/package.json client/package-lock.json ./client/

# Instalar dependencias del cliente
RUN npm install --prefix client

# Copiar el resto del código del cliente
COPY client/ ./client/

# Construir la app de React
RUN npm run build --prefix client

# --- Etapa 2: Preparar el Servidor (Node.js) ---
FROM node:18-alpine

WORKDIR /app

# Mover solo los package.json del servidor
COPY server/package.json server/package-lock.json ./server/

# Instalar dependencias de producción del servidor
RUN npm install --prefix server --omit=dev

# Copiar el resto del código del servidor
COPY server/ ./server/

# Copiar los archivos construidos del cliente (de la Etapa 1) 
# a una carpeta 'public' dentro del servidor.
COPY --from=client-builder /app/client/build ./server/public

# Expone el puerto que usa tu servidor
EXPOSE 5000

# Comando para iniciar el servidor
CMD [ "npm", "start", "--prefix", "server" ]

