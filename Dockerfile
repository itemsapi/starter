#FROM node:4.6.2
FROM node:6.9
MAINTAINER Matt Rzepa @cigolpl
RUN apt-get update
RUN npm install yarn -g 
RUN npm install pm2 -g 

RUN git clone https://github.com/itemsapi/starter.git /var/www/starter
WORKDIR /var/www/starter
RUN yarn install 
ENV PORT 3000
#ENV ELASTICSEARCH_URL ${ELASTICSEARCH_PORT_9200_TCP_ADDR}
ENV TESTING OK 

EXPOSE 3000

CMD ["npm", "start"]

