FROM node:18

WORKDIR /usr/src/app

RUN apt-get update && apt-get install -y netcat

COPY package*.json ./
RUN npm install

COPY . .

CMD [ "node","index.js" ]