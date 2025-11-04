# --- Etapa 1: Construir el Cliente (React) ---
# Esta etapa ya la tenías bien.
FROM node:18-alpine AS client-builder
WORKDIR /app
COPY client/package.json client/package-lock.json ./client/
RUN npm install --prefix client
COPY client/ ./client/
# Esto usa el script "build" del client/package.json
RUN npm run build --prefix client

# --- Etapa 2: Preparar el Servidor (Node.js) ---
FROM node:18-alpine
WORKDIR /app

# --- ¡CORRECCIÓN 1! ---
# Copia el package.json de la RAÍZ (el que tiene el script 'start')
COPY package.json package-lock.json ./

# Instala las dependencias de la RAÍZ (que son las del servidor)
RUN npm install --omit=dev

# Copia el código de tu servidor
COPY server/ ./server/

# Copia los archivos construidos del cliente (de la Etapa 1) 
# a una carpeta 'public' dentro del servidor.
COPY --from=client-builder /app/client/build ./server/public

# Expone el puerto 5000 (que nos dijiste que usabas)
EXPOSE 5000

# --- ¡CORRECCIÓN 2! ---
# Usa el script "start" del package.json de la RAÍZ
CMD [ "npm", "start" ]