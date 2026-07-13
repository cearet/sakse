# Stage 1: build the static site with Vite.
FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Optional override. Left empty by default so the app derives the backend
# address from the host it's opened on (works on localhost and on a phone via
# the Mac's LAN IP). Set this only to pin a fixed backend URL in production.
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Stage 2: serve the built files with nginx.
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
