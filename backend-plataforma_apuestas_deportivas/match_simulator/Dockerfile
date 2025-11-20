FROM node:18

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install 

COPY . .

CMD ["node", "match_simulator.js"]
