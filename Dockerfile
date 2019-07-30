FROM node:latest AS builder
WORKDIR /app
ADD package.json yarn.lock ./
RUN yarn install
Add ./ ./
RUN yarn build

FROM bitnami/node:12-prod
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/build ./build
COPY --from=builder /app/src/schema.graphql ./src/schema.graphql
ENV NODE_ENV="production"
CMD node build/main/index.js
