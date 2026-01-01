FROM node:20-alpine

WORKDIR /app

# Copy only package files first
COPY package.json package-lock.json* ./

# Clean install (more reliable)
RUN npm cache clean --force && npm install --legacy-peer-deps

# Copy app source
COPY . .

EXPOSE 5000

# start the server
CMD ["node", "server.js"]
