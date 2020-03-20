FROM nginx:alpine

EXPOSE 80

RUN mkdir /etc/nginx/scripts
COPY scripts /etc/nginx/scripts
COPY nginx.conf /etc/nginx/nginx.conf

ENV FACADE_URL "https://api.example.com"
ENV DEBUG_ENABLED true
ENV ANSWER 42

CMD ["nginx", "-g", "daemon off;"]
