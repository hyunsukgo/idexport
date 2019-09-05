FROM node:8
MAINTAINER Hyunseok Jung <hyunseokjung163@gmail.com>

RUN mkdir -p /app
WORKDIR /app
COPY package*.json ./

RUN npm install
COPY . .

EXPOSE 3000
CMD ["npm", "start"]
