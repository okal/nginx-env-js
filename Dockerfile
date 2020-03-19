FROM nginx:alpine

EXPOSE 80
COPY nginx.conf /etc/nginx/nginx.conf
RUN mkdir /etc/nginx/scripts
COPY scripts /etc/nginx/scripts

CMD ["nginx", "-g", "daemon off;"]
