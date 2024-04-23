FROM node:18-alpine

WORKDIR /app
COPY . .
RUN npm ci
RUN npm run build

CMD ["sh", "-c", "node ./dist/server.js"]
