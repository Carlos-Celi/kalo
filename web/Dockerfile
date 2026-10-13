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
CMD ["npm", "run", "dev"]

FROM deps AS build
COPY --chown=node:node . .
RUN npm run build

FROM ${NGINX_IMAGE} AS preview
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
