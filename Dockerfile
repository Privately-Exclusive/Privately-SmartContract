FROM node:22-alpine
RUN apk update && \
    apk add --no-cache bash netcat-openbsd
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 8545