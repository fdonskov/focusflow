FROM node:20-alpine

WORKDIR /app

COPY package.json ./
# Ставим зависимости (package-lock создастся при первом npm install)
RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
