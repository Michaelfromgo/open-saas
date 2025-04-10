FROM nginx:alpine

COPY build /usr/share/nginx/html

# Configure Nginx to handle SPA routing
RUN echo "server { \
    listen 8043; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files \$uri \$uri/ /index.html; \
    } \
}" > /etc/nginx/conf.d/default.conf

EXPOSE 8043

CMD ["nginx", "-g", "daemon off;"] 