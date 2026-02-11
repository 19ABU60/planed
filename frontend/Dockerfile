# Frontend Dockerfile für PlanEd - Pre-built approach
FROM node:18-alpine AS builder

WORKDIR /app

# Copy everything
COPY . .

# Install and build
RUN npm install --legacy-peer-deps --force 2>/dev/null || yarn install --network-timeout 100000
ENV CI=false
ENV DISABLE_ESLINT_PLUGIN=true
RUN npm run build 2>/dev/null || yarn build

# Production
FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
