# ----- Server Image ----
from node:11.13.0 as server

WORKDIR app

COPY package.json package-lock.json /app/
RUN npm i

COPY . /app/

ENV NODE_ENV production
ENV DEBUG www:server,speckle:*

CMD ["bin/www"]