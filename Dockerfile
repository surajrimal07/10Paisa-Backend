FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY . .

COPY .env.sample .env

EXPOSE 4000 8081

CMD ["node", "index.js"]