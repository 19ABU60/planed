# Frontend Dockerfile für PlanEd
FROM node:18-alpine AS builder

WORKDIR /app

# Install all dependencies including dev
COPY package*.json ./
COPY yarn.lock* ./
RUN npm install --legacy-peer-deps --force

# Copy source
COPY . .

# Build with warnings ignored
ENV CI=false
ENV DISABLE_ESLINT_PLUGIN=true
ENV SKIP_PREFLIGHT_CHECK=true
RUN npm run build || yarn build

# Production - serve with nginx
FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
