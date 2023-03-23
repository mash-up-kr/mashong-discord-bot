## declare base image - node 16
FROM node:18-alpine AS builder
## make work directory and copy files
WORKDIR /app
COPY . .
## project dependency install
RUN npm install -g pm2
RUN npm install
RUN npm run build

FROM node:18-alpine
WORKDIR /usr/src/app
COPY --from=builder /app ./

EXPOSE 3000
CMD pm2 start dist/main
