FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install

COPY --chown=node:node . .

USER node

EXPOSE 4000 8081

CMD ["node", "start"]