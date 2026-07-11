FROM nginx:alpine

RUN apk add --no-cache wget

WORKDIR /app

COPY configs/ /app/configs/
COPY index.html style.css /app/
COPY download_models.sh /app/
COPY nginx.conf /etc/nginx/conf.d/default.conf

RUN chmod +x /app/download_models.sh \
    && /app/download_models.sh \
    && cp -a /app/configs/bark-small/. /app/models/bark-small/

EXPOSE 7860

CMD ["nginx", "-g", "daemon off;"]
