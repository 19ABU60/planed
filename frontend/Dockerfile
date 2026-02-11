# Frontend Dockerfile für PlanEd - Pre-built
FROM nginx:alpine

# Copy pre-built files
COPY ./build /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
