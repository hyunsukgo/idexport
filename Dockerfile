FROM node:8
MAINTAINER Nara Shin <whatauseless@gmail.com>

RUN mkdir -p /app
WORKDIR /app
COPY package*.json ./

RUN npm install
COPY . .

EXPOSE 3000
CMD ["npm", "start"]
