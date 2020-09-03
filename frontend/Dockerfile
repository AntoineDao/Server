# ----- Front End Image ----
from node:11.13.0 as front-end

WORKDIR app

COPY package.json package-lock.json /app/
RUN npm i

COPY . /app/

RUN npm run build

CMD ["npm", "run", "serve"]