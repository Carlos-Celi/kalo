# syntax=docker/dockerfile:1

# Imagen de la web de Kalo para pruebas en local (ver docs/tecnica/entorno-local.md).
#   dev      Vite con recarga en caliente; el código se monta desde el host.
#   preview  Build de producción servido por nginx con las cabeceras de seguridad.

ARG NODE_IMAGE=node:24-alpine
ARG NGINX_IMAGE=nginxinc/nginx-unprivileged:1.29-alpine

FROM ${NODE_IMAGE} AS deps
WORKDIR /app
RUN chown node:node /app
USER node
COPY --chown=node:node package.json package-lock.json ./
RUN npm ci

FROM deps AS dev
ENV KALO_DOCKER=1
EXPOSE 5173
# Sincroniza dependencias al arrancar: el volumen de node_modules sobrevive
# a los cambios de package.json hechos desde el host.
CMD ["sh", "-c", "npm install --no-audit --no-fund && npm run dev"]

FROM deps AS build
# Valores públicos por diseño (ver .env.example); vacíos = modo demostración.
ARG VITE_SUPABASE_URL=""
ARG VITE_SUPABASE_PUBLISHABLE_KEY=""
ARG VITE_TURNSTILE_SITE_KEY=""
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY \
    VITE_TURNSTILE_SITE_KEY=$VITE_TURNSTILE_SITE_KEY
COPY --chown=node:node . .
RUN npm run build

FROM ${NGINX_IMAGE} AS preview
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
