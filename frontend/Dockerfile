FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

# Next.js production build can hang on worker spawning in some Windows Docker
# Desktop installations. Webpack dev mode keeps `docker compose up` reliable
# for this classroom/development stack while retaining the same App Router.
CMD ["npm", "run", "dev"]
